from __future__ import annotations

import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl


class TelegramInitDataError(ValueError):
    pass


def _build_data_check_string(values: dict[str, str]) -> str:
    return "\n".join(f"{key}={values[key]}" for key in sorted(values.keys()))


def parse_telegram_user_id(
    init_data: str,
    bot_token: str,
    max_age_seconds: int | None = 86_400,
) -> int:
    if not init_data:
        raise TelegramInitDataError("initData is empty")

    parsed_pairs = dict(parse_qsl(init_data, keep_blank_values=True))
    hash_value = parsed_pairs.pop("hash", None)
    if not hash_value:
        raise TelegramInitDataError("initData hash is missing")

    data_check_string = _build_data_check_string(parsed_pairs)
    secret_key = hmac.new(
        key=b"WebAppData",
        msg=bot_token.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()
    expected_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, hash_value):
        raise TelegramInitDataError("initData hash mismatch")

    if max_age_seconds is not None:
        auth_date_raw = parsed_pairs.get("auth_date")
        if auth_date_raw and auth_date_raw.isdigit():
            auth_date = int(auth_date_raw)
            age_seconds = int(time.time()) - auth_date
            if age_seconds > max_age_seconds:
                raise TelegramInitDataError("initData expired")

    raw_user = parsed_pairs.get("user")
    if not raw_user:
        raise TelegramInitDataError("initData user payload is missing")

    try:
        user_data = json.loads(raw_user)
    except json.JSONDecodeError as exc:
        raise TelegramInitDataError("initData user payload is invalid JSON") from exc

    user_id = user_data.get("id")
    if not isinstance(user_id, int) or user_id <= 0:
        raise TelegramInitDataError("initData user id is invalid")

    return user_id
