"""Automatic registration for the bundled Energy Romania Lovelace card."""

from __future__ import annotations

from datetime import datetime
import json
import logging
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_call_later

_LOGGER = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).parent
INTEGRATION_DIR = FRONTEND_DIR.parent
MANIFEST_PATH = INTEGRATION_DIR / "manifest.json"

URL_BASE = "/energy_romania_static"
CARD_FILENAME = "transelectrica-flow-card.js"
CARD_URL = f"{URL_BASE}/{CARD_FILENAME}"

RETRY_DELAY = 2
MAX_RETRIES = 15


def _get_integration_version() -> str:
    """Read the integration version from manifest.json."""

    try:
        with MANIFEST_PATH.open(
            "r",
            encoding="utf-8",
        ) as manifest_file:
            manifest = json.load(manifest_file)

        return str(
            manifest.get(
                "version",
                "0.0.0",
            )
        )

    except (
        OSError,
        ValueError,
        TypeError,
    ):
        _LOGGER.warning(
            "Could not read Energy Romania version "
            "from manifest.json"
        )

        return "0.0.0"


CARD_VERSION = _get_integration_version()


class JSModuleRegistration:
    """Serve and automatically register the Energy Romania Lovelace card."""

    def __init__(
        self,
        hass: HomeAssistant,
    ) -> None:
        """Initialize the frontend registrar."""

        self.hass = hass
        self._retry_count = 0

    async def async_register(self) -> None:
        """Register static frontend files and Lovelace resource."""

        await self._async_register_static_path()
        await self._async_register_lovelace_resource()

    async def _async_register_static_path(
        self,
    ) -> None:
        """Expose the bundled frontend directory through Home Assistant HTTP."""

        try:
            await self.hass.http.async_register_static_paths(
                [
                    StaticPathConfig(
                        URL_BASE,
                        str(FRONTEND_DIR),
                        False,
                    )
                ]
            )

            _LOGGER.debug(
                "Registered Energy Romania frontend path: %s",
                URL_BASE,
            )

        except RuntimeError:
            # This normally means the path was already registered,
            # for example after an integration reload.
            _LOGGER.debug(
                "Energy Romania frontend path is already registered"
            )

    async def _async_register_lovelace_resource(
        self,
    ) -> None:
        """Create or update the Lovelace JavaScript module resource."""

        lovelace = self.hass.data.get(
            "lovelace"
        )

        if lovelace is None:
            self._schedule_retry(
                "Lovelace data is not ready"
            )
            return

        resource_mode = getattr(
            lovelace,
            "resource_mode",
            getattr(
                lovelace,
                "mode",
                None,
            ),
        )

        if resource_mode != "storage":
            _LOGGER.warning(
                "Energy Romania cannot automatically add its Lovelace "
                "card because Lovelace resources are not using storage mode. "
                "Add %s manually as a JavaScript module.",
                CARD_URL,
            )
            return

        resources = getattr(
            lovelace,
            "resources",
            None,
        )

        if resources is None:
            self._schedule_retry(
                "Lovelace resources are not ready"
            )
            return

        # IMPORTANT:
        #
        # ResourceStorageCollection uses lazy loading in newer
        # Home Assistant versions.
        #
        # async_get_info() safely forces the collection to load
        # before async_items() is called.
        await resources.async_get_info()

        versioned_url = (
            f"{CARD_URL}?v={CARD_VERSION}"
        )

        existing = [
            item
            for item in resources.async_items()
            if str(
                item.get(
                    "url",
                    "",
                )
            ).split(
                "?",
                1,
            )[0]
            == CARD_URL
        ]

        # -------------------------------------------------
        # RESOURCE DOES NOT EXIST -> CREATE IT
        # -------------------------------------------------

        if not existing:
            await resources.async_create_item(
                {
                    "res_type": "module",
                    "url": versioned_url,
                }
            )

            _LOGGER.info(
                "Registered Energy Romania Lovelace card: %s",
                versioned_url,
            )

            self._retry_count = 0
            return

        # -------------------------------------------------
        # RESOURCE EXISTS -> UPDATE VERSION IF NECESSARY
        # -------------------------------------------------

        primary = existing[0]

        primary_id = primary.get(
            "id"
        )

        primary_url = str(
            primary.get(
                "url",
                "",
            )
        )

        primary_type = primary.get(
            "type"
        )

        if (
            primary_id
            and (
                primary_url != versioned_url
                or primary_type != "module"
            )
        ):
            await resources.async_update_item(
                primary_id,
                {
                    "res_type": "module",
                    "url": versioned_url,
                },
            )

            _LOGGER.info(
                "Updated Energy Romania Lovelace card resource to %s",
                versioned_url,
            )

        else:
            _LOGGER.debug(
                "Energy Romania Lovelace card is already registered: %s",
                versioned_url,
            )

        # -------------------------------------------------
        # REMOVE ACCIDENTAL DUPLICATES
        # -------------------------------------------------

        for duplicate in existing[1:]:
            duplicate_id = duplicate.get(
                "id"
            )

            if duplicate_id:
                await resources.async_delete_item(
                    duplicate_id
                )

                _LOGGER.warning(
                    "Removed duplicate Energy Romania Lovelace resource: %s",
                    duplicate.get(
                        "url",
                        "",
                    ),
                )

        self._retry_count = 0

    def _schedule_retry(
        self,
        reason: str,
    ) -> None:
        """Retry frontend registration when Lovelace is not ready yet."""

        if self._retry_count >= MAX_RETRIES:
            _LOGGER.error(
                "Energy Romania Lovelace card could not be registered "
                "after %s attempts: %s",
                MAX_RETRIES,
                reason,
            )
            return

        self._retry_count += 1

        _LOGGER.debug(
            "Energy Romania frontend registration retry %s/%s in %s seconds: %s",
            self._retry_count,
            MAX_RETRIES,
            RETRY_DELAY,
            reason,
        )

        async_call_later(
            self.hass,
            RETRY_DELAY,
            self._async_retry,
        )

    async def _async_retry(
        self,
        _now: datetime,
    ) -> None:
        """Retry registering the Lovelace resource."""

        await self._async_register_lovelace_resource()
