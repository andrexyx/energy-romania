"""Automatic registration for the bundled Lovelace card."""

import logging
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)
URL_BASE = "/energy_romania_static"
CARD_URL = f"{URL_BASE}/transelectrica-flow-card.js"
CARD_VERSION = "1.1.1"


class JSModuleRegistration:
    """Serve and automatically add the card to Lovelace resources."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def async_register(self) -> None:
        """Register the static path and the storage-mode resource."""
        try:
            await self.hass.http.async_register_static_paths(
                [StaticPathConfig(URL_BASE, str(Path(__file__).parent), False)]
            )
        except RuntimeError:
            _LOGGER.debug("Transelectrica frontend path is already registered")

        # Lovelace is a manifest dependency, so its data is available here.
        # Newer Home Assistant versions expose ``resource_mode``; older ones
        # used ``mode``. Supporting both keeps the custom integration usable
        # across supported HA releases.
        lovelace = self.hass.data.get("lovelace")
        if lovelace is None:
            raise RuntimeError("Lovelace data is not available")

        resource_mode = getattr(
            lovelace, "resource_mode", getattr(lovelace, "mode", None)
        )
        if resource_mode != "storage":
            _LOGGER.warning(
                "Energy Romania card cannot be registered automatically "
                "because Lovelace resources are not in storage mode"
            )
            return

        self.resources = lovelace.resources
        if not self.resources.loaded:
            await self.resources.async_load()
        await self._async_register_resource()

    async def _async_register_resource(self) -> None:
        versioned_url = f"{CARD_URL}?v={CARD_VERSION}"
        existing = [
            item
            for item in self.resources.async_items()
            if item["url"].split("?")[0] == CARD_URL
        ]
        if not existing:
            await self.resources.async_create_item(
                {"res_type": "module", "url": versioned_url}
            )
            return
        if existing[0]["url"] != versioned_url:
            await self.resources.async_update_item(
                existing[0]["id"],
                {"res_type": "module", "url": versioned_url},
            )
