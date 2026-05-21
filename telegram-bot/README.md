# Telegram-бот UMID

Бот для сбора заявок (имя, телефон, адрес, площадь, бюджет) и записи в Google Таблицу `Leads`.
Расчет сметы теперь открывает внешний SmartRepair Telegram Mini App, плюс остается чатовый fallback-сценарий.

## Требования

- Python 3.11 или 3.12 (рекомендуется 3.12)
- Локальный Ollama

## Установка

```bash
cd /Users/hozain/UmniRem/telegram-bot

python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Конфигурация окружения

```bash
cp .env.example .env
```

Заполните минимум:

- `TELEGRAM_TOKEN`
- `ADMIN_ID`
- `GOOGLE_CREDENTIALS`

Для слоя сессий смет:

- `DATABASE_URL` (опционально, для PostgreSQL в Railway)
- `SQLITE_PATH` (опционально, по умолчанию `data/app.sqlite`)

Для Telegram Mini App:

- `MINI_APP_URL` (по умолчанию `https://smartrepair-telegram-miniapp.vercel.app`)
- `MINI_APP_HOST` (по умолчанию `0.0.0.0`)
- `MINI_APP_PORT` (по умолчанию `PORT` или `8080`)
- `ENABLE_MINI_APP_SERVER` (`1`/`0`, по умолчанию `0`, нужен только для legacy встроенного mini app)
- `BOT_TRANSPORT` (`auto`/`polling`/`webhook`, по умолчанию `auto`)
- `WEBHOOK_PATH` (по умолчанию `/telegram/webhook`)
- `WEBHOOK_BASE_URL` (опционально; в Railway берется из `RAILWAY_PUBLIC_DOMAIN`)
- `MINI_APP_AUTH_MAX_AGE_SECONDS` (по умолчанию `86400`)
- `MINI_APP_DEV_USER_ID` (только для локальной отладки без Telegram initData)

## Local LLM (Ollama) setup

