"""Constants for the Curve Scheduler integration."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "curve_scheduler"

# Config entry keys
CONF_TARGET: Final = "target_entity"
CONF_INTERVAL: Final = "interval"
CONF_INTERPOLATION: Final = "interpolation"
CONF_MIN: Final = "min_value"
CONF_MAX: Final = "max_value"
CONF_STEP: Final = "step"
CONF_UNIT: Final = "unit"
CONF_HOLIDAY_SOURCE: Final = "holiday_source"
CONF_THRESHOLD: Final = "write_threshold"

DEFAULT_INTERVAL: Final = 5
DEFAULT_INTERPOLATION: Final = "curve"
DEFAULT_MIN: Final = 20.0
DEFAULT_MAX: Final = 70.0
DEFAULT_STEP: Final = 0.5
DEFAULT_THRESHOLD: Final = 0.0

INTERPOLATION_MODES: Final = ["step", "linear", "smooth", "curve"]

TARGET_DOMAINS: Final = ["number", "input_number", "climate", "water_heater"]
HOLIDAY_DOMAINS: Final = ["binary_sensor", "calendar"]

# Data model limits (mirrored in frontend/src/model.ts)
MIN_POINTS: Final = 1
MAX_POINTS: Final = 48
TIME_GRID_MINUTES: Final = 5
MINUTES_PER_DAY: Final = 1440
MAX_PROFILES: Final = 20
MAX_EXCEPTIONS: Final = 200
MAX_NAME_LENGTH: Final = 40
MAX_NOTE_LENGTH: Final = 100

WEEKDAYS: Final = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

# Reasons why a profile is active
REASON_WEEKDAY: Final = "weekday"
REASON_HOLIDAY: Final = "holiday"
REASON_EXCEPTION: Final = "exception"
REASON_OVERRIDE: Final = "override"

MODE_AUTO: Final = "auto"

STORAGE_VERSION: Final = 1
STORAGE_MINOR_VERSION: Final = 1

FRONTEND_URL_BASE: Final = "/curve_scheduler_static"
CARD_FILENAME: Final = "curve-scheduler-card.js"

SIGNAL_UPDATE: Final = "curve_scheduler_update_{}"

SERVICE_SET_OVERRIDE: Final = "set_override"
SERVICE_CLEAR_OVERRIDE: Final = "clear_override"
SERVICE_ADD_EXCEPTION: Final = "add_exception"
SERVICE_REMOVE_EXCEPTION: Final = "remove_exception"
SERVICE_APPLY_NOW: Final = "apply_now"

ATTR_CONFIG_ENTRY_ID: Final = "config_entry_id"
ATTR_PROFILE: Final = "profile"
ATTR_UNTIL: Final = "until"
ATTR_FROM: Final = "from"
ATTR_TO: Final = "to"
ATTR_NOTE: Final = "note"
ATTR_EXCEPTION_ID: Final = "exception_id"
ATTR_DATE: Final = "date"
