"""Tests for the Transelectrica SEN integration."""

import sys
import os
from unittest.mock import MagicMock, patch

import pytest

# The custom_components.transelectrica package uses relative imports and
# __init__.py imports homeassistant, so we skip if homeassistant is unavailable.
pytest.importorskip("homeassistant")

from custom_components.energy_romania.api import TranselectricaAPI  # noqa: E402
from custom_components.energy_romania.const import (  # noqa: E402
    API_KEY_CONSUMPTION,
    API_KEY_PRODUCTION,
    API_KEY_EXCHANGE_BALANCE,
    API_KEY_COAL,
    API_KEY_HYDROCARBONS,
    API_KEY_HYDRO,
    API_KEY_NUCLEAR,
    API_KEY_WIND,
    API_KEY_SOLAR,
    API_KEY_BIOMASS,
    API_KEY_STORAGE,
    API_KEY_TIMESTAMP,
)
from custom_components.energy_romania.flows import (  # noqa: E402
    aggregate_all_borders,
    aggregate_flow,
)


# Sample API response (based on real data observed)
MOCK_API_RESPONSE = [
    {"CONS": "6158"},
    {"PROD": "6318"},
    {"SOLD": "-159"},
    {"CARB": "555"},
    {"GAZE": "1493"},
    {"APE": "2011"},
    {"NUCL": "1343"},
    {"EOLIAN": "859"},
    {"FOTO": "-9"},
    {"BMASA": "58"},
    {"ISPOZ": "5"},
    {"row1_HARTASEN_DATA": "26/3/15 21:59:00"},
    {"CONS15": "6227"},
    {"CARB15": "560"},
    {"GAZE15": "1521"},
    {"NUCL15": "1337"},
    {"EOLIAN15": "829"},
    {"FOTO15": "-9"},
    {"BMASA15": "58"},
    {"BEKE1": "59"},
    {"SAND": "162"},
    {"DJER": "202"},
    {"MUKA": "-89"},
    {"KOZL1": "0"},
    {"KOZL2": "383"},
    {"VARN": "-10"},
    {"DOBR": "-11"},
    {"VULC": "-936"},
]


def test_parse_response():
    """Test that the API response is parsed correctly."""
    result = TranselectricaAPI._parse_response(MOCK_API_RESPONSE)

    assert result[API_KEY_CONSUMPTION] == 6158.0
    assert result[API_KEY_PRODUCTION] == 6318.0
    assert result[API_KEY_EXCHANGE_BALANCE] == -159.0
    assert result[API_KEY_COAL] == 555.0
    assert result[API_KEY_HYDROCARBONS] == 1493.0
    assert result[API_KEY_HYDRO] == 2011.0
    assert result[API_KEY_NUCLEAR] == 1343.0
    assert result[API_KEY_WIND] == 859.0
    assert result[API_KEY_SOLAR] == -9.0
    assert result[API_KEY_BIOMASS] == 58.0
    assert result[API_KEY_STORAGE] == 5.0
    assert result[API_KEY_TIMESTAMP] == "26/3/15 21:59:00"


def test_parse_response_empty():
    """Test parsing an empty response."""
    result = TranselectricaAPI._parse_response([])
    assert result == {}


def test_parse_response_non_numeric():
    """Test parsing response with non-numeric values."""
    raw = [{"PROG": ""}, {"CONS": "5000"}]
    result = TranselectricaAPI._parse_response(raw)
    assert result["PROG"] == ""
    assert result["CONS"] == 5000.0


def test_aggregate_flow_splits_import_and_export():
    """Positive and negative counters are exposed independently."""
    result = aggregate_flow({"A": 120, "B": -45, "C": None}, ("A", "B", "C"))
    assert result == {"import": 120.0, "export": 45.0, "net": 75.0}


def test_aggregate_all_borders_keeps_simultaneous_flows():
    """Totals preserve counter-flows on different lines and borders."""
    result = aggregate_all_borders(
        {"HU1": 100, "HU2": -30, "BG1": 50, "MD1": -80},
        {"hungary": ("HU1", "HU2"), "bulgaria": ("BG1",), "moldova": ("MD1",)},
    )
    assert result == {"import": 150.0, "export": 110.0, "net": 40.0}
