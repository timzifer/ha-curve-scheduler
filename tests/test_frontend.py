"""Test that the card is served and registered automatically."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL
from homeassistant.core import HomeAssistant

from custom_components.zeitprofil.frontend import async_register_frontend


async def test_register_frontend(hass: HomeAssistant) -> None:
    hass.http = MagicMock()
    hass.http.async_register_static_paths = AsyncMock()
    hass.data[DATA_EXTRA_MODULE_URL] = set()

    await async_register_frontend(hass)
    await async_register_frontend(hass)  # second call is a no-op

    hass.http.async_register_static_paths.assert_awaited_once()
    config = hass.http.async_register_static_paths.call_args[0][0][0]
    assert config.url_path == "/zeitprofil_static/zeitprofil-card.js"
    assert config.path.endswith("frontend/zeitprofil-card.js")
    (url,) = hass.data[DATA_EXTRA_MODULE_URL]
    assert url.startswith("/zeitprofil_static/zeitprofil-card.js?v=")
