import os
import hashlib
from dotenv import load_dotenv


def _is_production() -> bool:
    return os.getenv("ENV", "").lower() == "production"


if not _is_production():
    load_dotenv()


BOT_TOKEN = os.getenv("TELEGRAM_TOKEN") or os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise RuntimeError(
        "Missing required environment variable: TELEGRAM_TOKEN "
        "(BOT_TOKEN is accepted as fallback)"
    )


_google_credentials = os.getenv("GOOGLE_CREDENTIALS")
if not _google_credentials:
    raise RuntimeError("Missing required environment variable: GOOGLE_CREDENTIALS")
GOOGLE_CREDENTIALS = _google_credentials


_admin_id_raw = os.getenv("ADMIN_ID")
if not _admin_id_raw:
    raise RuntimeError("Missing required environment variable: ADMIN_ID")
try:
    ADMIN_ID = int(_admin_id_raw)
except ValueError as exc:
    raise RuntimeError("Environment variable ADMIN_ID must be an integer") from exc


DATABASE_URL = os.getenv("DATABASE_URL") or None
SQLITE_PATH = os.getenv("SQLITE_PATH", "data/app.sqlite")

DEFAULT_MINI_APP_URL = "http://localhost:8080/miniapp"

MINI_APP_URL = (
    os.getenv("MINI_APP_URL")
    or DEFAULT_MINI_APP_URL
).strip() or DEFAULT_MINI_APP_URL
MINI_APP_HOST = (os.getenv("MINI_APP_HOST") or "0.0.0.0").strip() or "0.0.0.0"

_mini_app_port_raw = (os.getenv("MINI_APP_PORT") or os.getenv("PORT") or "8080").strip()
try:
    MINI_APP_PORT = int(_mini_app_port_raw)
except ValueError:
    MINI_APP_PORT = 8080

_mini_app_dev_user_id_raw = (os.getenv("MINI_APP_DEV_USER_ID") or "").strip()
if _mini_app_dev_user_id_raw:
    try:
        MINI_APP_DEV_USER_ID = int(_mini_app_dev_user_id_raw)
    except ValueError as exc:
        raise RuntimeError("Environment variable MINI_APP_DEV_USER_ID must be an integer") from exc
else:
    MINI_APP_DEV_USER_ID = None

_mini_app_auth_max_age_raw = (os.getenv("MINI_APP_AUTH_MAX_AGE_SECONDS") or "86400").strip()
try:
    MINI_APP_AUTH_MAX_AGE_SECONDS = int(_mini_app_auth_max_age_raw)
except ValueError:
    MINI_APP_AUTH_MAX_AGE_SECONDS = 86400

ENABLE_MINI_APP_SERVER = (
    os.getenv("ENABLE_MINI_APP_SERVER", "0").strip().lower() not in {"0", "false", "no"}
)

WEBHOOK_PATH = (os.getenv("WEBHOOK_PATH") or "/telegram/webhook").strip() or "/telegram/webhook"
if not WEBHOOK_PATH.startswith("/"):
    WEBHOOK_PATH = f"/{WEBHOOK_PATH}"

WEBHOOK_BASE_URL = (os.getenv("WEBHOOK_BASE_URL") or "").strip() or None
WEBHOOK_URL = f"{WEBHOOK_BASE_URL.rstrip('/')}{WEBHOOK_PATH}" if WEBHOOK_BASE_URL else None

_bot_transport_raw = (os.getenv("BOT_TRANSPORT") or "auto").strip().lower()
if _bot_transport_raw not in {"auto", "polling", "webhook"}:
    raise RuntimeError("Environment variable BOT_TRANSPORT must be one of: auto, polling, webhook")

if _bot_transport_raw == "auto":
    BOT_TRANSPORT = "webhook" if WEBHOOK_URL and not ENABLE_MINI_APP_SERVER else "polling"
else:
    BOT_TRANSPORT = _bot_transport_raw

WEBHOOK_SECRET_TOKEN = (
    os.getenv("WEBHOOK_SECRET_TOKEN")
    or hashlib.sha256(BOT_TOKEN.encode("utf-8")).hexdigest()[:32]
)

TELEGRAM_CHANNEL_URL = (os.getenv("TELEGRAM_CHANNEL_URL") or "https://t.me/proumniremont").strip()
PUBLIC_SITE_URL = (os.getenv("PUBLIC_SITE_URL") or "https://umniremont.pro").strip()
BOT_PUBLIC_URL = (os.getenv("BOT_PUBLIC_URL") or "https://t.me/umniyremontbot").strip()
