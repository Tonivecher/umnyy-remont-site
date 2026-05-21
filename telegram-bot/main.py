import asyncio
import json
import signal
import traceback
from typing import Any
from aiogram import BaseMiddleware, Bot, Dispatcher, F
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web
from aiogram.types import (
    Message,
    FSInputFile,
    WebAppInfo,
    MenuButtonWebApp,
    ReplyKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardRemove,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    CallbackQuery
)
from aiogram.filters import Command, CommandStart, StateFilter
from aiogram.fsm.context import FSMContext

from config import (
    BOT_TOKEN,
    ADMIN_ID,
    MINI_APP_URL,
    MINI_APP_HOST,
    MINI_APP_PORT,
    MINI_APP_DEV_USER_ID,
    MINI_APP_AUTH_MAX_AGE_SECONDS,
    ENABLE_MINI_APP_SERVER,
    BOT_TRANSPORT,
    WEBHOOK_PATH,
    WEBHOOK_URL,
    WEBHOOK_SECRET_TOKEN,
    TELEGRAM_CHANNEL_URL,
    PUBLIC_SITE_URL,
    BOT_PUBLIC_URL,
)
from db import EstimateSessionRepository, get_default_database
from estimate.reporting import calculate_estimate_summary, format_estimate_report
from estimate.session_store import (
    DEFAULT_CEILING_HEIGHT_M,
    DEFAULT_CITY,
    ROOM_EDIT_FIELD_LABEL_TO_CODE,
    ROOM_TYPE_LABEL_TO_CODE,
    STEP_ELECTRICAL_POINTS,
    STEP_EDIT_ROOM_FIELD,
    STEP_EDIT_ROOM_SELECT,
    STEP_EDIT_ROOM_VALUE,
    STEP_FINISHED,
    STEP_FLOOR_LAMINATE,
    STEP_FLOOR_SCREED,
    STEP_FLOOR_TILES,
    STEP_GLOBAL_CEILING,
    STEP_GLOBAL_CITY,
    STEP_PLUMBING_POINTS,
    STEP_READY_NEXT_ACTION,
    STEP_ROOM_AREA,
    STEP_ROOM_GEOMETRY,
    STEP_ROOM_HEIGHT,
    STEP_ROOM_NAME,
    STEP_ROOM_TYPE,
    STEP_REMOVE_ROOM_SELECT,
    STEP_WALLS_PAINT,
    STEP_WALLS_PLASTER,
    STEP_WALLS_PUTTY,
    STEP_WALLS_TILES,
    new_draft_room,
    new_estimate_payload,
    normalize_estimate_payload,
    requires_plumbing,
    resolve_room_geometry,
    summarize_room,
)
from miniapp import MiniAppServer
from states import EstimateForm, MeasureForm
from services.google_sheets import add_lead


def debug_log(event: str, **kwargs):
    parts = [f"event={event}"]
    for key, value in kwargs.items():
        parts.append(f"{key}={value!r}")
    print("[FSM_DEBUG] " + " ".join(parts))


def normalize_lead_source(value: str) -> str:
    allowed = "abcdefghijklmnopqrstuvwxyz0123456789_-"
    normalized = "".join(char for char in value.lower() if char in allowed).strip("_-")
    return normalized[:48] or "telegram"


def parse_measure_start_arg(start_arg: str) -> str | None:
    normalized = (start_arg or "").strip().lower()
    if normalized == "measure":
        return "telegram_deeplink"

    prefix = "measure_"
    if normalized.startswith(prefix):
        return normalize_lead_source(normalized[len(prefix):])

    return None


def parse_estimate_start_arg(start_arg: str) -> str | None:
    normalized = (start_arg or "").strip().lower()
    if normalized == "estimate":
        return "telegram_estimate"

    prefix = "estimate_"
    if normalized.startswith(prefix):
        return normalize_lead_source(normalized[len(prefix):])

    return None


class ErrorLoggingMiddleware(BaseMiddleware):
    async def __call__(self, handler, event, data):
        try:
            return await handler(event, data)
        except Exception as exc:
            print(
                f"[FSM_ERROR] event_type={type(event).__name__} error={exc!r}"
            )
            print(traceback.format_exc())
            raise


