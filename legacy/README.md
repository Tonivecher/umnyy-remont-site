# Оригинальный исходный код (архив)

Здесь сохранён исходный код Vite/Express-версии проекта:

- `server/index.js`, `server/db.js` — оригинальный бэкенд отзывов на Express + SQLite (better-sqlite3).
- `original-App.tsx`, `original-index.css`, `original-index.html` — исходные файлы Vite-SPA.

Текущий переносимый runtime не использует `better-sqlite3`, поэтому тот же
HTTP-контракт (`GET /api/reviews`, `POST /api/reviews/submit`, `POST /api/reviews/moderate`)
реализован в:

- `src/routes/api/reviews.ts`
- `src/routes/api/reviews.submit.ts`
- `src/routes/api/reviews.moderate.ts`
- `src/lib/reviews-store.ts` (хранилище в памяти с демо-отзывами)

Пароль модератора берётся из переменной окружения `REVIEWS_ADMIN_PASSWORD`
(в предпросмотре по умолчанию `umniremont`). Панель модерации открывается по `/?admin=reviews`.
Для продакшена можно вернуть Express/SQLite из `legacy/server` или перенести хранилище в базу данных.
