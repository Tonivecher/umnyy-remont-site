from __future__ import annotations

from math import sqrt
from typing import Any

from estimate.models import Room


DEFAULT_CITY = "Москва"
DEFAULT_CEILING_HEIGHT_M = 2.7

STEP_GLOBAL_CITY = "global_city"
STEP_GLOBAL_CEILING = "global_ceiling"
STEP_ROOM_NAME = "room_name"
STEP_ROOM_AREA = "room_area"
STEP_ROOM_HEIGHT = "room_height"
STEP_ROOM_GEOMETRY = "room_geometry"
STEP_ROOM_TYPE = "room_type"
STEP_WALLS_PLASTER = "walls_plaster"
STEP_WALLS_PUTTY = "walls_putty"
STEP_WALLS_PAINT = "walls_paint"
STEP_WALLS_TILES = "walls_tiles"
STEP_FLOOR_SCREED = "floor_screed"
STEP_FLOOR_TILES = "floor_tiles"
STEP_FLOOR_LAMINATE = "floor_laminate"
STEP_ELECTRICAL_POINTS = "electrical_points"
STEP_PLUMBING_POINTS = "plumbing_points"
STEP_EDIT_ROOM_SELECT = "edit_room_select"
STEP_EDIT_ROOM_FIELD = "edit_room_field"
STEP_EDIT_ROOM_VALUE = "edit_room_value"
STEP_REMOVE_ROOM_SELECT = "remove_room_select"
STEP_READY_NEXT_ACTION = "ready_next_action"
STEP_FINISHED = "finished"

ROOM_TYPE_LABELS: dict[str, str] = {
    "kitchen": "Кухня",
    "bathroom": "Санузел",
    "bedroom": "Спальня",
    "living_room": "Гостиная",
    "hallway": "Коридор",
    "other": "Другое",
}

ROOM_TYPE_LABEL_TO_CODE: dict[str, str] = {
    label: code for code, label in ROOM_TYPE_LABELS.items()
}

ROOM_EDIT_FIELD_LABEL_TO_CODE: dict[str, str] = {
    "Площадь": "area_m2",
    "Высота": "ceiling_height_m",
    "Стены: штукатурка": "walls_plaster",
    "Стены: шпаклевка": "walls_putty",
    "Стены: покраска": "walls_paint",
    "Стены: плитка": "walls_tiles",
    "Пол: стяжка": "floor_screed",
    "Пол: плитка": "floor_tiles",
    "Пол: ламинат": "floor_laminate",
    "Электроточки": "electrical_points",
    "Сантехточки": "plumbing_points",
}


def new_estimate_payload() -> dict[str, Any]:
    return {
        "version": 1,
        "status": "in_progress",
        "step": STEP_GLOBAL_CITY,
        "city": DEFAULT_CITY,
        "ceiling_height_m": DEFAULT_CEILING_HEIGHT_M,
        "rooms": [],
        "draft_room": {},
        "edit_room_index": None,
        "edit_room_field": "",
    }


def normalize_estimate_payload(raw: dict[str, Any] | None) -> dict[str, Any]:
    payload = new_estimate_payload()
    if not raw:
        return payload

    payload["version"] = int(raw.get("version", 1))
    payload["status"] = str(raw.get("status", "in_progress"))
    payload["step"] = str(raw.get("step", STEP_GLOBAL_CITY))
    payload["city"] = str(raw.get("city", DEFAULT_CITY)).strip() or DEFAULT_CITY

    try:
        ceiling = float(raw.get("ceiling_height_m", DEFAULT_CEILING_HEIGHT_M))
    except (TypeError, ValueError):
        ceiling = DEFAULT_CEILING_HEIGHT_M
    payload["ceiling_height_m"] = ceiling

    rooms = raw.get("rooms", [])
    if isinstance(rooms, list):
        payload["rooms"] = [item for item in rooms if isinstance(item, dict)]
    else:
        payload["rooms"] = []

    draft_room = raw.get("draft_room", {})
    payload["draft_room"] = draft_room if isinstance(draft_room, dict) else {}
    payload["edit_room_index"] = raw.get("edit_room_index")
    payload["edit_room_field"] = str(raw.get("edit_room_field", ""))
    return payload


def new_draft_room() -> dict[str, Any]:
    return {
        "name": "",
        "area_m2": 0.0,
        "ceiling_height_m": None,
        "perimeter_m": None,
        "length_m": None,
        "width_m": None,
        "room_type": "other",
        "walls_plaster": True,
        "walls_putty": True,
        "walls_paint": True,
        "walls_tiles": False,
        "floor_screed": True,
        "floor_tiles": False,
        "floor_laminate": False,
        "electrical_points": 0,
        "plumbing_points": 0,
    }


def room_type_label(room_type: str) -> str:
    return ROOM_TYPE_LABELS.get(room_type, ROOM_TYPE_LABELS["other"])


def requires_plumbing(room_type: str) -> bool:
    return room_type in {"kitchen", "bathroom"}


def yes_no_label(value: bool) -> str:
    return "да" if value else "нет"


