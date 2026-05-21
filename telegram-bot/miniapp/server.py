from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from aiohttp import web

from db import EstimateSessionRepository
from estimate.reporting import calculate_estimate_summary, format_estimate_report
from estimate.session_store import normalize_estimate_payload, new_estimate_payload
from miniapp.auth import TelegramInitDataError, parse_telegram_user_id


@web.middleware
async def _miniapp_no_cache_middleware(request: web.Request, handler):
    response = await handler(request)
    if request.path.startswith("/miniapp"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


class MiniAppServer:
    def __init__(
        self,
        *,
        host: str,
        port: int,
        bot_token: str,
        estimate_repo: EstimateSessionRepository,
        dev_user_id: int | None = None,
        auth_max_age_seconds: int | None = 86_400,
        static_dir: Path | None = None,
    ) -> None:
        self._host = host
        self._port = port
        self._bot_token = bot_token
        self._estimate_repo = estimate_repo
        self._dev_user_id = dev_user_id
        self._auth_max_age_seconds = auth_max_age_seconds
        self._static_dir = static_dir or (Path(__file__).resolve().parent / "static")

        self._app = web.Application(middlewares=[_miniapp_no_cache_middleware])
        self._runner: web.AppRunner | None = None
        self._site: web.BaseSite | None = None

        self._configure_routes()

    def _configure_routes(self) -> None:
        self._app.router.add_get("/miniapp", self._handle_index)
        self._app.router.add_get("/miniapp/", self._handle_index)
        self._app.router.add_get("/miniapp/health", self._handle_health)
        self._app.router.add_post("/miniapp/api/session/load", self._handle_session_load)
        self._app.router.add_post("/miniapp/api/session/save", self._handle_session_save)
        self._app.router.add_post("/miniapp/api/session/reset", self._handle_session_reset)
        self._app.router.add_post("/miniapp/api/calculate", self._handle_calculate)
        self._app.router.add_static("/miniapp/static/", str(self._static_dir), show_index=False)

    async def start(self) -> None:
        self._runner = web.AppRunner(self._app)
        await self._runner.setup()
        self._site = web.TCPSite(self._runner, host=self._host, port=self._port)
        await self._site.start()
        print(f"[STARTUP][MINIAPP] server=http://{self._host}:{self._port} path=/miniapp")

    async def stop(self) -> None:
        if self._runner is not None:
            await self._runner.cleanup()
            self._runner = None
            self._site = None

    async def _read_json(self, request: web.Request) -> dict[str, Any]:
        try:
            body = await request.json()
        except Exception as exc:
            raise web.HTTPBadRequest(text=f"Invalid JSON body: {exc}") from exc

        if not isinstance(body, dict):
            raise web.HTTPBadRequest(text="JSON body must be an object")
        return body

    def _extract_user_id(self, request_data: dict[str, Any]) -> int:
        init_data = request_data.get("initData")
        if isinstance(init_data, str) and init_data.strip():
            try:
                return parse_telegram_user_id(
                    init_data.strip(),
                    bot_token=self._bot_token,
                    max_age_seconds=self._auth_max_age_seconds,
                )
            except TelegramInitDataError as exc:
                raise web.HTTPUnauthorized(text=f"Invalid Telegram initData: {exc}") from exc

        if self._dev_user_id is not None:
            return self._dev_user_id

        raise web.HTTPUnauthorized(text="Telegram initData is required")

    async def _load_payload_for_user(self, user_id: int) -> tuple[dict[str, Any], str | None]:
        record = await self._estimate_repo.get_session(user_id)
        if not record:
            return new_estimate_payload(), None

        try:
            raw_payload = json.loads(record.session_json)
        except (TypeError, ValueError):
            return new_estimate_payload(), record.updated_at.isoformat()

        if not isinstance(raw_payload, dict):
            return new_estimate_payload(), record.updated_at.isoformat()

        return normalize_estimate_payload(raw_payload), record.updated_at.isoformat()

    async def _save_payload_for_user(self, user_id: int, payload: dict[str, Any]) -> tuple[dict[str, Any], str]:
        normalized = normalize_estimate_payload(payload)
        session_json = json.dumps(normalized, ensure_ascii=False)
        await self._estimate_repo.upsert_session(user_id=user_id, session_json=session_json)
        return normalized, datetime.now(timezone.utc).isoformat()

    async def _handle_index(self, _: web.Request) -> web.FileResponse:
        return web.FileResponse(self._static_dir / "index.html")

    async def _handle_health(self, _: web.Request) -> web.Response:
        return web.json_response({"ok": True})

    async def _handle_session_load(self, request: web.Request) -> web.Response:
        request_data = await self._read_json(request)
        user_id = self._extract_user_id(request_data)
        payload, updated_at = await self._load_payload_for_user(user_id)
        return web.json_response(
            {
                "ok": True,
                "payload": payload,
                "meta": {
                    "user_id": user_id,
                    "updated_at": updated_at,
                },
            }
        )

    async def _handle_session_save(self, request: web.Request) -> web.Response:
        request_data = await self._read_json(request)
        user_id = self._extract_user_id(request_data)
        payload_raw = request_data.get("payload")
        payload = payload_raw if isinstance(payload_raw, dict) else {}
        saved_payload, updated_at = await self._save_payload_for_user(user_id, payload)
        return web.json_response(
            {
                "ok": True,
                "payload": saved_payload,
                "meta": {
                    "user_id": user_id,
                    "updated_at": updated_at,
                },
            }
        )

    async def _handle_session_reset(self, request: web.Request) -> web.Response:
        request_data = await self._read_json(request)
        user_id = self._extract_user_id(request_data)
        await self._estimate_repo.delete_session(user_id)
        payload = new_estimate_payload()
        return web.json_response(
            {
                "ok": True,
                "payload": payload,
                "meta": {
                    "user_id": user_id,
                    "updated_at": None,
                },
            }
        )

    async def _handle_calculate(self, request: web.Request) -> web.Response:
        request_data = await self._read_json(request)
        user_id = self._extract_user_id(request_data)
        payload_raw = request_data.get("payload")
        payload = payload_raw if isinstance(payload_raw, dict) else {}
        saved_payload, updated_at = await self._save_payload_for_user(user_id, payload)

        try:
            summary = calculate_estimate_summary(saved_payload)
        except ValueError as exc:
            return web.json_response({"ok": False, "error": str(exc)}, status=400)
        except Exception as exc:
            return web.json_response({"ok": False, "error": f"Расчет не выполнен: {exc}"}, status=400)

        report_text = format_estimate_report(summary)
        return web.json_response(
            {
                "ok": True,
                "summary": summary,
                "report_text": report_text,
                "payload": saved_payload,
                "meta": {
                    "user_id": user_id,
                    "updated_at": updated_at,
                },
            }
        )
