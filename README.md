# Умный Ремонт

Сайт премиальной реализации интерьеров: портфолио, отзывы, заявки и контактные каналы. В репозитории также сохранены Telegram-бот и Mini App.

## Стек сайта

- React 19, TypeScript, Vite 6, Tailwind CSS 4
- Express 5 и SQLite
- GSAP, Framer Motion, Lenis

## Локальная разработка

```sh
npm ci
npm run dev
```

Frontend: `http://localhost:3000`. Express API: `http://localhost:3001`.

## Production

```sh
npm ci
npm run build
NODE_ENV=production npm start
```

Приложение слушает платформенный `PORT` на `0.0.0.0`. Для Timeweb используются Node.js 22, `DB_PATH=/data` и секрет `REVIEWS_ADMIN_PASSWORD`.

Заявки из обеих форм сохраняются в SQLite и отправляются на `umniremont@gmail.com`. Для Gmail SMTP добавьте переменные окружения:

```sh
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=umniremont@gmail.com
SMTP_PASS=<пароль приложения Google>
LEADS_EMAIL_TO=umniremont@gmail.com
LEADS_EMAIL_FROM=umniremont@gmail.com
```

`SMTP_PASS` должен быть паролем приложения Google, а не обычным паролем аккаунта. Секрет не хранится в Git.

Telegram-бот находится в `telegram-bot/`; инструкции запуска — в `telegram-bot/README.md`.
