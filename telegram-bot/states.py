from aiogram.fsm.state import State, StatesGroup

class MeasureForm(StatesGroup):
    name = State()
    phone = State()
    address = State()
    area = State()
    budget = State()
    custom_budget = State()


class EstimateForm(StatesGroup):
    city = State()
    ceiling_height = State()
    room_name = State()
    room_area = State()
    room_height = State()
    room_geometry = State()
    room_type = State()
    walls_plaster = State()
    walls_putty = State()
    walls_paint = State()
    walls_tiles = State()
    floor_screed = State()
    floor_tiles = State()
    floor_laminate = State()
    electrical_points = State()
    plumbing_points = State()
    edit_room_select = State()
    edit_room_field = State()
    edit_room_value = State()
    remove_room_select = State()
