"""Serve and register the Lovelace card shipped with the integration."""

from __future__ import annotations

import json
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from ..const import CARD_FILENAME, DOMAIN, FRONTEND_URL_BASE

FRONTEND_DIR = Path(__file__).parent
DATA_REGISTERED = f"{DOMAIN}_frontend_registered"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Serve the card and load it on every dashboard (no manual resource)."""
    if hass.data.get(DATA_REGISTERED):
        return
    card = FRONTEND_DIR / CARD_FILENAME
    manifest = json.loads(
        await hass.async_add_executor_job((FRONTEND_DIR.parent / "manifest.json").read_text)
    )
    url = f"{FRONTEND_URL_BASE}/{CARD_FILENAME}"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(url, str(card), cache_headers=False)]
    )
    # The version query parameter makes browsers fetch the new file after updates.
    add_extra_js_url(hass, f"{url}?v={manifest['version']}")
    hass.data[DATA_REGISTERED] = True
