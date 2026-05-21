# Умный Ремонт

Премиальный сайт и Telegram Mini App для сервиса ремонта квартир под ключ в Москве.

[![React](https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

## Что внутри

- Основной сайт на React, TypeScript, Vite и Tailwind CSS.
- Премиальная hero-секция, портфолио, отзывы и контактные сценарии.
- Быстрые CTA в MAX, WhatsApp и Telegram.
- Express API для отзывов и локального хранения.
- Telegram-бот и Mini App для предварительного расчета ремонта.

## Стек

| Слой | Технологии |
| --- | --- |
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS 4 |
| Motion | GSAP, Framer Motion, Lenis |
| Backend сайта | Express, better-sqlite3 |
| Telegram | aiogram, aiohttp, SQLAlchemy |
| Integrations | Google Sheets, Telegram Mini App |

## Быстрый старт

```bash
npm install
npm run dev
```

Локально сайт откроется на [http://localhost:3000](http://localhost:3000), API-сервер на `3001`.

## Проверки

```bash
npm run lint
npm run build
python3 telegram-bot/scripts/test_miniapp_design.py
```

Для тестов Telegram-бота используйте Python 3.12:

```bash
python3.12 -m venv /tmp/umniy-remont-venv
/tmp/umniy-remont-venv/bin/python -m pip install -r telegram-bot/requirements.txt
GOOGLE_CREDENTIALS='{}' /tmp/umniy-remont-venv/bin/python telegram-bot/scripts/test_telegram_sales_flow.py
```

## Структура

```text
src/
  components/        Основные секции сайта
  utils/             Общие ссылки и утилиты
server/              Express API и локальная база
public/              Брендовые ассеты и изображения
telegram-bot/        Telegram-бот, Mini App и расчеты
```

## Telegram Mini App

Mini App живет в `telegram-bot/miniapp/static`. Подробная инструкция по запуску бота и настройке окружения находится в [telegram-bot/README.md](telegram-bot/README.md).

## Деплой

Репозиторий не привязан к Netlify. Netlify workflow, webhook и repository secrets отключены/удалены.

Текущий production-деплой должен настраиваться через выбранную платформу отдельно от репозитория.
