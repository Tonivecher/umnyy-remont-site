from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal


FinishTier = Literal["econom", "standard", "premium"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(slots=True)
class Room:
    name: str
    area_m2: float
    wall_area_m2: float
    ceiling_area_m2: float
    room_type: str = "other"
    paint_layers: int = 2
    plaster_thickness_mm: float = 10.0
    tile_wall_area_m2: float = 0.0
    tile_floor_area_m2: float = 0.0
    electrical_points: int = 0
    plumbing_points: int = 0
    walls_plaster: bool = True
    walls_putty: bool = True
    walls_paint: bool = True
    walls_tiles: bool = False
    floor_screed: bool = True
    floor_tiles: bool = False
    floor_laminate: bool = False

    def validate(self) -> None:
        if not self.name.strip():
            raise ValueError("Room.name must not be empty.")
        if self.area_m2 <= 0:
            raise ValueError("Room.area_m2 must be > 0.")
        if self.wall_area_m2 < 0 or self.ceiling_area_m2 < 0:
            raise ValueError("Room wall/ceiling areas must be >= 0.")
        if self.paint_layers <= 0:
            if self.walls_paint:
                raise ValueError("Room.paint_layers must be > 0 when walls_paint is enabled.")
        if self.plaster_thickness_mm <= 0 and self.walls_plaster:
            raise ValueError(
                "Room.plaster_thickness_mm must be > 0 when walls_plaster is enabled."
            )
        if self.tile_wall_area_m2 < 0 or self.tile_floor_area_m2 < 0:
            raise ValueError("Room tile areas must be >= 0.")
        if self.electrical_points < 0 or self.plumbing_points < 0:
            raise ValueError("Room points must be >= 0.")

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "area_m2": self.area_m2,
            "wall_area_m2": self.wall_area_m2,
            "ceiling_area_m2": self.ceiling_area_m2,
            "room_type": self.room_type,
            "paint_layers": self.paint_layers,
            "plaster_thickness_mm": self.plaster_thickness_mm,
            "tile_wall_area_m2": self.tile_wall_area_m2,
            "tile_floor_area_m2": self.tile_floor_area_m2,
            "electrical_points": self.electrical_points,
            "plumbing_points": self.plumbing_points,
            "walls_plaster": self.walls_plaster,
            "walls_putty": self.walls_putty,
            "walls_paint": self.walls_paint,
            "walls_tiles": self.walls_tiles,
            "floor_screed": self.floor_screed,
            "floor_tiles": self.floor_tiles,
            "floor_laminate": self.floor_laminate,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Room:
        return cls(
            name=str(data.get("name", "")),
            area_m2=float(data.get("area_m2", 0.0)),
            wall_area_m2=float(data.get("wall_area_m2", 0.0)),
            ceiling_area_m2=float(data.get("ceiling_area_m2", 0.0)),
            room_type=str(data.get("room_type", "other")),
            paint_layers=int(data.get("paint_layers", 2)),
            plaster_thickness_mm=float(data.get("plaster_thickness_mm", 10.0)),
            tile_wall_area_m2=float(data.get("tile_wall_area_m2", 0.0)),
            tile_floor_area_m2=float(data.get("tile_floor_area_m2", 0.0)),
            electrical_points=int(data.get("electrical_points", 0)),
            plumbing_points=int(data.get("plumbing_points", 0)),
            walls_plaster=bool(data.get("walls_plaster", True)),
            walls_putty=bool(data.get("walls_putty", True)),
            walls_paint=bool(data.get("walls_paint", True)),
            walls_tiles=bool(data.get("walls_tiles", False)),
            floor_screed=bool(data.get("floor_screed", True)),
            floor_tiles=bool(data.get("floor_tiles", False)),
            floor_laminate=bool(data.get("floor_laminate", False)),
        )


@dataclass(slots=True)
class EstimateSession:
    user_id: int
    rooms: list[Room] = field(default_factory=list)
    tier: FinishTier = "standard"
    city: str = "moscow"
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    notes: str = ""

    def validate(self) -> None:
        if self.user_id <= 0:
            raise ValueError("EstimateSession.user_id must be > 0.")
        if self.tier not in ("econom", "standard", "premium"):
            raise ValueError("EstimateSession.tier must be econom|standard|premium.")
        if not self.city.strip():
            raise ValueError("EstimateSession.city must not be empty.")
        for room in self.rooms:
            room.validate()

    def touch(self) -> None:
        self.updated_at = utc_now()

    def to_dict(self) -> dict[str, Any]:
        return {
            "user_id": self.user_id,
            "rooms": [room.to_dict() for room in self.rooms],
            "tier": self.tier,
            "city": self.city,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "notes": self.notes,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> EstimateSession:
        raw_rooms = data.get("rooms", [])
        rooms: list[Room] = []
        if isinstance(raw_rooms, list):
            for item in raw_rooms:
                if isinstance(item, dict):
                    rooms.append(Room.from_dict(item))

        def parse_dt(key: str) -> datetime:
            raw = data.get(key)
            if not raw:
                return utc_now()
            if isinstance(raw, datetime):
                return raw
            return datetime.fromisoformat(str(raw))

        return cls(
            user_id=int(data.get("user_id", 0)),
            rooms=rooms,
            tier=str(data.get("tier", "standard")),  # type: ignore[arg-type]
            city=str(data.get("city", "moscow")),
            created_at=parse_dt("created_at"),
            updated_at=parse_dt("updated_at"),
            notes=str(data.get("notes", "")),
        )
