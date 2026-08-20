"""Helpers for aggregating Romanian cross-border electricity flows."""

from typing import Any, Iterable


def aggregate_flow(data: dict[str, Any], keys: Iterable[str]) -> dict[str, float]:
    """Return import, export and signed net values for a group of lines."""
    values: list[float] = []
    for key in keys:
        value = data.get(key)
        if value is None:
            continue
        try:
            values.append(float(value))
        except (TypeError, ValueError):
            continue

    imported = sum(value for value in values if value > 0)
    exported = -sum(value for value in values if value < 0)
    return {
        "import": round(imported, 1),
        "export": round(exported, 1),
        "net": round(imported - exported, 1),
    }


def aggregate_all_borders(
    data: dict[str, Any], country_keys: dict[str, Iterable[str]]
) -> dict[str, float]:
    """Return total import, export and signed net for all configured borders."""
    totals = {"import": 0.0, "export": 0.0, "net": 0.0}
    for keys in country_keys.values():
        flow = aggregate_flow(data, keys)
        for key in totals:
            totals[key] += flow[key]
    return {key: round(value, 1) for key, value in totals.items()}
