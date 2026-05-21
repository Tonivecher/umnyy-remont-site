#!/usr/bin/env python3
from __future__ import annotations

from math import ceil
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from estimate.calculators import calculate_labor_totals_by_tier, calculate_material_quantities
from estimate.models import Room


def main() -> None:
    rooms = [
        Room(
            name="Kitchen",
            area_m2=14.0,
            wall_area_m2=46.0,
            ceiling_area_m2=14.0,
            room_type="kitchen",
            paint_layers=2,
            plaster_thickness_mm=10.0,
            tile_wall_area_m2=18.0,
            tile_floor_area_m2=14.0,
            electrical_points=10,
            plumbing_points=4,
            walls_plaster=True,
            walls_putty=True,
            walls_paint=True,
            walls_tiles=True,
            floor_screed=True,
            floor_tiles=True,
            floor_laminate=False,
        ),
        Room(
            name="Bedroom",
            area_m2=18.0,
            wall_area_m2=52.0,
            ceiling_area_m2=18.0,
            room_type="bedroom",
            paint_layers=2,
            plaster_thickness_mm=10.0,
            tile_wall_area_m2=0.0,
            tile_floor_area_m2=0.0,
            electrical_points=8,
            plumbing_points=0,
            walls_plaster=True,
            walls_putty=True,
            walls_paint=True,
            walls_tiles=False,
            floor_screed=True,
            floor_tiles=False,
            floor_laminate=True,
        ),
    ]

    material_totals: dict[str, dict[str, float | str]] = {}
    labor_totals = {"econom": 0.0, "standard": 0.0, "premium": 0.0}

    for room in rooms:
        room_materials = calculate_material_quantities(room)
        for item in room_materials:
            bucket = material_totals.get(item.code)
            if bucket is None:
                bucket = {
                    "label": item.label,
                    "unit": item.unit,
                    "quantity": 0.0,
                    "package_size": item.package_size,
                    "package_unit": item.package_unit,
                }
            bucket["quantity"] = float(bucket["quantity"]) + item.quantity
            material_totals[item.code] = bucket

        room_labor = calculate_labor_totals_by_tier(room)
        for tier in labor_totals:
            labor_totals[tier] += room_labor[tier]

    print("Material quantities (2 rooms total):")
    for code in sorted(material_totals):
        item = material_totals[code]
        quantity = float(item["quantity"])
        package_size = float(item["package_size"])
        packages = int(ceil(quantity / package_size)) if quantity > 0 else 0
        print(
            f"- {item['label']}: {quantity:.2f} {item['unit']} "
            f"-> {packages} {item['package_unit']}(s) x {package_size:g} {item['unit']}"
        )

    print("\nLabor totals by tier (2 rooms total):")
    for tier in ("econom", "standard", "premium"):
        print(f"- {tier}: {labor_totals[tier]:.0f} RUB")


if __name__ == "__main__":
    main()
