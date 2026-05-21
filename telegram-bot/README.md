# Telegram-бот «Умный Ремонт»

Бот для сбора заявок (имя, телефон, адрес, площадь, бюджет) и записи в Google Таблицу `Leads`.
Расчёт ремонта открывает Telegram Mini App «Умного Ремонта», плюс остаётся чатовый fallback-сценарий.

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

- `MINI_APP_URL` (по умолчанию `http://localhost:8080/miniapp`; в продакшне укажите публичный HTTPS URL mini app)
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
2. В Telegram нажмите кнопку `Рассчитать ремонт` (или отправьте `/estimate`)
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
   - `/estimate_edit_room` (выбрать комнату → выбрать поле → ввести новое значение)
   - `/estimate_remove_room` (выбрать комнату → удалить)
6. После сообщения `Комната добавлена` нажмите `Завершить смету` (или `/estimate_finish`)
7. Проверьте, что итог содержит разделы `Материалы`, `Работы` и `Допущения`.
8. Перезапустите бота и убедитесь, что `/estimate` подхватывает сохраненную сессию.

Быстрая проверка регистрации хендлеров без запуска polling:

```bash
python scripts/bot_dry_run.py
```

## Telegram Mini App «Умный Ремонт»

Что реализовано:

- mini app «Умный Ремонт» как основной сценарий запуска из бота
- menu button бота настроен на mini app «Умный Ремонт»
- production-запуск бота через webhook, чтобы не зависеть от конфликтующих `getUpdates`
- валидация Telegram `initData` на backend (HMAC)
- сохранение/загрузка сессии сметы в `estimate_sessions`
- расчет материалов и работ по `econom/standard/premium` в mini app UI
- блок `Личный кабинет`: профиль Telegram, прогресс заполнения, статус и время последнего сохранения
- быстрые пресеты комнат (`Кухня`, `Санузел`, `Спальня`, `Гостиная`)
- действия для комнат: редактирование, удаление, дублирование
- сценарии бюджета (`Standard`, `+10%`, `+15%`, `дельта Premium`)
- экспорт результата: копирование отчета и скачивание JSON
- кнопка `Рассчитать ремонт` в главном меню как WebApp-кнопка
- встроенный mini app сервер остаётся как fallback/локальный режим при `ENABLE_MINI_APP_SERVER=1`

Как проверить вручную:

1. Убедитесь, что `MINI_APP_URL` указывает на публичный HTTPS URL mini app.
2. Откройте чат с ботом → нажмите `Рассчитать ремонт`.
3. В mini app заполните объект и комнаты, нажмите `Рассчитать ремонт`.
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
| `MINI_APP_URL` | Публичный URL Telegram Mini App (локально `http://localhost:8080/miniapp`; в продакшне нужен HTTPS URL) |
| `MINI_APP_HOST` | Хост встроенного mini app сервера (по умолчанию `0.0.0.0`) |
| `MINI_APP_PORT` | Порт legacy встроенного mini app сервера (по умолчанию `PORT` или `8080`) |
| `ENABLE_MINI_APP_SERVER` | Включить legacy встроенный mini app HTTP-сервер (`1`/`0`, по умолчанию `0`) |
| `BOT_TRANSPORT` | Транспорт получения апдейтов: `auto`, `polling`, `webhook` |
| `WEBHOOK_PATH` | HTTP path для Telegram webhook (по умолчанию `/telegram/webhook`) |
| `WEBHOOK_BASE_URL` | Базовый публичный URL webhook; в Railway можно не задавать |
| `MINI_APP_AUTH_MAX_AGE_SECONDS` | Максимальный возраст `initData` (секунды) |
| `MINI_APP_DEV_USER_ID` | Dev-only user ID для локального теста mini app без Telegram |

## Timeweb Cloud: почему бот может не отвечать и как запускать

Mini app может открываться как обычная web-страница, но Telegram-бот отвечает только когда где-то постоянно запущен процесс `python main.py` с реальным `TELEGRAM_TOKEN`. Если на Timeweb задеплоен только сайт, бот физически не получает сообщения из Telegram.

В репозитории добавлен `telegram-bot/Dockerfile`, чтобы бота можно было запустить отдельным сервисом/контейнером на Timeweb Cloud без смешивания с frontend-сайтом.

Рекомендуемый вариант для быстрого стабильного запуска:

1. Создать в Timeweb Cloud отдельное приложение/контейнер для директории `telegram-bot`.
2. Использовать Dockerfile из этой директории.
3. Добавить environment variables, не коммитя секреты в git:
   - `TELEGRAM_TOKEN=<токен от @BotFather>`
   - `ADMIN_ID=<ваш Telegram user id>`
   - `GOOGLE_CREDENTIALS=<JSON сервисного аккаунта Google>`
   - `BOT_TRANSPORT=polling`
   - `ENABLE_MINI_APP_SERVER=1`, если mini app будет обслуживаться этим же контейнером
   - `MINI_APP_URL=https://<публичный-домен>/miniapp`
   - `MINI_APP_HOST=0.0.0.0`
   - `MINI_APP_PORT=8080`
   - `BOT_PUBLIC_URL=https://t.me/umniyremontbot`
   - `TELEGRAM_CHANNEL_URL=https://t.me/proumniremont`
   - `PUBLIC_SITE_URL=https://umniremont.pro`
4. Убедиться, что порт контейнера `8080` опубликован, если через него отдаётся mini app.
5. В логах старта должны появиться строки:
   - `[STARTUP][DB] Schema init completed (idempotent)`
   - `[STARTUP][MINIAPP] launch_url=...`
   - `[STARTUP][MINIAPP] menu_button=web_app`
   - `[STARTUP][BOT] transport=polling`
   - `[STARTUP] Bot started in polling mode`

Если нужен webhook-режим вместо polling:

- задать `BOT_TRANSPORT=webhook`;
- задать `WEBHOOK_BASE_URL=https://<bot-domain>`;
- `WEBHOOK_PATH` оставить `/telegram/webhook` или изменить осознанно;
- убедиться, что домен публичный HTTPS и Telegram может достучаться до контейнера.

Что сделать в @BotFather для mini app:

1. Убедиться, что токен относится именно к `@umniyremontbot`.
2. Для совместимости mini app задать домен командой `/setdomain`:
   - указать домен, где доступен mini app.

One-off init базы, если нужен вручную:

```bash
python scripts/init_db.py
```

Локальная проверка перед деплоем:

```bash
python scripts/bot_dry_run.py
python scripts/estimate_selftest.py
python scripts/db_check.py
```

Локальный тест c Postgres:

```bash
export DATABASE_URL='postgresql://user:***@host:5432/dbname'
python scripts/init_db.py
python scripts/db_check.py
```
