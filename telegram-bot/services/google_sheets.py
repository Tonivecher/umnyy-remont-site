import json
from datetime import datetime

import gspread
from google.oauth2.service_account import Credentials

from config import GOOGLE_CREDENTIALS

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


import logging

_sheet = None
_initialized = False

def _init_google_sheets():
    global _sheet, _initialized
    if _initialized:
        return
    
    if not GOOGLE_CREDENTIALS or "PUT_YOUR" in GOOGLE_CREDENTIALS or "service_account" not in GOOGLE_CREDENTIALS:
        logging.warning("[GOOGLE_SHEETS] GOOGLE_CREDENTIALS is not configured or uses placeholder value.")
        _initialized = True
        return

    try:
        credentials_info = json.loads(GOOGLE_CREDENTIALS)
        creds = Credentials.from_service_account_info(
            credentials_info,
            scopes=SCOPES,
        )
        client = gspread.authorize(creds)
        _sheet = client.open("Leads").sheet1
        print("[GOOGLE_SHEETS] Successfully connected to Google Sheets 'Leads'")
    except Exception as exc:
        logging.error(f"[GOOGLE_SHEETS] Failed to initialize Google Sheets: {exc!r}")
    
    _initialized = True


def add_lead(data):
    _init_google_sheets()
    if _sheet is None:
        print(f"[GOOGLE_SHEETS] Cannot add lead: Google Sheets not initialized. Lead data: {data}")
        return
        
    try:
        _sheet.append_row([
            datetime.now().strftime("%Y-%m-%d %H:%M"),
            data.get("name", ""),
            data.get("phone", ""),
            data.get("address", ""),
            data.get("area", ""),
            data.get("budget", ""),
            data.get("source", "telegram"),
            data.get("telegram_username", ""),
            data.get("telegram_user_id", ""),
            data.get("telegram_full_name", ""),
            data.get("preferred_tier", ""),
            data.get("estimate_summary", ""),
        ])
    except Exception as exc:
        print(f"[GOOGLE_SHEETS] Error appending row to Google Sheets: {exc!r}")

