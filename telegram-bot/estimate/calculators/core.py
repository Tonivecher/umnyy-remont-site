from __future__ import annotations

from dataclasses import dataclass
from math import ceil
from pathlib import Path
from typing import Any

import yaml

from estimate.models import Room


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_NORMS_PATH = BASE_DIR / "norms_ru.yml"
DEFAULT_PRICES_PATH = BASE_DIR / "prices_moscow_tiers.yml"


@dataclass(frozen=True, slots=True)
class MaterialQuantity:
    code: str
    label: str
    quantity: float
    unit: str
    package_size: float
    package_unit: str
    packages: int


def _load_yaml(path: Path) -> dict[str, Any]:
    try:
        raw_text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise RuntimeError(f"Failed to read YAML file: {path}") from exc

    parsed = yaml.safe_load(raw_text)
    if not isinstance(parsed, dict):
        raise RuntimeError(f"YAML root must be mapping: {path}")
    return parsed


def load_norms(path: Path | None = None) -> dict[str, Any]:
    return _load_yaml(path or DEFAULT_NORMS_PATH)


def load_price_tiers(path: Path | None = None) -> dict[str, Any]:
    return _load_yaml(path or DEFAULT_PRICES_PATH)


def _as_float(value: Any, path: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise RuntimeError(f"Expected float at {path}, got {value!r}") from exc


def _as_int(value: Any, path: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise RuntimeError(f"Expected int at {path}, got {value!r}") from exc


def _packaging(quantity: float, package_size: float) -> int:
    if package_size <= 0:
        raise RuntimeError("package_size must be > 0")
    if quantity <= 0:
        return 0
    return int(ceil(quantity / package_size))


def _material_line(
    *,
    code: str,
    quantity: float,
    material_cfg: dict[str, Any],
) -> MaterialQuantity:
    label = str(material_cfg["label"])
    unit = str(material_cfg["unit"])
    package_size = _as_float(material_cfg["package_size"], f"materials.{code}.package_size")
    package_unit = str(material_cfg["package_unit"])
    packages = _packaging(quantity, package_size)
    return MaterialQuantity(
        code=code,
        label=label,
        quantity=quantity,
        unit=unit,
        package_size=package_size,
        package_unit=package_unit,
        packages=packages,
    )


def calculate_material_quantities(
    room: Room,
    norms: dict[str, Any] | None = None,
) -> list[MaterialQuantity]:
    room.validate()
    norms_data = norms or load_norms()
    materials = norms_data.get("materials")
    if not isinstance(materials, dict):
        raise RuntimeError("norms_ru.yml must contain mapping 'materials'.")

    paint_surface = room.wall_area_m2 + room.ceiling_area_m2 if room.walls_paint else 0.0
    tile_wall_surface = room.tile_wall_area_m2 if room.walls_tiles else 0.0
    tile_floor_surface = room.tile_floor_area_m2 if room.floor_tiles else 0.0
    tile_surface = tile_wall_surface + tile_floor_surface

    plaster_cfg = materials["plaster"]
    plaster_kg = 0.0
    if room.walls_plaster:
        plaster_kg = (
            room.wall_area_m2
            * room.plaster_thickness_mm
            * _as_float(
                plaster_cfg["consumption_per_m2_per_mm"],
                "materials.plaster.consumption_per_m2_per_mm",
            )
        )

    putty_cfg = materials["putty"]
    putty_kg = 0.0
    if room.walls_putty:
        putty_kg = room.wall_area_m2 * _as_float(
            putty_cfg["consumption_per_m2"], "materials.putty.consumption_per_m2"
        )

    primer_cfg = materials["primer"]
    primer_surface = 0.0
    if room.walls_paint:
        primer_surface += room.wall_area_m2 + room.ceiling_area_m2
    if room.walls_tiles:
        primer_surface += room.tile_wall_area_m2
    if room.floor_tiles:
        primer_surface += room.tile_floor_area_m2
    primer_l = primer_surface * _as_float(
        primer_cfg["consumption_per_m2"], "materials.primer.consumption_per_m2"
    )

    paint_cfg = materials["paint"]
    paint_l = 0.0
    if room.walls_paint:
        paint_l = (
            paint_surface
            * room.paint_layers
            * _as_float(
                paint_cfg["consumption_per_m2_per_layer"],
                "materials.paint.consumption_per_m2_per_layer",
            )
        )

    tile_glue_cfg = materials["tile_glue"]
    tile_glue_kg = tile_surface * _as_float(
        tile_glue_cfg["consumption_per_m2"], "materials.tile_glue.consumption_per_m2"
    )

    grout_cfg = materials["grout"]
    grout_kg = tile_surface * _as_float(grout_cfg["consumption_per_m2"], "materials.grout.consumption_per_m2")

    return [
        _material_line(code="plaster", quantity=plaster_kg, material_cfg=plaster_cfg),
        _material_line(code="putty", quantity=putty_kg, material_cfg=putty_cfg),
        _material_line(code="primer", quantity=primer_l, material_cfg=primer_cfg),
        _material_line(code="paint", quantity=paint_l, material_cfg=paint_cfg),
        _material_line(code="tile_glue", quantity=tile_glue_kg, material_cfg=tile_glue_cfg),
        _material_line(code="grout", quantity=grout_kg, material_cfg=grout_cfg),
    ]


def calculate_labor_breakdown(
    room: Room,
    tier: str,
    prices: dict[str, Any] | None = None,
) -> dict[str, float]:
    room.validate()
    prices_data = prices or load_price_tiers()
    tiers = prices_data.get("tiers")
    if not isinstance(tiers, dict):
        raise RuntimeError("prices_moscow_tiers.yml must contain mapping 'tiers'.")
    if tier not in tiers:
        raise RuntimeError(f"Unknown price tier: {tier}")

    tier_prices = tiers[tier]
    if not isinstance(tier_prices, dict):
        raise RuntimeError(f"Tier '{tier}' must be mapping.")

    paint_surface = room.wall_area_m2 + room.ceiling_area_m2 if room.walls_paint else 0.0
    primer_surface = 0.0
    if room.walls_paint:
        primer_surface += room.wall_area_m2 + room.ceiling_area_m2
    if room.walls_tiles:
        primer_surface += room.tile_wall_area_m2
    if room.floor_tiles:
        primer_surface += room.tile_floor_area_m2

    plaster_wall = (
        room.wall_area_m2 * _as_float(tier_prices["plaster_wall_m2"], f"tiers.{tier}.plaster_wall_m2")
        if room.walls_plaster
        else 0.0
    )
    putty_wall = (
        room.wall_area_m2 * _as_float(tier_prices["putty_wall_m2"], f"tiers.{tier}.putty_wall_m2")
        if room.walls_putty
        else 0.0
    )
    primer = primer_surface * _as_float(tier_prices["primer_m2"], f"tiers.{tier}.primer_m2")
    paint = (
        paint_surface
        * room.paint_layers
        * _as_float(tier_prices["paint_layer_m2"], f"tiers.{tier}.paint_layer_m2")
        if room.walls_paint
        else 0.0
    )
    tile_wall = (
        room.tile_wall_area_m2 * _as_float(tier_prices["tile_wall_m2"], f"tiers.{tier}.tile_wall_m2")
        if room.walls_tiles
        else 0.0
    )
    tile_floor = (
        room.tile_floor_area_m2 * _as_float(tier_prices["tile_floor_m2"], f"tiers.{tier}.tile_floor_m2")
        if room.floor_tiles
        else 0.0
    )
    screed = (
        room.area_m2 * _as_float(tier_prices["screed_floor_m2"], f"tiers.{tier}.screed_floor_m2")
        if room.floor_screed
        else 0.0
    )
    laminate = (
        room.area_m2 * _as_float(tier_prices["laminate_floor_m2"], f"tiers.{tier}.laminate_floor_m2")
        if room.floor_laminate
        else 0.0
    )
    electrical = room.electrical_points * _as_int(
        tier_prices["electrical_point_unit"], f"tiers.{tier}.electrical_point_unit"
    )
    plumbing = room.plumbing_points * _as_int(
        tier_prices["plumbing_point_unit"], f"tiers.{tier}.plumbing_point_unit"
    )

    return {
        "plaster_wall": plaster_wall,
        "putty_wall": putty_wall,
        "primer": primer,
        "paint": paint,
        "tile_wall": tile_wall,
        "tile_floor": tile_floor,
        "screed_floor": screed,
        "laminate_floor": laminate,
        "electrical_points": float(electrical),
        "plumbing_points": float(plumbing),
    }


def calculate_labor_totals_by_tier(
    room: Room,
    prices: dict[str, Any] | None = None,
) -> dict[str, float]:
    prices_data = prices or load_price_tiers()
    tiers = prices_data.get("tiers")
    if not isinstance(tiers, dict):
        raise RuntimeError("prices_moscow_tiers.yml must contain mapping 'tiers'.")

    totals: dict[str, float] = {}
    for tier in ("econom", "standard", "premium"):
        breakdown = calculate_labor_breakdown(room=room, tier=tier, prices=prices_data)
        totals[tier] = sum(breakdown.values())
    return totals
