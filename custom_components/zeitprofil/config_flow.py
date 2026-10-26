"""Config and options flow for Zeitprofil."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.const import ATTR_UNIT_OF_MEASUREMENT, CONF_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import selector
import voluptuous as vol

from .const import (
    CONF_HOLIDAY_SOURCE,
    CONF_INTERPOLATION,
    CONF_INTERVAL,
    CONF_MAX,
    CONF_MIN,
    CONF_STEP,
    CONF_TARGET,
    CONF_THRESHOLD,
    CONF_UNIT,
    DEFAULT_INTERPOLATION,
    DEFAULT_INTERVAL,
    DEFAULT_MAX,
    DEFAULT_MIN,
    DEFAULT_STEP,
    DEFAULT_THRESHOLD,
    DOMAIN,
    HOLIDAY_DOMAINS,
    INTERPOLATION_MODES,
    TARGET_DOMAINS,
)


def target_defaults(hass: HomeAssistant, entity_id: str) -> dict[str, Any]:
    """Derive min, max and unit from the target entity."""
    defaults: dict[str, Any] = {
        CONF_MIN: DEFAULT_MIN,
        CONF_MAX: DEFAULT_MAX,
        CONF_UNIT: "",
    }
    state = hass.states.get(entity_id)
    if state is None:
        return defaults
    domain = entity_id.split(".", 1)[0]
    if domain in ("climate", "water_heater"):
        keys = ("min_temp", "max_temp")
        defaults[CONF_UNIT] = hass.config.units.temperature_unit
    else:
        keys = ("min", "max")
        defaults[CONF_UNIT] = state.attributes.get(ATTR_UNIT_OF_MEASUREMENT) or ""
    try:
        minimum = float(state.attributes[keys[0]])
        maximum = float(state.attributes[keys[1]])
    except (KeyError, TypeError, ValueError):
        return defaults
    if minimum < maximum:
        defaults[CONF_MIN] = minimum
        defaults[CONF_MAX] = maximum
    return defaults


def _target_selector() -> selector.EntitySelector:
    return selector.EntitySelector(selector.EntitySelectorConfig(domain=TARGET_DOMAINS))


def _number(minimum: float, maximum: float) -> selector.NumberSelector:
    return selector.NumberSelector(
        selector.NumberSelectorConfig(
            min=minimum, max=maximum, step="any", mode=selector.NumberSelectorMode.BOX
        )
    )


def settings_schema(values: dict[str, Any], include_target: bool) -> vol.Schema:
    """Build the schema of the settings step."""
    fields: dict[Any, Any] = {}
    if include_target:
        fields[vol.Required(CONF_TARGET, default=values[CONF_TARGET])] = _target_selector()
    fields.update(
        {
            vol.Required(
                CONF_INTERVAL, default=values.get(CONF_INTERVAL, DEFAULT_INTERVAL)
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=1,
                    max=60,
                    step=1,
                    unit_of_measurement="min",
                    mode=selector.NumberSelectorMode.SLIDER,
                )
            ),
            vol.Required(
                CONF_INTERPOLATION,
                default=values.get(CONF_INTERPOLATION, DEFAULT_INTERPOLATION),
            ): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=INTERPOLATION_MODES,
                    translation_key="interpolation",
                    mode=selector.SelectSelectorMode.LIST,
                )
            ),
            vol.Required(CONF_MIN, default=values[CONF_MIN]): _number(-10000, 10000),
            vol.Required(CONF_MAX, default=values[CONF_MAX]): _number(-10000, 10000),
            vol.Required(CONF_STEP, default=values.get(CONF_STEP, DEFAULT_STEP)): _number(
                0.001, 1000
            ),
            vol.Optional(
                CONF_UNIT, description={"suggested_value": values.get(CONF_UNIT, "")}
            ): selector.TextSelector(),
            vol.Optional(
                CONF_HOLIDAY_SOURCE,
                description={"suggested_value": values.get(CONF_HOLIDAY_SOURCE)},
            ): selector.EntitySelector(selector.EntitySelectorConfig(domain=HOLIDAY_DOMAINS)),
            vol.Required(
                CONF_THRESHOLD, default=values.get(CONF_THRESHOLD, DEFAULT_THRESHOLD)
            ): _number(0, 1000),
        }
    )
    return vol.Schema(fields)


def validate_settings(user_input: dict[str, Any]) -> dict[str, str]:
    """Validate the settings step; return form errors."""
    errors: dict[str, str] = {}
    if float(user_input[CONF_MIN]) >= float(user_input[CONF_MAX]):
        errors[CONF_MAX] = "max_not_greater"
    if float(user_input[CONF_STEP]) <= 0:
        errors[CONF_STEP] = "step_positive"
    if float(user_input[CONF_THRESHOLD]) < 0:
        errors[CONF_THRESHOLD] = "threshold_negative"
    return errors


def clean_settings(user_input: dict[str, Any]) -> dict[str, Any]:
    """Normalize numeric types and optional fields."""
    result = dict(user_input)
    result[CONF_INTERVAL] = int(result[CONF_INTERVAL])
    for key in (CONF_MIN, CONF_MAX, CONF_STEP, CONF_THRESHOLD):
        result[key] = float(result[key])
    result[CONF_UNIT] = (result.get(CONF_UNIT) or "").strip()
    result[CONF_HOLIDAY_SOURCE] = result.get(CONF_HOLIDAY_SOURCE) or None
    return result


class ZeitprofilConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the initial setup."""

    VERSION = 1
    MINOR_VERSION = 1

    def __init__(self) -> None:
        """Initialize the flow."""
        self._name: str = ""
        self._target: str = ""

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Ask for name and target entity."""
        errors: dict[str, str] = {}
        if user_input is not None:
            self._name = user_input[CONF_NAME].strip()
            self._target = user_input[CONF_TARGET]
            if not self._name:
                errors[CONF_NAME] = "name_required"
            else:
                await self.async_set_unique_id(self._target)
                self._abort_if_unique_id_configured()
                return await self.async_step_settings()
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_NAME, default=self._name): selector.TextSelector(),
                    vol.Required(CONF_TARGET): _target_selector(),
                }
            ),
            errors=errors,
        )

    async def async_step_settings(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ask for the remaining settings."""
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = validate_settings(user_input)
            if not errors:
                return self.async_create_entry(
                    title=self._name,
                    data={CONF_NAME: self._name, CONF_TARGET: self._target},
                    options=clean_settings(user_input),
                )
            values = {**user_input}
        else:
            values = target_defaults(self.hass, self._target)
        return self.async_show_form(
            step_id="settings",
            data_schema=settings_schema(values, include_target=False),
            errors=errors,
            description_placeholders={"name": self._name},
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Return the options flow."""
        return ZeitprofilOptionsFlow()


class ZeitprofilOptionsFlow(OptionsFlow):
    """Change settings after setup."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the settings form."""
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = validate_settings(user_input)
            target = user_input[CONF_TARGET]
            if any(
                entry.unique_id == target and entry.entry_id != self.config_entry.entry_id
                for entry in self.hass.config_entries.async_entries(DOMAIN)
            ):
                errors[CONF_TARGET] = "target_in_use"
            if not errors:
                options = clean_settings(user_input)
                target = options.pop(CONF_TARGET)
                if target != self.config_entry.data[CONF_TARGET]:
                    self.hass.config_entries.async_update_entry(
                        self.config_entry,
                        data={**self.config_entry.data, CONF_TARGET: target},
                        unique_id=target,
                    )
                return self.async_create_entry(data=options)
            values = {**user_input}
        else:
            values = {
                **target_defaults(self.hass, self.config_entry.data[CONF_TARGET]),
                **self.config_entry.options,
                CONF_TARGET: self.config_entry.data[CONF_TARGET],
            }
        return self.async_show_form(
            step_id="init",
            data_schema=settings_schema(values, include_target=True),
            errors=errors,
        )