def summarize_room(
    room: dict[str, Any],
    index: int,
    default_ceiling_height_m: float = DEFAULT_CEILING_HEIGHT_M,
) -> str:
    name = str(room.get("name", f"Комната {index}"))
    area = float(room.get("area_m2", 0.0))
    room_type = str(room.get("room_type", "other"))
    geometry = resolve_room_geometry(room, default_ceiling_height_m)
    height_value = geometry["ceiling_height_m"]
    perimeter_value = geometry["perimeter_m"]
    geometry_method = geometry["method_label"]
    walls = (
        f"штукатурка {yes_no_label(bool(room.get('walls_plaster')))}, "
        f"шпаклевка {yes_no_label(bool(room.get('walls_putty')))}, "
        f"покраска {yes_no_label(bool(room.get('walls_paint')))}, "
        f"плитка {yes_no_label(bool(room.get('walls_tiles')))}"
    )
    floor = (
        f"стяжка {yes_no_label(bool(room.get('floor_screed')))}, "
        f"плитка {yes_no_label(bool(room.get('floor_tiles')))}, "
        f"ламинат {yes_no_label(bool(room.get('floor_laminate')))}"
    )
    electrical_points = int(room.get("electrical_points", 0))
    plumbing_points = int(room.get("plumbing_points", 0))
    return (
        f"{index}. {name}\n"
        f"- Тип: {room_type_label(room_type)}\n"
        f"- Площадь пола: {area:.1f} м²\n"
        f"- Высота: {height_value:.2f} м\n"
        f"- Периметр: {perimeter_value:.2f} м ({geometry_method})\n"
        f"- Стены: {walls}\n"
        f"- Пол: {floor}\n"
        f"- Электроточки: {electrical_points}\n"
        f"- Сантехточки: {plumbing_points}"
    )


def _as_positive_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number <= 0:
        return None
    return number


def resolve_room_geometry(room: dict[str, Any], default_ceiling_height_m: float) -> dict[str, Any]:
    area_m2 = float(room.get("area_m2", 0.0))

    room_height = _as_positive_float(room.get("ceiling_height_m"))
    if room_height is None:
        room_height = default_ceiling_height_m
        height_source = "global_default"
    else:
        height_source = "room_specific"

    perimeter_m = _as_positive_float(room.get("perimeter_m"))
    length_m = _as_positive_float(room.get("length_m"))
    width_m = _as_positive_float(room.get("width_m"))

    if perimeter_m is not None:
        method = "perimeter_input"
        method_label = "периметр пользователя"
    elif length_m is not None and width_m is not None:
        perimeter_m = 2.0 * (length_m + width_m)
        method = "dimensions_input"
        method_label = "расчет из длины/ширины"
    else:
        side = sqrt(max(area_m2, 0.0))
        perimeter_m = side * 4.0
        method = "square_assumption"
        method_label = "допущение: квадрат по площади"

    wall_area_m2 = perimeter_m * room_height
    assumptions: list[str] = []
    if method == "square_assumption":
        assumptions.append("Периметр рассчитан по допущению квадратной комнаты.")
    if height_source == "global_default":
        assumptions.append("Высота комнаты взята из общего значения сессии.")

    return {
        "area_m2": area_m2,
        "ceiling_height_m": room_height,
        "height_source": height_source,
        "perimeter_m": perimeter_m,
        "length_m": length_m,
        "width_m": width_m,
        "method": method,
        "method_label": method_label,
        "wall_area_m2": wall_area_m2,
        "assumptions": assumptions,
    }


def _tile_wall_factor(room_type: str) -> float:
    if room_type == "bathroom":
        return 0.85
    if room_type == "kitchen":
        return 0.45
    return 0.25


def room_dict_to_model(room: dict[str, Any], ceiling_height_m: float) -> Room:
    geometry = resolve_room_geometry(room, ceiling_height_m)
    area_m2 = geometry["area_m2"]
    wall_area_m2 = geometry["wall_area_m2"]
    room_type = str(room.get("room_type", "other"))
    walls_tiles = bool(room.get("walls_tiles", False))
    floor_tiles = bool(room.get("floor_tiles", False))

    tile_wall_area_m2 = wall_area_m2 * _tile_wall_factor(room_type) if walls_tiles else 0.0
    tile_floor_area_m2 = area_m2 if floor_tiles else 0.0

    walls_paint = bool(room.get("walls_paint", True))
    paint_layers = 2 if walls_paint else 0

    walls_plaster = bool(room.get("walls_plaster", True))
    plaster_thickness_mm = 10.0 if walls_plaster else 0.0

    return Room(
        name=str(room.get("name", "Комната")).strip() or "Комната",
        area_m2=area_m2,
        wall_area_m2=wall_area_m2,
        ceiling_area_m2=area_m2,
        room_type=room_type,
        paint_layers=paint_layers,
        plaster_thickness_mm=plaster_thickness_mm,
        tile_wall_area_m2=tile_wall_area_m2,
        tile_floor_area_m2=tile_floor_area_m2,
        electrical_points=int(room.get("electrical_points", 0)),
        plumbing_points=int(room.get("plumbing_points", 0)),
        walls_plaster=walls_plaster,
        walls_putty=bool(room.get("walls_putty", True)),
        walls_paint=walls_paint,
        walls_tiles=walls_tiles,
        floor_screed=bool(room.get("floor_screed", True)),
        floor_tiles=floor_tiles,
        floor_laminate=bool(room.get("floor_laminate", False)),
    )
