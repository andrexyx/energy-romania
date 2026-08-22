"""The Energy Romania integration."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import CoreState, EVENT_HOMEASSISTANT_STARTED, HomeAssistant
from homeassistant.helpers import config_validation as cv

from .api import TranselectricaAPI
from .const import DOMAIN, PLATFORMS
from .coordinator import TranselectricaDataUpdateCoordinator
from .frontend import JSModuleRegistration

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Register the bundled Lovelace card."""
    await JSModuleRegistration(hass).async_register()


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up Energy Romania and register its frontend resources."""

    async def _register_frontend(_event=None) -> None:
        await _async_register_frontend(hass)

    # Register the card once for the whole integration.
    #
    # If Home Assistant is already running, register immediately.
    # Otherwise wait until HA has completely started so Lovelace is ready.
    if hass.state == CoreState.running:
        await _register_frontend()
    else:
        hass.bus.async_listen_once(
            EVENT_HOMEASSISTANT_STARTED,
            _register_frontend,
        )

    return True


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Set up Energy Romania from a config entry."""

    api = TranselectricaAPI()

    coordinator = TranselectricaDataUpdateCoordinator(
        hass,
        api,
        entry,
    )

    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})

    hass.data[DOMAIN][entry.entry_id] = {
        "coordinator": coordinator,
        "api": api,
    }

    await hass.config_entries.async_forward_entry_setups(
        entry,
        PLATFORMS,
    )

    entry.async_on_unload(
        entry.add_update_listener(
            _async_update_listener
        )
    )

    return True


async def async_unload_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Unload an Energy Romania config entry."""

    unload_ok = await hass.config_entries.async_unload_platforms(
        entry,
        PLATFORMS,
    )

    if unload_ok:
        data = hass.data[DOMAIN].pop(
            entry.entry_id
        )

        api = data["api"]

        await hass.async_add_executor_job(
            api.close
        )

        if not hass.data[DOMAIN]:
            hass.data.pop(DOMAIN, None)

    return unload_ok


async def _async_update_listener(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> None:
    """Reload the integration when options change."""

    await hass.config_entries.async_reload(
        entry.entry_id
    )