async def main():
    print("[STARTUP] Initializing bot...")
    database = get_default_database()
    print(database.startup_log_line())
    await database.create_tables()
    print("[STARTUP][DB] Schema init completed (idempotent)")

    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()
    dp.update.outer_middleware(ErrorLoggingMiddleware())
    estimate_repo = EstimateSessionRepository(database)
    mini_app_server: MiniAppServer | None = None
    webhook_runner: web.AppRunner | None = None

    if ENABLE_MINI_APP_SERVER and BOT_TRANSPORT != "webhook":
        mini_app_server = MiniAppServer(
            host=MINI_APP_HOST,
            port=MINI_APP_PORT,
            bot_token=BOT_TOKEN,
            estimate_repo=estimate_repo,
            dev_user_id=MINI_APP_DEV_USER_ID,
            auth_max_age_seconds=MINI_APP_AUTH_MAX_AGE_SECONDS,
        )
        await mini_app_server.start()
    elif ENABLE_MINI_APP_SERVER and BOT_TRANSPORT == "webhook":
        print("[STARTUP][MINIAPP] server=disabled reason=webhook_transport")
    else:
        print("[STARTUP][MINIAPP] server=disabled")

    if MINI_APP_URL:
        print(f"[STARTUP][MINIAPP] launch_url={MINI_APP_URL}")
    else:
        print("[STARTUP][MINIAPP] launch_url=not_set fallback=chat_commands")

    async def configure_mini_app_menu_button() -> None:
        if not MINI_APP_URL:
            print("[STARTUP][MINIAPP] menu_button=skipped reason=launch_url_not_set")
            return

        try:
            await bot.set_chat_menu_button(
                menu_button=MenuButtonWebApp(
                    text="Умный расчёт",
                    web_app=WebAppInfo(url=MINI_APP_URL),
                )
            )
            print("[STARTUP][MINIAPP] menu_button=web_app")
        except Exception as exc:
            print(f"[STARTUP][MINIAPP] menu_button_error={exc!r}")

    await configure_mini_app_menu_button()

    async def configure_bot_transport() -> None:
        nonlocal webhook_runner

        if BOT_TRANSPORT == "polling":
            await bot.delete_webhook(drop_pending_updates=False)
            print("[STARTUP][BOT] transport=polling")
            return

        if not WEBHOOK_URL:
            raise RuntimeError("WEBHOOK_URL is required when BOT_TRANSPORT=webhook")

        app = web.Application()
        SimpleRequestHandler(
            dispatcher=dp,
            bot=bot,
            secret_token=WEBHOOK_SECRET_TOKEN,
        ).register(app, path=WEBHOOK_PATH)
        setup_application(app, dp, bot=bot)

        webhook_runner = web.AppRunner(app)
        await webhook_runner.setup()
        site = web.TCPSite(webhook_runner, host=MINI_APP_HOST, port=MINI_APP_PORT)
        await site.start()

        await bot.set_webhook(
            url=WEBHOOK_URL,
            allowed_updates=dp.resolve_used_update_types(),
            drop_pending_updates=False,
            secret_token=WEBHOOK_SECRET_TOKEN,
        )
        print(f"[STARTUP][BOT] transport=webhook url={WEBHOOK_URL}")

    await configure_bot_transport()

    def main_menu_keyboard() -> ReplyKeyboardMarkup:
        estimate_button = (
            KeyboardButton(text="Рассчитать ремонт", web_app=WebAppInfo(url=MINI_APP_URL))
            if MINI_APP_URL
            else KeyboardButton(text="Рассчитать ремонт")
        )
        return ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="Оставить заявку"), estimate_button],
                [KeyboardButton(text="Канал"), KeyboardButton(text="Сайт")],
            ],
            resize_keyboard=True,
        )

    def mini_app_open_keyboard() -> InlineKeyboardMarkup | None:
        if not MINI_APP_URL:
            return None
        return InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="Рассчитать ремонт", web_app=WebAppInfo(url=MINI_APP_URL))],
                [InlineKeyboardButton(text="Оставить заявку", url=f"{BOT_PUBLIC_URL}?start=measure_bot_cta")],
                [InlineKeyboardButton(text="Канал с советами", url=TELEGRAM_CHANNEL_URL)],
            ]
        )

    def yes_no_keyboard() -> ReplyKeyboardMarkup:
        return ReplyKeyboardMarkup(
            keyboard=[[KeyboardButton(text="Да"), KeyboardButton(text="Нет")]],
            resize_keyboard=True,
        )

    def room_type_keyboard() -> ReplyKeyboardMarkup:
        return ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="Кухня"), KeyboardButton(text="Санузел")],
                [KeyboardButton(text="Спальня"), KeyboardButton(text="Гостиная")],
                [KeyboardButton(text="Коридор"), KeyboardButton(text="Другое")],
            ],
            resize_keyboard=True,
        )

    def estimate_actions_keyboard() -> ReplyKeyboardMarkup:
        return ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="Добавить комнату"), KeyboardButton(text="Список комнат")],
                [KeyboardButton(text="Редактировать комнату"), KeyboardButton(text="Удалить комнату")],
                [KeyboardButton(text="Завершить смету"), KeyboardButton(text="Сбросить смету")],
            ],
            resize_keyboard=True,
        )

    def room_edit_fields_keyboard() -> ReplyKeyboardMarkup:
        return ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="Площадь"), KeyboardButton(text="Высота")],
                [KeyboardButton(text="Стены: штукатурка"), KeyboardButton(text="Стены: шпаклевка")],
                [KeyboardButton(text="Стены: покраска"), KeyboardButton(text="Стены: плитка")],
                [KeyboardButton(text="Пол: стяжка"), KeyboardButton(text="Пол: плитка")],
                [KeyboardButton(text="Пол: ламинат")],
                [KeyboardButton(text="Электроточки"), KeyboardButton(text="Сантехточки")],
            ],
            resize_keyboard=True,
        )

    def split_for_telegram(text: str, limit: int = 3800) -> list[str]:
        normalized = text.strip()
        if len(normalized) <= limit:
            return [normalized]

        lines = normalized.splitlines()
        chunks: list[str] = []
        current = ""
        for line in lines:
            line_with_break = f"{line}\n"
            if len(current) + len(line_with_break) <= limit:
                current += line_with_break
                continue
            if current.strip():
                chunks.append(current.strip())
            if len(line_with_break) <= limit:
                current = line_with_break
                continue
            start = 0
            while start < len(line_with_break):
                end = min(start + limit, len(line_with_break))
                chunks.append(line_with_break[start:end].strip())
                start = end
            current = ""

        if current.strip():
            chunks.append(current.strip())
        return chunks

    async def send_long_text(
        message: Message,
        text: str,
        reply_markup: ReplyKeyboardMarkup | ReplyKeyboardRemove | None = None,
    ) -> None:
        chunks = split_for_telegram(text)
        for index, chunk in enumerate(chunks):
            is_last = index == len(chunks) - 1
            await message.answer(
                chunk,
                reply_markup=reply_markup if is_last else None,
            )

    def estimate_user_id(message: Message) -> int:
        if message.from_user:
            return message.from_user.id
        return message.chat.id

    async def load_estimate_payload(user_id: int) -> dict[str, Any] | None:
        record = await estimate_repo.get_session(user_id)
        if not record:
            return None
        try:
            raw_payload = json.loads(record.session_json)
        except (TypeError, ValueError):
            return None
        if not isinstance(raw_payload, dict):
            return None
        return normalize_estimate_payload(raw_payload)

    async def save_estimate_payload(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        normalized = normalize_estimate_payload(payload)
        session_json = json.dumps(normalized, ensure_ascii=False)
        await estimate_repo.upsert_session(user_id=user_id, session_json=session_json)
        return normalized

    async def remove_estimate_payload(user_id: int) -> None:
        await estimate_repo.delete_session(user_id)

    def parse_yes_no(value: str | None) -> bool | None:
        text = (value or "").strip().lower()
        if text in {"да", "yes", "y", "+", "1"}:
            return True
        if text in {"нет", "no", "n", "-", "0"}:
            return False
        return None

    def parse_positive_float(value: str | None) -> float | None:
        text = (value or "").strip().replace(",", ".")
        try:
            number = float(text)
        except ValueError:
            return None
        if number <= 0:
            return None
        return number

    def parse_nonnegative_int(value: str | None) -> int | None:
        text = (value or "").strip()
        if not text:
            return None
        if not text.isdigit():
            return None
        return int(text)

    def parse_room_index(value: str | None, rooms_count: int) -> int | None:
        text = (value or "").strip()
        if not text:
            return None
        if "." in text:
            text = text.split(".", 1)[0].strip()
        if not text.isdigit():
            return None
        index = int(text)
        if index < 1 or index > rooms_count:
            return None
        return index

    def parse_geometry_input(value: str | None) -> dict[str, float | str | None] | None:
        text = (value or "").strip().lower().replace(" ", "")
        text = text.replace("х", "x").replace("*", "x")
        if text in {"", "-", "нет"}:
            return {"mode": "square", "perimeter_m": None, "length_m": None, "width_m": None}

        if "x" in text:
            left, right = text.split("x", 1)
            length_m = parse_positive_float(left)
            width_m = parse_positive_float(right)
            if length_m is None or width_m is None:
                return None
            return {
                "mode": "dimensions",
                "perimeter_m": None,
                "length_m": length_m,
                "width_m": width_m,
            }

        perimeter_m = parse_positive_float(text)
        if perimeter_m is None:
            return None
        return {
            "mode": "perimeter",
            "perimeter_m": perimeter_m,
            "length_m": None,
            "width_m": None,
        }

    async def set_state_from_estimate_step(state: FSMContext, step: str) -> None:
        if step == STEP_GLOBAL_CITY:
            await state.set_state(EstimateForm.city)
            return
        if step == STEP_GLOBAL_CEILING:
            await state.set_state(EstimateForm.ceiling_height)
            return
        if step == STEP_ROOM_NAME:
            await state.set_state(EstimateForm.room_name)
            return
        if step == STEP_ROOM_AREA:
            await state.set_state(EstimateForm.room_area)
            return
        if step == STEP_ROOM_HEIGHT:
            await state.set_state(EstimateForm.room_height)
            return
        if step == STEP_ROOM_GEOMETRY:
            await state.set_state(EstimateForm.room_geometry)
            return
        if step == STEP_ROOM_TYPE:
            await state.set_state(EstimateForm.room_type)
            return
        if step == STEP_WALLS_PLASTER:
            await state.set_state(EstimateForm.walls_plaster)
            return
        if step == STEP_WALLS_PUTTY:
            await state.set_state(EstimateForm.walls_putty)
            return
        if step == STEP_WALLS_PAINT:
            await state.set_state(EstimateForm.walls_paint)
            return
        if step == STEP_WALLS_TILES:
            await state.set_state(EstimateForm.walls_tiles)
            return
        if step == STEP_FLOOR_SCREED:
            await state.set_state(EstimateForm.floor_screed)
            return
        if step == STEP_FLOOR_TILES:
            await state.set_state(EstimateForm.floor_tiles)
            return
        if step == STEP_FLOOR_LAMINATE:
            await state.set_state(EstimateForm.floor_laminate)
            return
        if step == STEP_ELECTRICAL_POINTS:
            await state.set_state(EstimateForm.electrical_points)
            return
        if step == STEP_PLUMBING_POINTS:
            await state.set_state(EstimateForm.plumbing_points)
            return
        if step == STEP_EDIT_ROOM_SELECT:
            await state.set_state(EstimateForm.edit_room_select)
            return
        if step == STEP_EDIT_ROOM_FIELD:
            await state.set_state(EstimateForm.edit_room_field)
            return
        if step == STEP_EDIT_ROOM_VALUE:
            await state.set_state(EstimateForm.edit_room_value)
            return
        if step == STEP_REMOVE_ROOM_SELECT:
            await state.set_state(EstimateForm.remove_room_select)
            return
        await state.clear()

    async def prompt_estimate_step(message: Message, payload: dict[str, Any]) -> None:
        step = str(payload.get("step", STEP_GLOBAL_CITY))
        rooms = payload.get("rooms", [])
        room_number = len(rooms) + 1 if isinstance(rooms, list) else 1

        if step == STEP_GLOBAL_CITY:
            await message.answer(
                "Расчет сметы.\n"
                f"Шаг 1/2: укажите город/регион (по умолчанию {DEFAULT_CITY}).\n"
                "Можно отправить '-' для значения по умолчанию.",
                reply_markup=ReplyKeyboardRemove(),
            )
            return

        if step == STEP_GLOBAL_CEILING:
            await message.answer(
                "Шаг 2/2: укажите высоту потолка в метрах (например 2.7).\n"
                f"Можно отправить '-' для значения по умолчанию ({DEFAULT_CEILING_HEIGHT_M}).",
                reply_markup=ReplyKeyboardRemove(),
            )
            return

        if step == STEP_ROOM_NAME:
            await message.answer(
                f"Комната #{room_number}: введите название комнаты (например: Кухня-гостиная).",
                reply_markup=ReplyKeyboardRemove(),
            )
            return

        if step == STEP_ROOM_AREA:
            await message.answer(
                "Площадь пола комнаты (м²), например: 18.5",
                reply_markup=ReplyKeyboardRemove(),
            )
            return

        if step == STEP_ROOM_HEIGHT:
            await message.answer(
                "Высота комнаты в метрах (например 2.8).\n"
                "Можно отправить '-' чтобы использовать общую высоту сессии.",
                reply_markup=ReplyKeyboardRemove(),
            )
            return

        if step == STEP_ROOM_GEOMETRY:
            await message.answer(
                "Для точного периметра стен отправьте:\n"
                "- периметр в метрах (например: 17.4)\n"
                "- или размеры в формате ДxШ (например: 5x3.2)\n"
                "- или '-' если принять допущение квадратной комнаты по площади.",
                reply_markup=ReplyKeyboardRemove(),
            )
            return

        if step == STEP_ROOM_TYPE:
            await message.answer(
                "Тип комнаты:",
                reply_markup=room_type_keyboard(),
            )
            return

        if step == STEP_WALLS_PLASTER:
            await message.answer("Стены: нужна штукатурка? (Да/Нет)", reply_markup=yes_no_keyboard())
            return
        if step == STEP_WALLS_PUTTY:
            await message.answer("Стены: нужна шпаклевка? (Да/Нет)", reply_markup=yes_no_keyboard())
            return
        if step == STEP_WALLS_PAINT:
            await message.answer("Стены/потолок: нужна покраска? (Да/Нет)", reply_markup=yes_no_keyboard())
            return
        if step == STEP_WALLS_TILES:
            await message.answer("Стены: нужна плитка? (Да/Нет)", reply_markup=yes_no_keyboard())
            return
        if step == STEP_FLOOR_SCREED:
            await message.answer("Пол: нужна стяжка? (Да/Нет)", reply_markup=yes_no_keyboard())
            return
        if step == STEP_FLOOR_TILES:
            await message.answer("Пол: плитка? (Да/Нет)", reply_markup=yes_no_keyboard())
            return
        if step == STEP_FLOOR_LAMINATE:
            await message.answer("Пол: ламинат? (Да/Нет)", reply_markup=yes_no_keyboard())
            return
        if step == STEP_ELECTRICAL_POINTS:
            await message.answer(
                "Сколько всего электроточек в комнате (розетки/выключатели/светильники)?",
                reply_markup=ReplyKeyboardRemove(),
            )
            return
        if step == STEP_PLUMBING_POINTS:
            await message.answer(
                "Сколько сантехточек (гор/хол вода + канализация)?",
                reply_markup=ReplyKeyboardRemove(),
            )
            return

        if step == STEP_EDIT_ROOM_SELECT:
            rooms = payload.get("rooms", [])
            if not isinstance(rooms, list) or not rooms:
                await message.answer(
                    "Комнат для редактирования нет.",
                    reply_markup=estimate_actions_keyboard(),
                )
                return
            lines = ["Выберите номер комнаты для редактирования:"]
            for index, room in enumerate(rooms, start=1):
                if not isinstance(room, dict):
                    continue
                lines.append(f"- {index}. {room.get('name', f'Комната {index}')}")
            await message.answer(
                "\n".join(lines),
                reply_markup=ReplyKeyboardRemove(),
            )
            return

        if step == STEP_EDIT_ROOM_FIELD:
            await message.answer(
                "Что изменить в выбранной комнате?",
                reply_markup=room_edit_fields_keyboard(),
            )
            return

        if step == STEP_EDIT_ROOM_VALUE:
            field_code = str(payload.get("edit_room_field", ""))
            if field_code in {"walls_plaster", "walls_putty", "walls_paint", "walls_tiles", "floor_screed", "floor_tiles", "floor_laminate"}:
                await message.answer(
                    "Выберите значение:",
                    reply_markup=yes_no_keyboard(),
                )
                return
            if field_code == "area_m2":
                await message.answer("Введите новую площадь пола (м²), например 16.8")
                return
            if field_code == "ceiling_height_m":
                await message.answer(
                    "Введите новую высоту комнаты в метрах (например 2.9) "
                    "или '-' для общей высоты сессии."
                )
                return
            if field_code == "electrical_points":
                await message.answer("Введите новое количество электроточек (целое число).")
                return
            if field_code == "plumbing_points":
                await message.answer("Введите новое количество сантехточек (целое число).")
                return
            await message.answer("Поле для редактирования не распознано.", reply_markup=estimate_actions_keyboard())
            return

        if step == STEP_REMOVE_ROOM_SELECT:
            rooms = payload.get("rooms", [])
            if not isinstance(rooms, list) or not rooms:
                await message.answer(
                    "Комнат для удаления нет.",
                    reply_markup=estimate_actions_keyboard(),
                )
                return
            lines = ["Выберите номер комнаты для удаления:"]
            for index, room in enumerate(rooms, start=1):
                if not isinstance(room, dict):
                    continue
                lines.append(f"- {index}. {room.get('name', f'Комната {index}')}")
            await message.answer(
                "\n".join(lines),
                reply_markup=ReplyKeyboardRemove(),
            )
            return

        await message.answer(
            "Комната сохранена. Выберите следующее действие:",
            reply_markup=estimate_actions_keyboard(),
        )

    async def start_room_questionnaire(
        message: Message,
        state: FSMContext,
        user_id: int,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        payload["draft_room"] = new_draft_room()
        payload["step"] = STEP_ROOM_NAME
        payload["status"] = "in_progress"
        payload["edit_room_index"] = None
        payload["edit_room_field"] = ""
        payload = await save_estimate_payload(user_id, payload)
        await set_state_from_estimate_step(state, STEP_ROOM_NAME)
        await prompt_estimate_step(message, payload)
        return payload

    async def finalize_room(
        message: Message,
        state: FSMContext,
        user_id: int,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        rooms = payload.setdefault("rooms", [])
        draft_room = payload.get("draft_room", {})
        if not isinstance(rooms, list) or not isinstance(draft_room, dict):
            payload = normalize_estimate_payload(payload)
            rooms = payload["rooms"]
            draft_room = payload["draft_room"]

        room_type = str(draft_room.get("room_type", "other"))
        if not requires_plumbing(room_type):
            draft_room["plumbing_points"] = 0

        rooms.append(draft_room)
        payload["rooms"] = rooms
        payload["draft_room"] = {}
        payload["step"] = STEP_READY_NEXT_ACTION
        payload["status"] = "in_progress"
        payload["edit_room_index"] = None
        payload["edit_room_field"] = ""
        payload = await save_estimate_payload(user_id, payload)
        await state.clear()

        ceiling_height_m = float(payload.get("ceiling_height_m", DEFAULT_CEILING_HEIGHT_M))
        added_room_text = summarize_room(
            draft_room,
            len(rooms),
            default_ceiling_height_m=ceiling_height_m,
        )
        await message.answer(
            "Комната добавлена:\n\n"
            f"{added_room_text}",
            reply_markup=estimate_actions_keyboard(),
        )
        await message.answer(
            "Команды: /estimate_add_room, /estimate_rooms, /estimate_edit_room, "
            "/estimate_remove_room, /estimate_finish, /estimate_reset"
        )
        return payload

    async def show_rooms_summary(message: Message, payload: dict[str, Any]) -> None:
        rooms = payload.get("rooms", [])
        if not isinstance(rooms, list):
            rooms = []
        if not rooms:
            await message.answer(
                "Комнат пока нет. Добавьте первую: /estimate_add_room",
                reply_markup=estimate_actions_keyboard(),
            )
            return

        city = str(payload.get("city", DEFAULT_CITY))
        ceiling_height_m = float(payload.get("ceiling_height_m", DEFAULT_CEILING_HEIGHT_M))
        lines = [
            f"Сессия сметы: {len(rooms)} комн.",
            f"- Город/регион: {city}",
            f"- Высота потолка: {ceiling_height_m:.2f} м",
            "",
        ]
        for index, room in enumerate(rooms, start=1):
            if isinstance(room, dict):
                lines.append(
                    summarize_room(
                        room,
                        index,
                        default_ceiling_height_m=ceiling_height_m,
                    )
                )
                geometry = resolve_room_geometry(room, ceiling_height_m)
                assumptions = geometry.get("assumptions", [])
                if isinstance(assumptions, list) and assumptions:
                    for assumption in assumptions:
                        lines.append(f"  * {assumption}")
                lines.append("")

        await message.answer(
            "\n".join(lines).strip(),
            reply_markup=estimate_actions_keyboard(),
        )

    async def start_or_resume_estimate(message: Message, state: FSMContext) -> None:
        user_id = estimate_user_id(message)
        payload = await load_estimate_payload(user_id)

        if payload is None or payload.get("status") == "finished":
            payload = new_estimate_payload()
            payload = await save_estimate_payload(user_id, payload)
            await set_state_from_estimate_step(state, str(payload["step"]))
            await prompt_estimate_step(message, payload)
            return

        await set_state_from_estimate_step(state, str(payload.get("step", STEP_GLOBAL_CITY)))
        await message.answer("Продолжаем сохраненный расчет сметы.")
        await prompt_estimate_step(message, payload)

    async def complete_lead(message: Message, state: FSMContext, lead_user: Any | None = None):
        current_state = await state.get_state()
        debug_log(
            "complete_lead",
            chat_id=message.chat.id,
            state=current_state
        )
        data = await state.get_data()
        lead_source = normalize_lead_source(str(data.get("source") or "telegram"))
        data["source"] = lead_source

        # Для inline-кнопок message.from_user — это сам бот, а реальный клиент лежит
        # в callback.from_user. Поэтому пользователь передается явно из callback-хендлера.
        user = lead_user or message.from_user
        data["telegram_user_id"] = str(user.id) if user else ""
        data["telegram_username"] = f"@{user.username}" if user and user.username else ""
        data["telegram_full_name"] = user.full_name if user else ""

        # Запись в Google Sheets (в потоке, чтобы не блокировать event loop)
        try:
            await asyncio.to_thread(add_lead, data)
        except Exception as exc:
            print(f"[FSM_ERROR] add_lead failed chat_id={message.chat.id} error={exc!r}")
            print(traceback.format_exc())

        # Отправка админу не должна ломать клиентский сценарий: если ADMIN_ID
        # недоступен или Telegram вернул ошибку, пользователь всё равно должен
        # получить финальное сообщение, а состояние — очиститься.
        text = (
            "Новая заявка:\n\n"
            f"Имя: {data['name']}\n"
            f"Телефон: {data['phone']}\n"
            f"Адрес: {data['address']}\n"
            f"Площадь: {data['area']} м²\n"
            f"Бюджет: {data['budget']}\n"
            f"Источник: {lead_source}\n"
            f"Telegram: {data.get('telegram_username') or data.get('telegram_full_name') or data.get('telegram_user_id') or '-'}"
        )

        try:
            await bot.send_message(ADMIN_ID, text)
        except Exception as exc:
            print(f"[FSM_ERROR] admin_notify_failed chat_id={message.chat.id} admin_id={ADMIN_ID} error={exc!r}")
            print(traceback.format_exc())

        await message.answer(
            "Спасибо. Заявка уже у нас — скоро свяжемся с вами.\n\n"
            f"А пока можно заглянуть в канал: {TELEGRAM_CHANNEL_URL}"
        )
        await state.clear()
        debug_log("state_cleared", chat_id=message.chat.id)

    # START
    @dp.message(CommandStart())
    async def start_handler(message: Message, state: FSMContext):
        debug_log(
            "start_handler_triggered",
            chat_id=message.chat.id,
            text=message.text
        )
        state_before = await state.get_state()
        debug_log(
            "start_handler_state_before",
            chat_id=message.chat.id,
            state=state_before
        )

        args = (message.text or "").split(maxsplit=1)
        start_arg = args[1].strip() if len(args) > 1 else ""
        debug_log(
            "start_handler_parsed",
            chat_id=message.chat.id,
            args=args,
            start_arg=start_arg
        )

        await state.clear()
        debug_log(
            "start_handler_state_cleared",
            chat_id=message.chat.id
        )

        lead_source = parse_measure_start_arg(start_arg)
        estimate_source = parse_estimate_start_arg(start_arg)

        if lead_source is not None:
            await state.update_data(source=lead_source)
            await state.set_state(MeasureForm.name)
            state_after = await state.get_state()
            debug_log(
                "start_handler_state_after",
                chat_id=message.chat.id,
                state=state_after,
                lead_source=lead_source,
            )
            await message.answer(
                "Здравствуйте! Это «Умный Ремонт». "
                "Ответьте на несколько коротких вопросов — подготовим заявку для точного расчёта по вашему объекту.\n\n"
                "Если хотите сначала прикинуть бюджет, нажмите «Рассчитать ремонт»."
            )
            await message.answer("Как вас зовут?")
            return

        if estimate_source is not None:
            debug_log(
                "start_handler_estimate_deeplink",
                chat_id=message.chat.id,
                estimate_source=estimate_source,
            )
            if MINI_APP_URL:
                await message.answer(
                    "Откройте мини‑расчёт «Умного Ремонта»: он покажет предварительный объём материалов, работ и ориентир бюджета.",
                    reply_markup=mini_app_open_keyboard(),
                )
                return

            await start_or_resume_estimate(message, state)
            return

        start_keyboard = main_menu_keyboard()

        banner = FSInputFile("assets/welcome.jpg")
        await message.answer_photo(
            photo=banner,
            caption=(
                "<b>Умный Ремонт</b>\n\n"
                "Поможем прикинуть бюджет ремонта и понять, какие материалы понадобятся.\n"
                "Можно начать с мини‑расчёта или сразу оставить заявку на консультацию.\n\n"
                f"Канал с полезными разборами: {TELEGRAM_CHANNEL_URL}"
            ),
            parse_mode="HTML",
            reply_markup=start_keyboard
        )
        if MINI_APP_URL:
            await message.answer(
                "Откройте мини‑расчёт кнопкой ниже или через кнопку меню бота. После расчёта можно сразу оставить заявку специалисту.",
                reply_markup=mini_app_open_keyboard(),
            )

    @dp.message(F.text.in_({"Начать", "Оставить заявку"}))
    async def start_survey(message: Message, state: FSMContext):
        debug_log(
            "start_survey_triggered",
            chat_id=message.chat.id,
            text=message.text
        )
        state_before = await state.get_state()
        debug_log(
            "start_survey_state_before",
            chat_id=message.chat.id,
            state=state_before
        )
        await message.answer(
            "Как вас зовут?",
            reply_markup=ReplyKeyboardRemove()
        )
        await state.update_data(source="telegram_menu")
        await state.set_state(MeasureForm.name)
        state_after = await state.get_state()
        debug_log(
            "start_survey_state_after",
            chat_id=message.chat.id,
            state=state_after
        )

    async def require_estimate_payload(
        message: Message,
        state: FSMContext,
    ) -> tuple[int, dict[str, Any]] | None:
        user_id = estimate_user_id(message)
        payload = await load_estimate_payload(user_id)
        if payload is None:
            await state.clear()
            await message.answer(
                "Сессия расчета не найдена. Запустите /estimate.",
                reply_markup=main_menu_keyboard(),
            )
            return None
        return user_id, payload

    async def save_draft_yes_no(
        message: Message,
        state: FSMContext,
        field_name: str,
        next_step: str,
    ) -> tuple[int, dict[str, Any]] | None:
        required = await require_estimate_payload(message, state)
        if required is None:
            return None
        user_id, payload = required
        choice = parse_yes_no(message.text)
        if choice is None:
            await message.answer("Ответьте кнопкой Да или Нет.", reply_markup=yes_no_keyboard())
            return None

        draft_room = payload.get("draft_room")
        if not isinstance(draft_room, dict):
            draft_room = new_draft_room()
        draft_room[field_name] = choice
        payload["draft_room"] = draft_room
        payload["step"] = next_step
        payload = await save_estimate_payload(user_id, payload)
        await set_state_from_estimate_step(state, next_step)
        await prompt_estimate_step(message, payload)
        return user_id, payload

    @dp.message(Command("estimate"))
    async def estimate_start(message: Message, state: FSMContext):
        if MINI_APP_URL:
            await message.answer(
                "Откройте мини‑расчёт «Умного Ремонта»: материалы, работы, тарифы и ориентир бюджета.",
                reply_markup=mini_app_open_keyboard(),
            )
            return
        await start_or_resume_estimate(message, state)

    @dp.message(F.text == "Канал")
    async def channel_button(message: Message):
        await message.answer(
            "Канал «Про умный ремонт» — простые разборы про сметы, материалы и спокойный ремонт:\n"
            f"{TELEGRAM_CHANNEL_URL}"
        )

    @dp.message(F.text == "Сайт")
    async def site_button(message: Message):
        await message.answer(f"Сайт «Умного Ремонта»: {PUBLIC_SITE_URL}")

    @dp.message(Command("estimate_chat"))
    async def estimate_start_chat(message: Message, state: FSMContext):
        await start_or_resume_estimate(message, state)

    @dp.message(F.text.in_({"Рассчитать смету", "Рассчитать ремонт"}))
    async def estimate_start_button(message: Message, state: FSMContext):
        if MINI_APP_URL:
            await message.answer(
                "Если мини‑расчёт не открылся автоматически, нажмите кнопку ниже. После расчёта можно отправить заявку специалисту.",
                reply_markup=mini_app_open_keyboard(),
            )
            return
        await start_or_resume_estimate(message, state)

    @dp.message(Command("estimate_reset"))
    async def estimate_reset(message: Message, state: FSMContext):
        user_id = estimate_user_id(message)
        await remove_estimate_payload(user_id)
        await state.clear()
        await message.answer(
            "Сессия расчета сметы сброшена. Для нового расчета используйте /estimate.",
            reply_markup=main_menu_keyboard(),
        )

    @dp.message(F.text == "Сбросить смету")
    async def estimate_reset_button(message: Message, state: FSMContext):
        await estimate_reset(message, state)

    @dp.message(Command("estimate_rooms"))
    async def estimate_rooms(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        _, payload = required
        await show_rooms_summary(message, payload)

    @dp.message(F.text == "Список комнат")
    async def estimate_rooms_button(message: Message, state: FSMContext):
        await estimate_rooms(message, state)

    @dp.message(Command("estimate_edit_room"))
    async def estimate_edit_room(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required
        rooms = payload.get("rooms")
        if not isinstance(rooms, list) or not rooms:
            await message.answer(
                "Комнат для редактирования нет. Добавьте комнату через /estimate_add_room.",
                reply_markup=estimate_actions_keyboard(),
            )
            return

        step = str(payload.get("step", STEP_GLOBAL_CITY))
        if step not in {
            STEP_READY_NEXT_ACTION,
            STEP_FINISHED,
            STEP_EDIT_ROOM_SELECT,
            STEP_EDIT_ROOM_FIELD,
            STEP_EDIT_ROOM_VALUE,
            STEP_REMOVE_ROOM_SELECT,
        } and payload.get("draft_room"):
            await set_state_from_estimate_step(state, step)
            await message.answer("Сначала завершите текущую комнату.")
            await prompt_estimate_step(message, payload)
            return

        payload["step"] = STEP_EDIT_ROOM_SELECT
        payload["edit_room_index"] = None
        payload["edit_room_field"] = ""
        payload["draft_room"] = {}
        payload["status"] = "in_progress"
        payload = await save_estimate_payload(user_id, payload)
        await set_state_from_estimate_step(state, STEP_EDIT_ROOM_SELECT)
        await prompt_estimate_step(message, payload)

    @dp.message(F.text == "Редактировать комнату")
    async def estimate_edit_room_button(message: Message, state: FSMContext):
        await estimate_edit_room(message, state)

    @dp.message(Command("estimate_remove_room"))
    async def estimate_remove_room(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required
        rooms = payload.get("rooms")
        if not isinstance(rooms, list) or not rooms:
            await message.answer(
                "Комнат для удаления нет.",
                reply_markup=estimate_actions_keyboard(),
            )
            return

        step = str(payload.get("step", STEP_GLOBAL_CITY))
        if step not in {
            STEP_READY_NEXT_ACTION,
            STEP_FINISHED,
            STEP_EDIT_ROOM_SELECT,
            STEP_EDIT_ROOM_FIELD,
            STEP_EDIT_ROOM_VALUE,
            STEP_REMOVE_ROOM_SELECT,
        } and payload.get("draft_room"):
            await set_state_from_estimate_step(state, step)
            await message.answer("Сначала завершите текущую комнату.")
            await prompt_estimate_step(message, payload)
            return

        payload["step"] = STEP_REMOVE_ROOM_SELECT
        payload["edit_room_index"] = None
        payload["edit_room_field"] = ""
        payload["draft_room"] = {}
        payload["status"] = "in_progress"
        payload = await save_estimate_payload(user_id, payload)
        await set_state_from_estimate_step(state, STEP_REMOVE_ROOM_SELECT)
        await prompt_estimate_step(message, payload)

    @dp.message(F.text == "Удалить комнату")
    async def estimate_remove_room_button(message: Message, state: FSMContext):
        await estimate_remove_room(message, state)

    @dp.message(Command("estimate_add_room"))
    async def estimate_add_room(message: Message, state: FSMContext):
        user_id = estimate_user_id(message)
        payload = await load_estimate_payload(user_id)
        if payload is None:
            payload = await save_estimate_payload(user_id, new_estimate_payload())
            await set_state_from_estimate_step(state, str(payload.get("step", STEP_GLOBAL_CITY)))
            await prompt_estimate_step(message, payload)
            return

        if payload.get("status") == "finished":
            payload = await save_estimate_payload(user_id, new_estimate_payload())
            await set_state_from_estimate_step(state, str(payload.get("step", STEP_GLOBAL_CITY)))
            await prompt_estimate_step(message, payload)
            return

        step = str(payload.get("step", STEP_GLOBAL_CITY))
        if step in {STEP_GLOBAL_CITY, STEP_GLOBAL_CEILING}:
            await set_state_from_estimate_step(state, step)
            await message.answer("Сначала заполните общие параметры сессии.")
            await prompt_estimate_step(message, payload)
            return

        if step not in {STEP_READY_NEXT_ACTION, STEP_FINISHED} and payload.get("draft_room"):
            await set_state_from_estimate_step(state, step)
            await message.answer("Сначала завершите текущую комнату.")
            await prompt_estimate_step(message, payload)
            return

        await start_room_questionnaire(message, state, user_id, payload)

    @dp.message(F.text == "Добавить комнату")
    async def estimate_add_room_button(message: Message, state: FSMContext):
        await estimate_add_room(message, state)

    @dp.message(Command("estimate_finish"))
    async def estimate_finish(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        rooms = payload.get("rooms")
        if not isinstance(rooms, list) or not rooms:
            await message.answer(
                "Невозможно завершить: в смете нет комнат. Добавьте комнату через /estimate_add_room.",
                reply_markup=estimate_actions_keyboard(),
            )
            return

        if payload.get("draft_room"):
            step = str(payload.get("step", STEP_ROOM_NAME))
            if step not in {STEP_READY_NEXT_ACTION, STEP_FINISHED}:
                await set_state_from_estimate_step(state, step)
                await message.answer("Сначала завершите текущую комнату.")
                await prompt_estimate_step(message, payload)
                return

        try:
            summary = calculate_estimate_summary(payload)
        except Exception as exc:
            await message.answer(f"Не удалось рассчитать смету: {exc}")
            return

        payload["status"] = "finished"
        payload["step"] = STEP_FINISHED
        payload = await save_estimate_payload(user_id, payload)
        await state.clear()

        report_text = format_estimate_report(summary)
        await send_long_text(message, report_text, reply_markup=estimate_actions_keyboard())
        await message.answer(
            "Готово. Для нового расчёта: /estimate или кнопка «Рассчитать ремонт»."
        )

    @dp.message(F.text == "Завершить смету")
    async def estimate_finish_button(message: Message, state: FSMContext):
        await estimate_finish(message, state)

    @dp.message(EstimateForm.city)
    async def estimate_city(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        text = (message.text or "").strip()
        city_value = DEFAULT_CITY if text in {"", "-"} else text
        payload["city"] = city_value
        payload["step"] = STEP_GLOBAL_CEILING
        payload = await save_estimate_payload(user_id, payload)

        await set_state_from_estimate_step(state, STEP_GLOBAL_CEILING)
        await prompt_estimate_step(message, payload)

    @dp.message(EstimateForm.ceiling_height)
    async def estimate_ceiling_height(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        raw_value = (message.text or "").strip()
        if raw_value == "-":
            height_value = DEFAULT_CEILING_HEIGHT_M
        else:
            parsed = parse_positive_float(raw_value)
            if parsed is None:
                await message.answer("Введите число в метрах, например 2.7")
                return
            if parsed < 2.0 or parsed > 5.0:
                await message.answer("Допустимый диапазон: от 2.0 до 5.0 м.")
                return
            height_value = parsed

        payload["ceiling_height_m"] = height_value
        payload = await start_room_questionnaire(message, state, user_id, payload)
        debug_log("estimate_global_saved", user_id=user_id, payload=payload)

    @dp.message(EstimateForm.room_name)
    async def estimate_room_name(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        room_name = (message.text or "").strip()
        if not room_name:
            await message.answer("Название комнаты не должно быть пустым.")
            return

        draft_room = payload.get("draft_room")
        if not isinstance(draft_room, dict):
            draft_room = new_draft_room()
        draft_room["name"] = room_name
        payload["draft_room"] = draft_room
        payload["step"] = STEP_ROOM_AREA
        payload = await save_estimate_payload(user_id, payload)

        await set_state_from_estimate_step(state, STEP_ROOM_AREA)
        await prompt_estimate_step(message, payload)

    @dp.message(EstimateForm.room_area)
    async def estimate_room_area(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        area_m2 = parse_positive_float(message.text)
        if area_m2 is None:
            await message.answer("Введите площадь числом, например 14.5")
            return

        draft_room = payload.get("draft_room")
        if not isinstance(draft_room, dict):
            draft_room = new_draft_room()
        draft_room["area_m2"] = area_m2
        payload["draft_room"] = draft_room
        payload["step"] = STEP_ROOM_HEIGHT
        payload = await save_estimate_payload(user_id, payload)

        await set_state_from_estimate_step(state, STEP_ROOM_HEIGHT)
        await prompt_estimate_step(message, payload)

    @dp.message(EstimateForm.room_height)
    async def estimate_room_height(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        raw_value = (message.text or "").strip()
        if raw_value == "-":
            room_height_m = None
        else:
            parsed = parse_positive_float(raw_value)
            if parsed is None:
                await message.answer("Введите высоту числом, например 2.8, или '-'")
                return
            if parsed < 2.0 or parsed > 5.0:
                await message.answer("Допустимый диапазон высоты: от 2.0 до 5.0 м.")
                return
            room_height_m = parsed

        draft_room = payload.get("draft_room")
        if not isinstance(draft_room, dict):
            draft_room = new_draft_room()
        draft_room["ceiling_height_m"] = room_height_m
        payload["draft_room"] = draft_room
        payload["step"] = STEP_ROOM_GEOMETRY
        payload = await save_estimate_payload(user_id, payload)

        await set_state_from_estimate_step(state, STEP_ROOM_GEOMETRY)
        await prompt_estimate_step(message, payload)

    @dp.message(EstimateForm.room_geometry)
    async def estimate_room_geometry(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        geometry_data = parse_geometry_input(message.text)
        if geometry_data is None:
            await message.answer(
                "Неверный формат. Отправьте периметр числом (17.4), размеры (5x3.2) или '-'"
            )
            return

        draft_room = payload.get("draft_room")
        if not isinstance(draft_room, dict):
            draft_room = new_draft_room()
        draft_room["perimeter_m"] = geometry_data["perimeter_m"]
        draft_room["length_m"] = geometry_data["length_m"]
        draft_room["width_m"] = geometry_data["width_m"]
        payload["draft_room"] = draft_room
        payload["step"] = STEP_ROOM_TYPE
        payload = await save_estimate_payload(user_id, payload)

        await set_state_from_estimate_step(state, STEP_ROOM_TYPE)
        await prompt_estimate_step(message, payload)

    @dp.message(EstimateForm.room_type)
    async def estimate_room_type(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        room_type_text = (message.text or "").strip()
        room_type_code = ROOM_TYPE_LABEL_TO_CODE.get(room_type_text)
        if room_type_code is None:
            await message.answer("Выберите тип комнаты кнопкой ниже.", reply_markup=room_type_keyboard())
            return

        draft_room = payload.get("draft_room")
        if not isinstance(draft_room, dict):
            draft_room = new_draft_room()
        draft_room["room_type"] = room_type_code
        payload["draft_room"] = draft_room
        payload["step"] = STEP_WALLS_PLASTER
        payload = await save_estimate_payload(user_id, payload)

        await set_state_from_estimate_step(state, STEP_WALLS_PLASTER)
        await prompt_estimate_step(message, payload)

    @dp.message(EstimateForm.walls_plaster)
    async def estimate_walls_plaster(message: Message, state: FSMContext):
        await save_draft_yes_no(message, state, "walls_plaster", STEP_WALLS_PUTTY)

    @dp.message(EstimateForm.walls_putty)
    async def estimate_walls_putty(message: Message, state: FSMContext):
        await save_draft_yes_no(message, state, "walls_putty", STEP_WALLS_PAINT)

    @dp.message(EstimateForm.walls_paint)
    async def estimate_walls_paint(message: Message, state: FSMContext):
        await save_draft_yes_no(message, state, "walls_paint", STEP_WALLS_TILES)

    @dp.message(EstimateForm.walls_tiles)
    async def estimate_walls_tiles(message: Message, state: FSMContext):
        await save_draft_yes_no(message, state, "walls_tiles", STEP_FLOOR_SCREED)

    @dp.message(EstimateForm.floor_screed)
    async def estimate_floor_screed(message: Message, state: FSMContext):
        await save_draft_yes_no(message, state, "floor_screed", STEP_FLOOR_TILES)

    @dp.message(EstimateForm.floor_tiles)
    async def estimate_floor_tiles(message: Message, state: FSMContext):
        await save_draft_yes_no(message, state, "floor_tiles", STEP_FLOOR_LAMINATE)

    @dp.message(EstimateForm.floor_laminate)
    async def estimate_floor_laminate(message: Message, state: FSMContext):
        await save_draft_yes_no(message, state, "floor_laminate", STEP_ELECTRICAL_POINTS)

    @dp.message(EstimateForm.electrical_points)
    async def estimate_electrical_points(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        points_count = parse_nonnegative_int(message.text)
        if points_count is None:
            await message.answer("Введите целое число от 0 и выше.")
            return

        draft_room = payload.get("draft_room")
        if not isinstance(draft_room, dict):
            draft_room = new_draft_room()
        draft_room["electrical_points"] = points_count
        payload["draft_room"] = draft_room

        room_type = str(draft_room.get("room_type", "other"))
        if requires_plumbing(room_type):
            payload["step"] = STEP_PLUMBING_POINTS
            payload = await save_estimate_payload(user_id, payload)
            await set_state_from_estimate_step(state, STEP_PLUMBING_POINTS)
            await prompt_estimate_step(message, payload)
            return

        draft_room["plumbing_points"] = 0
        payload["draft_room"] = draft_room
        await finalize_room(message, state, user_id, payload)

    @dp.message(EstimateForm.plumbing_points)
    async def estimate_plumbing_points(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        points_count = parse_nonnegative_int(message.text)
        if points_count is None:
            await message.answer("Введите целое число от 0 и выше.")
            return

        draft_room = payload.get("draft_room")
        if not isinstance(draft_room, dict):
            draft_room = new_draft_room()
        draft_room["plumbing_points"] = points_count
        payload["draft_room"] = draft_room
        await finalize_room(message, state, user_id, payload)

    @dp.message(EstimateForm.edit_room_select)
    async def estimate_edit_room_select(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        rooms = payload.get("rooms")
        if not isinstance(rooms, list) or not rooms:
            await message.answer("Комнат для редактирования нет.", reply_markup=estimate_actions_keyboard())
            await state.clear()
            return

        room_index = parse_room_index(message.text, len(rooms))
        if room_index is None:
            await message.answer("Введите номер комнаты из списка, например: 1")
            return

        payload["edit_room_index"] = room_index - 1
        payload["edit_room_field"] = ""
        payload["step"] = STEP_EDIT_ROOM_FIELD
        payload["status"] = "in_progress"
        payload = await save_estimate_payload(user_id, payload)
        await set_state_from_estimate_step(state, STEP_EDIT_ROOM_FIELD)
        await prompt_estimate_step(message, payload)

    @dp.message(EstimateForm.edit_room_field)
    async def estimate_edit_room_field(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        field_label = (message.text or "").strip()
        field_code = ROOM_EDIT_FIELD_LABEL_TO_CODE.get(field_label)
        if field_code is None:
            await message.answer("Выберите поле кнопкой ниже.", reply_markup=room_edit_fields_keyboard())
            return

        payload["edit_room_field"] = field_code
        payload["step"] = STEP_EDIT_ROOM_VALUE
        payload = await save_estimate_payload(user_id, payload)
        await set_state_from_estimate_step(state, STEP_EDIT_ROOM_VALUE)
        await prompt_estimate_step(message, payload)

    @dp.message(EstimateForm.edit_room_value)
    async def estimate_edit_room_value(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        rooms = payload.get("rooms")
        if not isinstance(rooms, list) or not rooms:
            await message.answer("Комнаты не найдены.", reply_markup=estimate_actions_keyboard())
            await state.clear()
            return

        edit_room_index = payload.get("edit_room_index")
        if not isinstance(edit_room_index, int) or edit_room_index < 0 or edit_room_index >= len(rooms):
            await message.answer("Не удалось определить комнату для редактирования.")
            payload["step"] = STEP_EDIT_ROOM_SELECT
            payload = await save_estimate_payload(user_id, payload)
            await set_state_from_estimate_step(state, STEP_EDIT_ROOM_SELECT)
            await prompt_estimate_step(message, payload)
            return

        room = rooms[edit_room_index]
        if not isinstance(room, dict):
            room = {}
            rooms[edit_room_index] = room

        field_code = str(payload.get("edit_room_field", ""))
        raw_value = (message.text or "").strip()
        bool_fields = {
            "walls_plaster",
            "walls_putty",
            "walls_paint",
            "walls_tiles",
            "floor_screed",
            "floor_tiles",
            "floor_laminate",
        }
        if field_code in bool_fields:
            parsed_bool = parse_yes_no(raw_value)
            if parsed_bool is None:
                await message.answer("Ответьте кнопкой Да или Нет.", reply_markup=yes_no_keyboard())
                return
            room[field_code] = parsed_bool
        elif field_code == "area_m2":
            parsed_float = parse_positive_float(raw_value)
            if parsed_float is None:
                await message.answer("Введите площадь числом, например 14.5")
                return
            room[field_code] = parsed_float
        elif field_code == "ceiling_height_m":
            if raw_value == "-":
                room[field_code] = None
            else:
                parsed_float = parse_positive_float(raw_value)
                if parsed_float is None:
                    await message.answer("Введите высоту числом, например 2.8, или '-'")
                    return
                if parsed_float < 2.0 or parsed_float > 5.0:
                    await message.answer("Допустимый диапазон высоты: от 2.0 до 5.0 м.")
                    return
                room[field_code] = parsed_float
        elif field_code in {"electrical_points", "plumbing_points"}:
            parsed_int = parse_nonnegative_int(raw_value)
            if parsed_int is None:
                await message.answer("Введите целое число от 0 и выше.")
                return
            room[field_code] = parsed_int
        else:
            await message.answer("Поле редактирования не поддерживается.")
            return

        if not requires_plumbing(str(room.get("room_type", "other"))):
            room["plumbing_points"] = 0

        rooms[edit_room_index] = room
        payload["rooms"] = rooms
        payload["status"] = "in_progress"
        payload["step"] = STEP_READY_NEXT_ACTION
        payload["edit_room_index"] = None
        payload["edit_room_field"] = ""
        payload = await save_estimate_payload(user_id, payload)
        await state.clear()

        await message.answer(
            "Комната обновлена:\n\n"
            f"{summarize_room(room, edit_room_index + 1, float(payload.get('ceiling_height_m', DEFAULT_CEILING_HEIGHT_M)))}",
            reply_markup=estimate_actions_keyboard(),
        )

    @dp.message(EstimateForm.remove_room_select)
    async def estimate_remove_room_select(message: Message, state: FSMContext):
        required = await require_estimate_payload(message, state)
        if required is None:
            return
        user_id, payload = required

        rooms = payload.get("rooms")
        if not isinstance(rooms, list) or not rooms:
            await message.answer("Комнат для удаления нет.", reply_markup=estimate_actions_keyboard())
            await state.clear()
            return

        room_index = parse_room_index(message.text, len(rooms))
        if room_index is None:
            await message.answer("Введите номер комнаты из списка, например: 1")
            return

        removed = rooms.pop(room_index - 1)
        removed_name = (
            str(removed.get("name", f"Комната {room_index}"))
            if isinstance(removed, dict)
            else f"Комната {room_index}"
        )

        payload["rooms"] = rooms
        payload["status"] = "in_progress"
        payload["step"] = STEP_READY_NEXT_ACTION
        payload["edit_room_index"] = None
        payload["edit_room_field"] = ""
        payload = await save_estimate_payload(user_id, payload)
        await state.clear()

        await message.answer(
            f"Удалена комната: {removed_name}",
            reply_markup=estimate_actions_keyboard(),
        )
        if rooms:
            await show_rooms_summary(message, payload)
        else:
            await message.answer("Комнат больше нет. Добавьте новую через /estimate_add_room.")



    # Имя
    @dp.message(MeasureForm.name)
    async def get_name(message: Message, state: FSMContext):
        current_state = await state.get_state()
        debug_log(
            "get_name",
            chat_id=message.chat.id,
            state=current_state,
            text=message.text
        )
        await state.update_data(name=message.text)
        await state.set_state(MeasureForm.phone)
        next_state = await state.get_state()
        debug_log("get_name_next_state", chat_id=message.chat.id, state=next_state)

        contact_button = KeyboardButton(
            text="Отправить телефон",
            request_contact=True
        )

        keyboard = ReplyKeyboardMarkup(
            keyboard=[[contact_button]],
            resize_keyboard=True
        )

        await message.answer(
            "Отправьте ваш телефон:",
            reply_markup=keyboard
        )

    # Телефон
    @dp.message(MeasureForm.phone)
    async def get_phone(message: Message, state: FSMContext):
        current_state = await state.get_state()
        debug_log(
            "get_phone",
            chat_id=message.chat.id,
            state=current_state,
            text=message.text,
            has_contact=bool(message.contact)
        )
        if message.contact:
            phone = message.contact.phone_number
        else:
            phone = message.text

        await state.update_data(phone=phone)
        await state.set_state(MeasureForm.address)
        next_state = await state.get_state()
        debug_log("get_phone_next_state", chat_id=message.chat.id, state=next_state)

        await message.answer(
            "Укажите адрес объекта:",
            reply_markup=ReplyKeyboardRemove()
        )

    # Адрес
    @dp.message(MeasureForm.address)
    async def get_address(message: Message, state: FSMContext):
        current_state = await state.get_state()
        debug_log(
            "get_address",
            chat_id=message.chat.id,
            state=current_state,
            text=message.text
        )
        await state.update_data(address=message.text)
        await state.set_state(MeasureForm.area)
        next_state = await state.get_state()
        debug_log("get_address_next_state", chat_id=message.chat.id, state=next_state)

        await message.answer("Сколько квадратных метров?")

    # Площадь с проверкой
    @dp.message(MeasureForm.area)
    async def get_area(message: Message, state: FSMContext):
        current_state = await state.get_state()
        debug_log(
            "get_area",
            chat_id=message.chat.id,
            state=current_state,
            text=message.text
        )
        if not message.text.isdigit():
            await message.answer("Введите площадь цифрами, например: 85")
            return

        await state.update_data(area=message.text)
        await state.set_state(MeasureForm.budget)
        next_state = await state.get_state()
        debug_log("get_area_next_state", chat_id=message.chat.id, state=next_state)

        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(text="До 1 млн", callback_data="b1"),
                    InlineKeyboardButton(text="1–3 млн", callback_data="b2"),
                ],
                [
                    InlineKeyboardButton(text="3–5 млн", callback_data="b3"),
                    InlineKeyboardButton(text="5–10 млн", callback_data="b4"),
                ],
                [
                    InlineKeyboardButton(text="10+ млн", callback_data="b5"),
                ],
                [
                    InlineKeyboardButton(text="Другая сумма", callback_data="other"),
                ]
            ]
        )

        await message.answer(
            "Выберите примерный бюджет:",
            reply_markup=keyboard
        )

    # Бюджет через кнопки
    @dp.callback_query(MeasureForm.budget)
    async def get_budget(callback: CallbackQuery, state: FSMContext):
        current_state = await state.get_state()
        debug_log(
            "get_budget",
            chat_id=callback.from_user.id,
            state=current_state,
            callback_data=callback.data
        )
        budget_map = {
            "b1": "До 1 млн",
            "b2": "1–3 млн",
            "b3": "3–5 млн",
            "b4": "5–10 млн",
            "b5": "10+ млн"
        }

        if callback.data == "other":
            debug_log(
                "other_callback_triggered",
                chat_id=callback.from_user.id
            )
            state_before = await state.get_state()
            debug_log(
                "other_state_before_transition",
                chat_id=callback.from_user.id,
                state=state_before
            )
            await state.set_state(MeasureForm.custom_budget)
            next_state = await state.get_state()
            debug_log(
                "other_state_after_transition",
                chat_id=callback.from_user.id,
                state=next_state
            )

            if callback.message:
                try:
                    await callback.message.edit_reply_markup()
                except Exception as exc:
                    print(
                        f"[FSM_ERROR] edit_reply_markup_failed "
                        f"chat_id={callback.from_user.id} error={exc!r}"
                    )
                await callback.message.answer("Введите ваш бюджет вручную:")

            await callback.answer()
            return

        budget_value = budget_map.get(callback.data)
        if budget_value is None:
            await callback.answer()
            return

        await state.update_data(budget=budget_value)
        if callback.message:
            await callback.message.edit_reply_markup()
        await callback.answer()
        if callback.message:
            await complete_lead(callback.message, state, lead_user=callback.from_user)

    @dp.message(MeasureForm.custom_budget)
    async def get_custom_budget(message: Message, state: FSMContext):
        current_state = await state.get_state()
        debug_log(
            "get_custom_budget",
            chat_id=message.chat.id,
            state=current_state,
            text=message.text
        )
        await state.update_data(budget=message.text)
        await complete_lead(message, state)



    print(f"[STARTUP] Bot started in {BOT_TRANSPORT} mode")
    try:
        if BOT_TRANSPORT == "polling":
            await dp.start_polling(bot)
        else:
            stop_event = asyncio.Event()
            loop = asyncio.get_running_loop()
            for signame in ("SIGINT", "SIGTERM"):
                if hasattr(signal, signame):
                    loop.add_signal_handler(getattr(signal, signame), stop_event.set)
            await stop_event.wait()
    finally:
        if mini_app_server is not None:
            await mini_app_server.stop()
        if webhook_runner is not None:
            await webhook_runner.cleanup()
        await database.dispose()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
