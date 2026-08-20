"""Constants for the Transelectrica SEN integration."""

DOMAIN = "energy_romania"
PLATFORMS = ["sensor"]

# API endpoint - real-time SEN data, no auth required
API_URL = "https://www.transelectrica.ro/sen-filter"

# Configuration keys
CONF_UPDATE_INTERVAL = "update_interval"

# Defaults
DEFAULT_UPDATE_INTERVAL = 60  # seconds (API refreshes ~every 10s)
MIN_UPDATE_INTERVAL = 30
MAX_UPDATE_INTERVAL = 3600

# API response keys for real-time values
API_KEY_CONSUMPTION = "CONS"
API_KEY_PRODUCTION = "PROD"
API_KEY_EXCHANGE_BALANCE = "SOLD"
API_KEY_COAL = "CARB"
API_KEY_HYDROCARBONS = "GAZE"
API_KEY_HYDRO = "APE"
API_KEY_NUCLEAR = "NUCL"
API_KEY_WIND = "EOLIAN"
API_KEY_SOLAR = "FOTO"
API_KEY_BIOMASS = "BMASA"
API_KEY_STORAGE = "ISPOZ"
API_KEY_TIMESTAMP = "row1_HARTASEN_DATA"

# 15-minute average keys (suffix "15")
API_KEY_CONSUMPTION_15 = "CONS15"
API_KEY_PRODUCTION_15 = "PROD15"  # not in response, computed if needed
API_KEY_COAL_15 = "CARB15"
API_KEY_HYDROCARBONS_15 = "GAZE15"
API_KEY_HYDRO_15 = "APE15"
API_KEY_NUCLEAR_15 = "NUCL15"
API_KEY_WIND_15 = "EOLIAN15"
API_KEY_SOLAR_15 = "FOTO15"
API_KEY_BIOMASS_15 = "BMASA15"

# Cross-border interconnection keys. Positive values mean import into Romania;
# negative values mean export from Romania.
INTERCONNECTION_KEYS = {
    # Hungary
    "BEKE1": "Bekescsaba 1",
    "SAND": "Sandorfalva",
    # Serbia
    "DJER": "Djerdap",
    "SIP_": "Sip",
    "PANCEVO21": "Pancevo 2.1",
    "PANCEVO22": "Pancevo 2.2",
    "KIKI": "Kikinda",
    # Bulgaria
    "KOZL1": "Kozlodui 1",
    "KOZL2": "Kozlodui 2",
    "VARN": "Varna",
    "DOBR": "Dobroudja",
    "KOZL115": "Kozlodui 1 (15min)",
    # Ukraine
    "MUKA": "Mukacevo",
    "PARO": "Porubnoe",
    # Moldova
    "COSE": "Costesti",
    "UNGE": "Ungheni",
    "CIOA": "Cioara",
    "GOTE": "Gotesti",
    "VULC": "Vulcanesti",
    "IAS2": "Iasi 2",
}

# Internal lines exposed by the endpoint (for example CHEF and MINT) are
# deliberately excluded from the border totals.
COUNTRY_INTERCONNECTION_KEYS = {
    "hungary": ("BEKE1", "SAND"),
    "serbia": ("DJER", "SIP_", "PANCEVO21", "PANCEVO22", "KIKI"),
    "bulgaria": ("KOZL1", "KOZL2", "VARN", "DOBR"),
    "ukraine": ("MUKA", "PARO"),
    "moldova": ("COSE", "UNGE", "CIOA", "GOTE", "VULC", "IAS2"),
}

COUNTRY_NAMES = {
    "hungary": "Hungary",
    "serbia": "Serbia",
    "bulgaria": "Bulgaria",
    "ukraine": "Ukraine",
    "moldova": "Moldova",
}

# Sensor definitions: (key, name, icon, unit, device_class, 15min_key)
SENSOR_TYPES = {
    API_KEY_CONSUMPTION: {
        "name": "Grid Consumption",
        "icon": "mdi:transmission-tower-import",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": API_KEY_CONSUMPTION_15,
    },
    API_KEY_PRODUCTION: {
        "name": "Grid Production",
        "icon": "mdi:transmission-tower-export",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": None,
    },
    API_KEY_EXCHANGE_BALANCE: {
        "name": "Exchange Balance",
        "icon": "mdi:swap-horizontal",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": None,
    },
    API_KEY_COAL: {
        "name": "Coal Generation",
        "icon": "mdi:fire",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": API_KEY_COAL_15,
    },
    API_KEY_HYDROCARBONS: {
        "name": "Hydrocarbon Generation",
        "icon": "mdi:gas-burner",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": API_KEY_HYDROCARBONS_15,
    },
    API_KEY_HYDRO: {
        "name": "Hydro Generation",
        "icon": "mdi:hydro-power",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": API_KEY_HYDRO_15,
    },
    API_KEY_NUCLEAR: {
        "name": "Nuclear Generation",
        "icon": "mdi:atom",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": API_KEY_NUCLEAR_15,
    },
    API_KEY_WIND: {
        "name": "Wind Generation",
        "icon": "mdi:wind-turbine",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": API_KEY_WIND_15,
    },
    API_KEY_SOLAR: {
        "name": "Solar Generation",
        "icon": "mdi:solar-power",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": API_KEY_SOLAR_15,
    },
    API_KEY_BIOMASS: {
        "name": "Biomass Generation",
        "icon": "mdi:leaf",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": API_KEY_BIOMASS_15,
    },
    API_KEY_STORAGE: {
        "name": "Storage",
        "icon": "mdi:battery-charging",
        "unit": "MW",
        "device_class": "power",
        "avg_15_key": None,
    },
}
