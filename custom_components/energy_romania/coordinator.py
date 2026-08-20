"""Data update coordinator for the Transelectrica SEN integration."""

import logging
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator,
    UpdateFailed,
)

from .api import TranselectricaAPI, TranselectricaApiError
from .const import DOMAIN, DEFAULT_UPDATE_INTERVAL, CONF_UPDATE_INTERVAL

_LOGGER = logging.getLogger(__name__)


class TranselectricaDataUpdateCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinator to fetch data from Transelectrica SEN API."""

    def __init__(
        self,
        hass: HomeAssistant,
        api: TranselectricaAPI,
        entry: ConfigEntry,
    ) -> None:
        """Initialize the coordinator."""
        self.api = api
        self.entry = entry

        update_interval = entry.options.get(
            CONF_UPDATE_INTERVAL,
            entry.data.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL),
        )

        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=update_interval),
        )

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch data from the Transelectrica API.

        Returns:
            dict with all SEN data keys mapped to their values.

        Raises:
            UpdateFailed: If the API request fails.
        """
        try:
            data = await self.hass.async_add_executor_job(self.api.get_sen_data)
        except TranselectricaApiError as err:
            raise UpdateFailed(f"Error fetching Transelectrica data: {err}") from err

        if not data:
            raise UpdateFailed("Transelectrica API returned empty data")

        _LOGGER.debug("Transelectrica SEN data updated: %s", data)
        return data
