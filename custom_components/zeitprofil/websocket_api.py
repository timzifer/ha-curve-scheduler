"""Websocket commands used by the card.

None of the commands require admin rights: every Home Assistant user may read
and edit schedules.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, callback
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .const import DOMAIN
from .model import ScheduleValidationError, validate_schedule
from .runtime import RevisionConflictError, ZeitprofilRuntime

ERR_NOT_FOUND = "not_found"
ERR_INVALID = "invalid_schedule"
ERR_CONFLICT = "revision_conflict"


def _runtime(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> ZeitprofilRuntime | None:
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN or entry.state is not ConfigEntryState.LOADED:
        connection.send_error(
            msg["id"],
            ERR_NOT_FOUND,
            "Instance not found",
            translation_domain=DOMAIN,
            translation_key="entry_not_found",
            translation_placeholders={"entry_id": msg["entry_id"]},
        )
        return None
    runtime: ZeitprofilRuntime = entry.runtime_data
    return runtime


@callback
def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register the commands."""
    websocket_api.async_register_command(hass, ws_list)
    websocket_api.async_register_command(hass, ws_get)
    websocket_api.async_register_command(hass, ws_save)
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_preview)
    websocket_api.async_register_command(hass, ws_holidays)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/list"})
@callback
def ws_list(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """List all loaded instances."""
    result = []
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is not ConfigEntryState.LOADED:
            continue
        runtime: ZeitprofilRuntime = entry.runtime_data
        result.append(
            {"entry_id": entry.entry_id, "title": entry.title, "config": runtime.config_dict()}
        )
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/get", vol.Required("entry_id"): str}
)
@callback
def ws_get(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return configuration, schedule, revision and live state."""
    if runtime := _runtime(hass, connection, msg):
        connection.send_result(msg["id"], runtime.as_dict())


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/save",
        vol.Required("entry_id"): str,
        vol.Required("revision"): int,
        vol.Required("schedule"): dict,
    }
)
@websocket_api.async_response
async def ws_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Validate and store the schedule.

    Rejected with ``revision_conflict`` if somebody else saved in between.
    Validation problems are returned as a list of ``{code, path, params}``
    so the card can translate them.
    """
    runtime = _runtime(hass, connection, msg)
    if runtime is None:
        return
    try:
        revision = await runtime.async_save_schedule(msg["schedule"], msg["revision"])
    except RevisionConflictError as err:
        connection.send_result(msg["id"], {"ok": False, "conflict": True, "revision": err.revision})
        return
    except ScheduleValidationError as err:
        connection.send_result(
            msg["id"],
            {"ok": False, "conflict": False, "errors": [i.as_dict() for i in err.issues]},
        )
        return
    connection.send_result(msg["id"], {"ok": True, "revision": revision})


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/subscribe", vol.Required("entry_id"): str}
)
@callback
def ws_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Send the full state now and after every change (live update)."""
    runtime = _runtime(hass, connection, msg)
    if runtime is None:
        return
    msg_id = msg["id"]

    @callback
    def forward() -> None:
        connection.send_message(websocket_api.event_message(msg_id, runtime.as_dict()))

    connection.subscriptions[msg_id] = runtime.async_add_listener(forward)
    connection.send_result(msg_id)
    forward()


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/preview",
        vol.Required("entry_id"): str,
        vol.Optional("date"): str,
        vol.Optional("schedule"): dict,
        vol.Optional("step_minutes", default=5): vol.All(int, vol.Range(min=1, max=60)),
    }
)
@websocket_api.async_response
async def ws_preview(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return the backend-computed curve of one day (for cross-checking)."""
    runtime = _runtime(hass, connection, msg)
    if runtime is None:
        return
    try:
        day = date.fromisoformat(msg["date"]) if "date" in msg else dt_util.now().date()
    except ValueError:
        connection.send_error(msg["id"], "invalid_format", "Invalid date")
        return
    schedule = msg.get("schedule")
    if schedule is not None:
        issues = validate_schedule(schedule, runtime.minimum, runtime.maximum)
        if issues:
            connection.send_result(
                msg["id"], {"ok": False, "errors": [i.as_dict() for i in issues]}
            )
            return
    await runtime.holidays.async_ensure(day - timedelta(days=2), day + timedelta(days=2))
    curve = runtime.preview(day, schedule, msg["step_minutes"])
    connection.send_result(
        msg["id"], {"ok": True, "date": day.isoformat(), "mode": runtime.mode, "curve": curve}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/holidays",
        vol.Required("entry_id"): str,
        vol.Required("start"): str,
        vol.Required("end"): str,
    }
)
@websocket_api.async_response
async def ws_holidays(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return the days off reported by the holiday source in a date range."""
    runtime = _runtime(hass, connection, msg)
    if runtime is None:
        return
    try:
        start = date.fromisoformat(msg["start"])
        end = date.fromisoformat(msg["end"])
    except ValueError:
        connection.send_error(msg["id"], "invalid_format", "Invalid date")
        return
    days = await runtime.holidays.async_holidays(start, end)
    connection.send_result(
        msg["id"],
        {"configured": runtime.holidays.configured, "holidays": [d.isoformat() for d in days]},
    )
