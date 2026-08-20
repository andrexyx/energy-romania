"""Automatic registration for the bundled Lovelace card."""

import logging
from pathlib import Path
from typing import Any

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_call_later

_LOGGER = logging.getLogger(__name__)
URL_BASE = "/energy_romania_static"
CARD_URL = f"{URL_BASE}/transelectrica-flow-card.js"
CARD_VERSION = "1.0.1"


class JSModuleRegistration:
    """Serve and automatically add the card to Lovelace resources."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.lovelace = hass.data.get("lovelace")

    async def async_register(self) -> None:
        """Register the static path and the storage-mode resource."""
        try:
            await self.hass.http.async_register_static_paths(
                [StaticPathConfig(URL_BASE, str(Path(__file__).parent), False)]
            )
        except RuntimeError:
            _LOGGER.debug("Transelectrica frontend path is already registered")

        if self.lovelace is not None and self.lovelace.mode == "storage":
            await self._async_wait_for_resources()

    async def _async_wait_for_resources(self) -> None:
        async def _check_loaded(_now: Any) -> None:
            if self.lovelace.resources.loaded:
                await self._async_register_resource()
            else:
                async_call_later(self.hass, 5, _check_loaded)

        await _check_loaded(0)

    async def _async_register_resource(self) -> None:
        versioned_url = f"{CARD_URL}?v={CARD_VERSION}"
        existing = [
            item
            for item in self.lovelace.resources.async_items()
            if item["url"].split("?")[0] == CARD_URL
        ]
        if not existing:
            await self.lovelace.resources.async_create_item(
                {"res_type": "module", "url": versioned_url}
            )
            return
        if existing[0]["url"] != versioned_url:
            await self.lovelace.resources.async_update_item(
                existing[0]["id"],
                {"res_type": "module", "url": versioned_url},
            )