1. Установите Ollama: [https://ollama.com/download](https://ollama.com/download)
2. Загрузите модель генерации:

```bash
ollama pull llama3
```

3. Загрузите embedding-модель:

```bash
ollama pull nomic-embed-text
```

4. Запустите Ollama (если сервис еще не запущен):

```bash
ollama serve
```

5. Быстрая проверка:

```bash
curl http://localhost:11434/api/tags
```

## RAG knowledge base

Структура папок:

```text
rag_data/
  construction/
  estimates/
  materials/
  workflows/
  electrical/
  plumbing/
```

- Поддерживаемые форматы индексации: `.txt`, `.md`, `.pdf`.
- PDF извлекаются через `pypdf`.
- Runtime полностью офлайн: бот отвечает только из локального индекса + локального Ollama.
- Интернет нужен только для одноразового скачивания источников.

### RAG sources pack (one-time)

Источники описаны в `rag_sources.json`.

Показать список:

```bash
python scripts/fetch_rag_sources.py --list
```

Скачать весь pack:

```bash
python scripts/fetch_rag_sources.py
```

Скачать только одну категорию:

```bash
python scripts/fetch_rag_sources.py --only plumbing
```

One-command pipeline:

```bash
python scripts/fetch_rag_sources.py && python build_rag_index.py
```

После добавления/обновления документов пересоберите индекс:

```bash
python build_rag_index.py
```

Индекс хранится в SQLite: `rag_index/rag.sqlite`.

## Запуск бота

```bash
source .venv/bin/activate
python main.py
```

## Проверка DB слоя

```bash
python scripts/db_check.py
```

Скрипт создаёт таблицы, делает upsert тестовой сессии (`user_id=1`) и печатает `OK`.

Инициализация схемы (Postgres через `DATABASE_URL`):

```bash
python scripts/init_db.py
```

`init_db.py` безопасен и идемпотентен: только создаёт отсутствующие таблицы.

## Estimate core (без UI)

Пакет `estimate/` содержит:

- `models.py` (`Room`, `EstimateSession`)
- `norms_ru.yml` (нормы расхода материалов)
- `prices_moscow_tiers.yml` (тарифы `econom|standard|premium`)
- `calculators/` (детерминированные функции расчёта, без LLM)

Самопроверка:

```bash
python scripts/estimate_selftest.py
```

Скрипт печатает:

- рассчитанные количества материалов (с округлением до мешков/канистр)
- трудозатраты по тарифам `econom`, `standard`, `premium`

Источники для базовых цен (Москва, ориентиры):

- Шпаклевка: https://profi.ru/remont/malyarnye-shtukaturnye-raboty/shpatlevka/shpaklevka-sten/price/
- Покраска: https://hands.ru/service/pokrasit-steny/price/
- Штукатурка: https://shtukaturka-v-moskve.ru/cena-shtykatyrki.html
- Плитка: https://remelit.ru/plitochnye-raboty/ ; https://redfiks.com/blog/prices/tiler
- Электрика: https://0220.ru/prajs ; https://td-tsk.ru/services/elektromontazhnye-raboty/
- Сантехника: https://santehnik-center.ru/price/ ; https://www.santehnik24.pro/tseny ; https://remont-uroven.ru/articles/santexnicheskie-rabotyi-v-moskve.html

## Проверка estimate UI (smoke)

1. Запустите бота: `python main.py`
2. В Telegram нажмите кнопку `Рассчитать смету` (или отправьте `/estimate`)
3. Заполните глобальные поля:
   - город/регион (или `-` для `Москва`)
   - высота потолка (или `-` для `2.7`)
4. Заполните одну комнату:
   - название
   - площадь пола
   - высота комнаты (или `-` для общей высоты)
   - периметр (или размеры `ДxШ`) либо `-` для допущения квадратной комнаты
   - тип комнаты
   - ответы `Да/Нет` по отделке стен и пола
   - количество электроточек
   - количество сантехточек (для кухни/санузла)
5. Проверьте редактирование/удаление:
   - `/estimate_edit_room` (выбрать комнату -> выбрать поле -> ввести новое значение)
   - `/estimate_remove_room` (выбрать комнату -> удалить)
6. После сообщения `Комната добавлена` нажмите `Завершить смету` (или `/estimate_finish`)
7. Проверьте, что итог содержит разделы `Материалы`, `Работы` и `Допущения`.
8. Перезапустите бота и убедитесь, что `/estimate` подхватывает сохраненную сессию.

Быстрая проверка регистрации хендлеров без запуска polling:

```bash
python scripts/bot_dry_run.py
```

## SmartRepair Telegram Mini App

Что реализовано:

- внешний SmartRepair Telegram Mini App как основной сценарий запуска из бота
- menu button бота настроен на SmartRepair Mini App
- production-запуск бота через webhook, чтобы не зависеть от конфликтующих `getUpdates`
- валидация Telegram `initData` на backend (HMAC)
- сохранение/загрузка сессии сметы в `estimate_sessions`
- расчет материалов и работ по `econom/standard/premium` в mini app UI
- блок `Личный кабинет`: профиль Telegram, прогресс заполнения, статус и время последнего сохранения
- быстрые пресеты комнат (`Кухня`, `Санузел`, `Спальня`, `Гостиная`)
- действия для комнат: редактирование, удаление, дублирование
- сценарии бюджета (`Standard`, `+10%`, `+15%`, `дельта Premium`)
- экспорт результата: копирование отчета и скачивание JSON
- кнопка `Рассчитать смету` в главном меню как WebApp-кнопка
- встроенный mini app сервер UMID остается только как legacy fallback при `ENABLE_MINI_APP_SERVER=1`

Как проверить вручную:

1. Убедитесь, что `MINI_APP_URL` указывает на `https://smartrepair-telegram-miniapp.vercel.app`.
2. Откройте чат с ботом -> нажмите `Рассчитать смету`.
3. В mini app заполните объект и комнаты, нажмите `Рассчитать смету`.
4. Убедитесь, что выводятся:
   - материалы (количество + округление по упаковкам)
   - работы по тарифам `econom/standard/premium`
   - сценарии бюджета
   - допущения по геометрии
   - экспортные кнопки (`Копировать отчет`, `Скачать JSON`)

Fallback:

- `/estimate` при `MINI_APP_URL` подсказывает открыть mini app
- чатовый сценарий остается доступен через `/estimate_chat`

## Команды бота

- `/finish <вопрос>`: обычный локальный ответ через Ollama (без RAG)
- `/finish_on`: включить режим обычной локальной консультации
- `/finish_off`: выключить режим обычной локальной консультации
- `/ask <вопрос>`: вопрос с RAG (по локальной базе документов)
- `/rag_on`: включить RAG-режим для последующих текстовых сообщений
- `/rag_off`: выключить RAG-режим
- `/rag_build`: пересобрать индекс RAG из бота (только для `ADMIN_ID`)
- `/estimate`: открыть mini app (или чатовый flow, если `MINI_APP_URL` не задан)
- `/estimate_chat`: принудительно открыть чатовый flow сметы
- `/estimate_add_room`: добавить следующую комнату
- `/estimate_rooms`: показать сохраненные комнаты
- `/estimate_edit_room`: выбрать комнату и изменить поле
- `/estimate_remove_room`: удалить выбранную комнату
- `/estimate_finish`: завершить расчет и получить итог MVP
- `/estimate_reset`: сбросить сессию расчета

Ответы в RAG-режиме содержат секцию `Sources:` со списком файлов.

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `TELEGRAM_TOKEN` | Основной токен от @BotFather |
| `BOT_TOKEN` | Опциональный fallback (обратная совместимость) |
| `ADMIN_ID` | Числовой ID администратора |
| `GOOGLE_CREDENTIALS` | JSON сервисного аккаунта Google |
| `OLLAMA_URL` | Базовый URL Ollama (по умолчанию `http://localhost:11434`) |
| `OLLAMA_MODEL` | Модель генерации (по умолчанию `llama3`) |
| `OLLAMA_EMBED_MODEL` | Embedding-модель (по умолчанию `nomic-embed-text`) |
| `RAG_TOP_K` | Количество извлекаемых чанков (по умолчанию `6`) |
| `RAG_DB_PATH` | Путь к SQLite индексу (по умолчанию `rag_index/rag.sqlite`) |
| `DATABASE_URL` | URL PostgreSQL (если задан, используется вместо SQLite) |
| `SQLITE_PATH` | Путь к локальному SQLite для app DB (по умолчанию `data/app.sqlite`) |
| `MINI_APP_URL` | Публичный URL SmartRepair Mini App (по умолчанию `https://smartrepair-telegram-miniapp.vercel.app`) |
| `MINI_APP_HOST` | Хост legacy встроенного mini app сервера (по умолчанию `0.0.0.0`) |
| `MINI_APP_PORT` | Порт legacy встроенного mini app сервера (по умолчанию `PORT` или `8080`) |
| `ENABLE_MINI_APP_SERVER` | Включить legacy встроенный mini app HTTP-сервер (`1`/`0`, по умолчанию `0`) |
| `BOT_TRANSPORT` | Транспорт получения апдейтов: `auto`, `polling`, `webhook` |
| `WEBHOOK_PATH` | HTTP path для Telegram webhook (по умолчанию `/telegram/webhook`) |
| `WEBHOOK_BASE_URL` | Базовый публичный URL webhook; в Railway можно не задавать |
| `MINI_APP_AUTH_MAX_AGE_SECONDS` | Максимальный возраст `initData` (секунды) |
| `MINI_APP_DEV_USER_ID` | Dev-only user ID для локального теста mini app без Telegram |

## Railway: Postgres + DB init

1. В Railway откройте ваш project и нажмите `New` -> `Database` -> `Add PostgreSQL`.
2. Откройте сервис бота -> `Variables`.
3. Добавьте переменную `DATABASE_URL`:
   - либо вручную вставьте connection URL из Postgres сервиса,
   - либо через reference на переменную Postgres (в UI Railway).
4. Добавьте mini app переменные:
   - `ENABLE_MINI_APP_SERVER=0`
   - `MINI_APP_URL=https://smartrepair-telegram-miniapp.vercel.app`
   - опционально `MINI_APP_AUTH_MAX_AGE_SECONDS=86400`
5. Убедитесь, что `SQLITE_PATH` в Railway не обязателен (можно не задавать).
6. Задеплойте сервис бота.

При старте бот сам выполняет идемпотентный init схемы и пишет лог:
- `[STARTUP][DB] backend=Postgres source=DATABASE_URL`
- `[STARTUP][DB] Schema init completed (idempotent)`
- `[STARTUP][MINIAPP] server=disabled`
- `[STARTUP][MINIAPP] launch_url=https://smartrepair-telegram-miniapp.vercel.app`
- `[STARTUP][MINIAPP] menu_button=web_app`
- `[STARTUP][BOT] transport=webhook url=https://<bot-domain>/telegram/webhook`

Что нужно сделать в @BotFather:

1. Обновить токен в Railway (`TELEGRAM_TOKEN`) после `regenerate token` при необходимости.
2. Убедиться, что используется тот же бот, что и в деплое.
3. Для надежной совместимости mini app задать домен бота командой `/setdomain`:
   - укажите домен `smartrepair-telegram-miniapp.vercel.app`.

One-off init в Railway (если нужен вручную):

1. Откройте bot service -> `Deployments`/`Shell` -> `Run command`.
2. Выполните:
   ```bash
   python scripts/init_db.py
   ```
3. Ожидаемый результат:
   - `[INIT_DB] Schema init completed (idempotent)`

Локальный тест c Postgres:

```bash
export DATABASE_URL='postgresql://user:pass@host:5432/dbname'
python scripts/init_db.py
python scripts/db_check.py
```
