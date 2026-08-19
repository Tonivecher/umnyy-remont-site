# Умный Ремонт

Сайт премиальной реализации интерьеров: портфолио, отзывы, формы заявок и контактные каналы. В репозитории также сохранены Telegram-бот и Mini App.

## Разработка

```sh
npm install
npm run dev
```

## Production

```sh
npm run build
npm start
```

Для production задайте секрет `REVIEWS_ADMIN_PASSWORD`. Серверная сборка создаётся в `.output/`.

Код Telegram-бота находится в `telegram-bot/`; инструкции запуска — в `telegram-bot/README.md`.
