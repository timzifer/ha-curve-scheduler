"""Actions (services) to control Zeitprofil from automations."""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
    callback,
)
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .const import (
    ATTR_CONFIG_ENTRY_ID,
    ATTR_DATE,
    ATTR_EXCEPTION_ID,
    ATTR_FROM,
    ATTR_NOTE,
    ATTR_PROFILE,
    ATTR_TO,
    ATTR_UNTIL,
    DOMAIN,
    MAX_NOTE_LENGTH,
    SERVICE_ADD_EXCEPTION,
    SERVICE_APPLY_NOW,
    SERVICE_CLEAR_OVERRIDE,
    SERVICE_REMOVE_EXCEPTION,
    SERVICE_SET_OVERRIDE,
)
from .model import ScheduleValidationError

if TYPE_CHECKING:
    from .runtime import ZeitprofilRuntime

ENTRY_SCHEMA = vol.Schema({vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string})

SET_OVERRIDE_SCHEMA = ENTRY_SCHEMA.extend(
    {vol.Required(ATTR_PROFILE): cv.string, vol.Optional(ATTR_UNTIL): cv.datetime}
)
ADD_EXCEPTION_SCHEMA = ENTRY_SCHEMA.extend(
    {
        vol.Required(ATTR_FROM): cv.date,
        vol.Optional(ATTR_TO): cv.date,
        vol.Required(ATTR_PROFILE): cv.string,
        vol.Optional(ATTR_NOTE, default=""): vol.All(cv.string, vol.Length(max=MAX_NOTE_LENGTH)),
    }
)
REMOVE_EXCEPTION_SCHEMA = vol.All(
    ENTRY_SCHEMA.extend(
        {vol.Optional(ATTR_EXCEPTION_ID): cv.string, vol.Optional(ATTR_DATE): cv.date}
    ),
    cv.has_at_least_one_key(ATTR_EXCEPTION_ID, ATTR_DATE),
)


def get_runtime(hass: HomeAssistant, entry_id: str) -> ZeitprofilRuntime:
    """Return the runtime of a loaded config entry or raise."""
    entry = hass.config_entries.async_get_entry(entry_id)
    if entry is None or entry.domain != DOMAIN or entry.state is not ConfigEntryState.LOADED:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="entry_not_found",
            translation_placeholders={"entry_id": entry_id},
        )
    runtime: ZeitprofilRuntime = entry.runtime_data
    return runtime


def _profile(runtime: ZeitprofilRuntime, value: str) -> str:
    profile_id = runtime.find_profile(value)
    if profile_id is None:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="unknown_profile",
            translation_placeholders={"profile": value},
        )
    return profile_id


def _raise_validation(err: ScheduleValidationError) -> None:
    issue = err.issues[0]
    raise ServiceValidationError(
        translation_domain=DOMAIN,
        translation_key="invalid_schedule",
        translation_placeholders={"problem": f"{issue.path}: {issue.code}"},
    ) from err


@callback
def async_register_services(hass: HomeAssistant) -> None:
    """Register all actions (non-admin users may call them)."""

    async def set_override(call: ServiceCall) -> None:
        runtime = get_runtime(hass, call.data[ATTR_CONFIG_ENTRY_ID])
        until: datetime | None = call.data.get(ATTR_UNTIL)
        if until is not None and until.tzinfo is None:
            until = until.replace(tzinfo=dt_util.get_default_time_zone())
        if until is not None and until <= dt_util.now():
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="until_in_past")
        await runtime.async_set_override(_profile(runtime, call.data[ATTR_PROFILE]), until)

    async def clear_override(call: ServiceCall) -> None:
        await get_runtime(hass, call.data[ATTR_CONFIG_ENTRY_ID]).async_clear_override()

    async def add_exception(call: ServiceCall) -> ServiceResponse:
        runtime = get_runtime(hass, call.data[ATTR_CONFIG_ENTRY_ID])
        start: date = call.data[ATTR_FROM]
        end: date = call.data.get(ATTR_TO, start)
        if end < start:
            raise ServiceValidationError(
                translation_domain=DOMAIN, translation_key="date_range_reversed"
            )
        try:
            exception_id = await runtime.async_add_exception(
                start, end, _profile(runtime, call.data[ATTR_PROFILE]), call.data[ATTR_NOTE]
            )
        except ScheduleValidationError as err:
            _raise_validation(err)
        return {"exception_id": exception_id}

    async def remove_exception(call: ServiceCall) -> ServiceResponse:
        runtime = get_runtime(hass, call.data[ATTR_CONFIG_ENTRY_ID])
        removed = await runtime.async_remove_exception(
            call.data.get(ATTR_EXCEPTION_ID), call.data.get(ATTR_DATE)
        )
        return {"removed": removed}

    async def apply_now(call: ServiceCall) -> None:
        await get_runtime(hass, call.data[ATTR_CONFIG_ENTRY_ID]).async_update(force=True)

    hass.services.async_register(DOMAIN, SERVICE_SET_OVERRIDE, set_override, SET_OVERRIDE_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_CLEAR_OVERRIDE, clear_override, ENTRY_SCHEMA)
    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_EXCEPTION,
        add_exception,
        ADD_EXCEPTION_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_REMOVE_EXCEPTION,
        remove_exception,
        REMOVE_EXCEPTION_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(DOMAIN, SERVICE_APPLY_NOW, apply_now, ENTRY_SCHEMA)
