"""API client for Transelectrica SEN data."""

import logging
from typing import Any

import requests

from .const import API_URL

_LOGGER = logging.getLogger(__name__)

# Timeout for API requests in seconds
REQUEST_TIMEOUT = 15

# User-Agent header to avoid Cloudflare blocking
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


class TranselectricaApiError(Exception):
    """Exception for Transelectrica API errors."""


class TranselectricaAPI:
    """Client for the Transelectrica SEN real-time data API."""

    def __init__(self) -> None:
        """Initialize the API client."""
        self._session = requests.Session()
        self._session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "ro-RO,ro;q=0.9,en;q=0.8",
                "Referer": "https://www.transelectrica.ro/widget/web/tel/sen-harta",
            }
        )

    def get_sen_data(self) -> dict[str, Any]:
        """Fetch real-time SEN data from the /sen-filter endpoint.

        Returns a flat dict mapping API keys to their values (as floats).
        The raw API returns a JSON array of single-key objects like:
        [{"CONS": "6158"}, {"PROD": "6318"}, ...]

        Returns:
            dict: Mapping of API keys to numeric values.

        Raises:
            TranselectricaApiError: If the API request fails.
        """
        try:
            response = self._session.get(API_URL, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
        except requests.exceptions.Timeout as err:
            raise TranselectricaApiError(
                f"Timeout connecting to Transelectrica API: {err}"
            ) from err
        except requests.exceptions.ConnectionError as err:
            raise TranselectricaApiError(
                f"Connection error to Transelectrica API: {err}"
            ) from err
        except requests.exceptions.HTTPError as err:
            raise TranselectricaApiError(
                f"HTTP error from Transelectrica API: {err}"
            ) from err
        except requests.exceptions.RequestException as err:
            raise TranselectricaApiError(
                f"Error fetching Transelectrica data: {err}"
            ) from err

        try:
            raw_data = response.json()
        except ValueError as err:
            raise TranselectricaApiError(
                f"Invalid JSON response from Transelectrica API: {err}"
            ) from err

        return self._parse_response(raw_data)

    def validate_connection(self) -> bool:
        """Test if the API is reachable and returns valid data.

        Returns:
            True if the API returned valid data.

        Raises:
            TranselectricaApiError: If connection or parsing fails.
        """
        data = self.get_sen_data()
        if not data:
            raise TranselectricaApiError("API returned empty data")
        # Check for at least one expected key
        if "CONS" not in data and "PROD" not in data:
            raise TranselectricaApiError(
                "API response missing expected keys (CONS, PROD)"
            )
        return True

    @staticmethod
    def _parse_response(raw_data: list[dict[str, str]]) -> dict[str, Any]:
        """Parse the raw API response into a flat dict with numeric values.

        The API returns a list of single-key dicts:
        [{"CONS": "6158"}, {"PROD": "6318"}, {"row1_HARTASEN_DATA": "26/3/15 21:59:00"}, ...]

        Args:
            raw_data: The raw JSON response (list of dicts).

        Returns:
            Flat dict with all keys merged, numeric strings converted to floats.
        """
        result = {}
        for item in raw_data:
            for key, value in item.items():
                if key == "row1_HARTASEN_DATA":
                    # Keep timestamp as string
                    result[key] = value
                elif key in ("PROG", "Prot1TMS", "S110", "IS"):
                    # Non-numeric or internal keys - keep as string
                    result[key] = value
                else:
                    # Convert numeric values
                    try:
                        result[key] = float(value) if value else None
                    except (ValueError, TypeError):
                        result[key] = value
        return result

    def close(self) -> None:
        """Close the API session."""
        self._session.close()
