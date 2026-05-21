from __future__ import annotations

from math import ceil
from typing import Any

from estimate.calculators import calculate_labor_totals_by_tier, calculate_material_quantities
from estimate.session_store import (
    DEFAULT_CEILING_HEIGHT_M,
    DEFAULT_CITY,
    room_dict_to_model,
    resolve_room_geometry,
)


def _round_rub(value: float) -> float:
    return float(round(value))


def calculate_estimate_summary(payload: dict[str, Any]) -> dict[str, Any]:
    rooms = payload.get("rooms")
    if not isinstance(rooms, list) or not rooms:
        raise ValueError("В смете нет комнат. Добавьте хотя бы одну комнату.")

    ceiling_height_m = float(payload.get("ceiling_height_m", DEFAULT_CEILING_HEIGHT_M))

    labor_totals: dict[str, float] = {"econom": 0.0, "standard": 0.0, "premium": 0.0}
    material_totals: dict[str, dict[str, Any]] = {}
    assumptions: list[str] = [
        "Цены работ ориентировочные для Москвы и требуют уточнения на объекте.",
        "Количество упаковок материалов округляется в большую сторону.",
    ]
    room_assumptions: list[str] = []

    valid_rooms_count = 0
    for room_data in rooms:
        if not isinstance(room_data, dict):
            continue
        valid_rooms_count += 1

        room_model = room_dict_to_model(room_data, ceiling_height_m)
        room_model.validate()

        room_name = str(room_data.get("name", "Комната"))
        geometry = resolve_room_geometry(room_data, ceiling_height_m)
        raw_assumptions = geometry.get("assumptions", [])
        if isinstance(raw_assumptions, list):
            for assumption in raw_assumptions:
                room_assumptions.append(f"{room_name}: {assumption}")

        for tier_name, tier_total in calculate_labor_totals_by_tier(room_model).items():
            labor_totals[tier_name] += tier_total

        for material in calculate_material_quantities(room_model):
            bucket = material_totals.get(material.code)
            if bucket is None:
                bucket = {
                    "code": material.code,
                    "label": material.label,
                    "unit": material.unit,
                    "quantity": 0.0,
                    "package_size": material.package_size,
                    "package_unit": material.package_unit,
                }
            bucket["quantity"] = float(bucket["quantity"]) + material.quantity
            material_totals[material.code] = bucket

    if valid_rooms_count == 0:
        raise ValueError("Список комнат содержит некорректные записи.")

    materials: list[dict[str, Any]] = []
    for code in sorted(material_totals):
        item = material_totals[code]
        quantity = float(item["quantity"])
        package_size = float(item["package_size"])
        packages = int(ceil(quantity / package_size)) if quantity > 0 else 0
        materials.append(
            {
                "code": code,
                "label": item["label"],
                "quantity": quantity,
                "unit": item["unit"],
                "package_size": package_size,
                "package_unit": item["package_unit"],
                "packages": packages,
            }
        )

    standard_base = labor_totals["standard"]
    budget_scenarios = {
        "standard_base": _round_rub(standard_base),
        "standard_plus_10": _round_rub(standard_base * 1.10),
        "standard_plus_15": _round_rub(standard_base * 1.15),
        "premium_delta": _round_rub(labor_totals["premium"] - standard_base),
    }

    return {
        "city": str(payload.get("city", DEFAULT_CITY)),
        "rooms_count": valid_rooms_count,
        "labor_totals": {
            "econom": labor_totals["econom"],
            "standard": labor_totals["standard"],
            "premium": labor_totals["premium"],
        },
        "budget_scenarios": budget_scenarios,
        "materials": materials,
        "assumptions": assumptions,
        "room_assumptions": room_assumptions,
    }


def format_estimate_report(summary: dict[str, Any]) -> str:
    labor_totals = summary["labor_totals"]
    budget_scenarios = summary.get("budget_scenarios", {})
    materials = summary["materials"]
    assumptions = summary["assumptions"]
    room_assumptions = summary["room_assumptions"]

    header_lines = [
        "Предварительная смета (MVP):",
        f"- Город/регион: {summary['city']}",
        f"- Комнат: {summary['rooms_count']}",
        "",
        "Работы (сумма по всем комнатам):",
        f"- Econom: {float(labor_totals['econom']):.0f} ₽",
        f"- Standard: {float(labor_totals['standard']):.0f} ₽",
        f"- Premium: {float(labor_totals['premium']):.0f} ₽",
    ]

    materials_lines = ["Материалы (ориентировочно):"]
    for item in materials:
        materials_lines.append(
            f"- {item['label']}: {float(item['quantity']):.2f} {item['unit']} "
            f"(~{int(item['packages'])} {item['package_unit']})"
        )

    assumptions_lines = ["Допущения:"]
    for assumption in assumptions:
        assumptions_lines.append(f"- {assumption}")

    if room_assumptions:
        assumptions_lines.append("- Геометрия комнат:")
        for item in room_assumptions:
            assumptions_lines.append(f"  - {item}")
    else:
        assumptions_lines.append(
            "- Для расчета стен использована введенная геометрия без дополнительных допущений."
        )

    scenarios_lines = ["Сценарии бюджета:"]
    if isinstance(budget_scenarios, dict) and budget_scenarios:
        scenarios_lines.extend(
            [
                f"- Базовый Standard: {float(budget_scenarios.get('standard_base', 0.0)):.0f} ₽",
                f"- Standard + 10% резерв: {float(budget_scenarios.get('standard_plus_10', 0.0)):.0f} ₽",
                f"- Standard + 15% резерв: {float(budget_scenarios.get('standard_plus_15', 0.0)):.0f} ₽",
                f"- Разница Premium - Standard: {float(budget_scenarios.get('premium_delta', 0.0)):.0f} ₽",
            ]
        )

    return "\n\n".join(
        [
            "\n".join(header_lines),
            "\n".join(materials_lines),
            "\n".join(scenarios_lines),
            "\n".join(assumptions_lines),
        ]
    )
