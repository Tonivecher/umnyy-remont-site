import cors from "cors";
import express from "express";
import { randomUUID, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  countLeadStatuses,
  countStatuses,
  deleteLeadById,
  deleteReviewById,
  getLeadById,
  getReviewById,
  listLeads,
  listReviews,
  saveLead,
  saveReview,
  updateLeadStatus,
  updateReviewStatus,
} from "./db.js";
import { isLeadEmailConfigured, sendLeadNotification, verifyLeadEmailTransport } from "./mail.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteUrl = "https://umniremont.pro";
const consentVersions = { lead: "2026-08-26", review: "2026-08-26" };
const allowedOrigins = new Set([
  siteUrl,
  "https://www.umniremont.pro",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const normalizeText = (value, maxLength) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const normalizePhone = (value) => {
  const raw = String(value ?? "").trim().slice(0, 32);
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length < 10 || digits.length > 15) return "";
  return raw.startsWith("+") ? `+${digits}` : digits.length === 11 ? `+${digits}` : digits;
};

const sameSecret = (provided, expected) => {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
};

const createRateLimiter = ({ limit, windowMs }) => {
  const hits = new Map();
  let lastCleanup = 0;

  return (key) => {
    const now = Date.now();
    if (now - lastCleanup > windowMs) {
      for (const [entry, times] of hits) {
        if (!times.length || now - times.at(-1) >= windowMs) hits.delete(entry);
      }
      lastCleanup = now;
    }
    const recent = (hits.get(key) || []).filter((time) => now - time < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return true;
    }
    recent.push(now);
    hits.set(key, recent);
    return false;
  };
};

const leadRateLimited = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });
const reviewRateLimited = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

const securityHeaders = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; upgrade-insecure-requests",
  );
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
};

const authorizeAdmin = (req, res, next) => {
  const expected = process.env.REVIEWS_ADMIN_PASSWORD || "";
  if (!expected) {
    return res.status(503).json({ success: false, error: "Пароль модератора не настроен." });
  }
  const provided = String(req.headers["x-reviews-admin-password"] || "").trim();
  if (!provided) return res.status(401).json({ success: false, error: "Нужен пароль модератора." });
  if (!sameSecret(provided, expected)) {
    return res.status(403).json({ success: false, error: "Неверный пароль модератора." });
  }
  return next();
};

const pageShell = ({ title, description, canonical, body, noindex = false }) => `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex,follow">' : ""}
<link rel="icon" href="/brand/favicon.ico"><style>body{margin:0;background:#0a0a0a;color:#f5f1e8;font:16px/1.6 system-ui,sans-serif}.wrap{max-width:880px;margin:auto;padding:40px 20px 80px}a{color:#d6b36a}header{display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:1px solid #ffffff22;padding-bottom:20px}h1{font:400 clamp(2rem,6vw,4rem)/1.1 Georgia,serif;margin:48px 0 28px}h2{font:400 1.5rem/1.2 Georgia,serif;margin-top:36px}p,li{max-width:72ch}.muted{color:#c9c2b7}.button{display:inline-block;padding:12px 18px;border:1px solid #d6b36a;border-radius:999px;text-decoration:none}</style></head>
<body><main class="wrap"><header><a href="/" aria-label="На главную страницу Умный Ремонт">Умный Ремонт</a><a href="/" class="button">На главную</a></header>${body}</main></body></html>`;

const legalPages = {
  "/privacy-policy/": {
    title: "Политика конфиденциальности | Умный Ремонт",
    description: "Политика обработки персональных данных сайта Умный Ремонт.",
    body: `<h1>Политика конфиденциальности</h1><p class="muted">Версия от 26.08.2026</p><p>Оператор персональных данных — владелец и администратор сайта «Умный Ремонт». Данные посетителей обрабатываются только для работы сайта, обратной связи и модерации отзывов. Обращения принимаются по адресу <a href="mailto:umniremont@gmail.com">umniremont@gmail.com</a> и телефону <a href="tel:+79153261910">+7 915 326-19-10</a>.</p><h2>Какие данные обрабатываются</h2><p>В заявке: имя, телефон, тип объекта и сведения, которые посетитель сообщает сам. В отзыве: имя, город, текст и оценка. Технически могут обрабатываться IP-адрес, дата и параметры запроса для защиты форм от спама и обеспечения работы сайта.</p><h2>Цели и основание</h2><p>Данные нужны для ответа на заявку, рассмотрения и публикации отзыва после модерации, защиты сайта и исполнения согласия посетителя. Основание обработки — отдельное согласие, выраженное в соответствующей форме.</p><h2>Кому доступны данные</h2><p>Доступ имеет администратор сайта. Хостинг сайта обеспечивает Timeweb Cloud. Для доставки уведомлений могут использоваться технические обработчики почты и серверного шлюза в объёме, необходимом для работы обращения. Переход в Telegram, WhatsApp или MAX происходит только по выбору посетителя; там действуют правила соответствующего сервиса.</p><h2>Хранение и права</h2><p>Данные хранятся столько, сколько необходимо для ответа, модерации, защиты сайта или исполнения обязанностей по хранению, затем удаляются или обезличиваются. Для запроса сведений, исправления, удаления или отзыва согласия напишите на <a href="mailto:umniremont@gmail.com">umniremont@gmail.com</a> или позвоните <a href="tel:+79153261910">+7 915 326-19-10</a>.</p>`,
  },
  "/personal-data-consent/": {
    title: "Согласие на обработку персональных данных | Умный Ремонт",
    description: "Текст согласия для заявок на сайте Умный Ремонт.",
    body: `<h1>Согласие на обработку персональных данных</h1><p class="muted">Версия от 26.08.2026</p><p>Отмечая поле согласия в форме заявки, я добровольно разрешаю администратору сайта «Умный Ремонт» обрабатывать указанные мной имя, телефон, тип объекта, площадь, бюджет, сроки и текст обращения.</p><h2>Цель и действия</h2><p>Цель — принять обращение, подготовить ответ и связаться по заявке. Разрешены сбор, запись, систематизация, хранение, уточнение, использование, передача техническим обработчикам хостинга, почтовых уведомлений и вебхуков в необходимом объёме, а также удаление или обезличивание данных.</p><h2>Способ и срок</h2><p>Обработка может быть автоматизированной, неавтоматизированной или смешанной. Согласие действует до достижения цели, отзыва согласия или окончания обязательного срока хранения, если он применяется.</p><h2>Отзыв</h2><p>Для отзыва согласия и удаления данных напишите на <a href="mailto:umniremont@gmail.com">umniremont@gmail.com</a> или позвоните <a href="tel:+79153261910">+7 915 326-19-10</a>. Отзыв не влияет на законность обработки до его получения.</p><p>Подробные условия приведены в <a href="/privacy-policy/">политике конфиденциальности</a>.</p>`,
  },
  "/review-publication-consent/": {
    title: "Согласие на публикацию отзыва | Умный Ремонт",
    description: "Согласие на обработку и публикацию отзыва на сайте Умный Ремонт.",
    body: `<h1>Согласие на публикацию отзыва</h1><p class="muted">Версия от 26.08.2026</p><p>Отправляя отзыв и отмечая отдельное поле согласия, я разрешаю администратору сайта «Умный Ремонт» обработать и опубликовать имя, город, текст отзыва и оценку.</p><h2>Действия с данными</h2><p>Разрешены сбор, запись, систематизация, хранение, использование, модерация, размещение на сайте для публичного доступа, а также удаление или обезличивание данных.</p><h2>Публикация и модерация</h2><p>Отзыв проходит модерацию до публикации. После публикации он доступен неопределённому кругу лиц в сети Интернет. Сайт не запрашивает специальные категории или биометрические персональные данные.</p><h2>Срок и отзыв</h2><p>Согласие действует до отзыва или удаления отзыва. Я могу попросить удалить опубликованный отзыв, написав на <a href="mailto:umniremont@gmail.com">umniremont@gmail.com</a> или позвонив по номеру <a href="tel:+79153261910">+7 915 326-19-10</a>. После получения обращения отзыв удаляется в разумный срок, кроме данных, которые необходимо сохранить по применимым обязанностям.</p><p>Подробные условия обработки данных приведены в <a href="/privacy-policy/">политике конфиденциальности</a>.</p>`,
  },
  "/cookie-policy/": {
    title: "Политика cookie | Умный Ремонт",
    description: "Информация об использовании cookie на сайте Умный Ремонт.",
    body: `<h1>Политика cookie</h1><p class="muted">Версия от 26.08.2026</p><p>Сайт не использует рекламные, аналитические или маркетинговые cookie и не подключает системы веб-аналитики.</p><p>Для технической работы сайта могут использоваться строго необходимые данные браузера и сервера, например параметры соединения и временная защита форм от повторных запросов. Они не применяются для рекламы или профилирования.</p><p>Если работа сайта изменится и появятся необязательные cookie, эта страница будет обновлена до их использования. По вопросам: <a href="mailto:umniremont@gmail.com">umniremont@gmail.com</a>, <a href="tel:+79153261910">+7 915 326-19-10</a>.</p>`,
  },
};

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.enable("strict routing");
  app.set("trust proxy", 1);
  app.use(securityHeaders);
  app.use(cors((req, callback) => {
    const origin = req.get("origin");
    const requestOrigin = `${req.protocol}://${req.get("host")}`;
    if (origin && origin !== requestOrigin && !allowedOrigins.has(origin)) {
      return callback(new Error("CORS_ORIGIN_DENIED"));
    }
    return callback(null, {
      origin: origin || false,
      methods: ["GET", "POST"],
      optionsSuccessStatus: 204,
    });
  }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.get("/api/reviews", (req, res) => {
    if (req.query.scope === "admin") {
      return authorizeAdmin(req, res, () => {
        const status = req.query.status;
        const reviews = listReviews();
        return res.json({
          success: true,
          reviews: status ? reviews.filter((review) => review.status === status) : reviews,
          counts: countStatuses(),
        });
      });
    }
    const reviews = listReviews()
      .filter((review) => review.status === "approved")
      .map(({ id, name, city, text, rating, createdAt, approvedAt }) => ({
        id,
        name,
        city,
        text,
        rating,
        createdAt,
        approvedAt,
      }));
    return res.json({ success: true, reviews });
  });

  app.post("/api/reviews/submit", (req, res) => {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ success: false, error: "Некорректное тело запроса." });
    }
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (reviewRateLimited(ip)) {
      return res.status(429).json({ success: false, error: "Слишком много отзывов подряд. Попробуйте позже." });
    }
    if (normalizeText(payload.company, 120)) {
      return res.status(202).json({ success: true, message: "Спасибо. Отзыв отправлен." });
    }
    if (payload.publicationConsent !== true || payload.consentVersion !== consentVersions.review) {
      return res.status(400).json({ success: false, error: "Подтвердите согласие на обработку и публикацию отзыва." });
    }
    const name = normalizeText(payload.name, 80);
    const city = normalizeText(payload.city, 80);
    const text = normalizeText(payload.text, 1200);
    const rating = Number.parseInt(String(payload.rating ?? "5"), 10);
    if (!name) return res.status(400).json({ success: false, error: "Укажите имя." });
    if (!text || text.length < 12) {
      return res.status(400).json({ success: false, error: "Отзыв должен быть не короче 12 символов." });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: "Оценка должна быть от 1 до 5." });
    }
    const now = new Date().toISOString();
    saveReview({
      id: randomUUID(), name, city, text, rating, status: "pending", createdAt: now, updatedAt: now,
      consentVersion: consentVersions.review, consentAt: now,
      publicationConsentVersion: consentVersions.review, publicationConsentAt: now,
    });
    return res.status(201).json({ success: true, message: "Спасибо. Отзыв отправлен на модерацию и появится на сайте после проверки." });
  });

  app.post("/api/reviews/moderate", authorizeAdmin, (req, res) => {
    const { id, action } = req.body || {};
    if (!id || !action) return res.status(400).json({ success: false, error: "Нужны id отзыва и действие." });
    if (!getReviewById(id)) return res.status(404).json({ success: false, error: "Отзыв не найден." });
    if (action === "delete") {
      deleteReviewById(id);
      return res.json({ success: true, deleted: true, counts: countStatuses() });
    }
    const status = { approve: "approved", reject: "rejected", pending: "pending" }[action];
    if (!status) return res.status(400).json({ success: false, error: "Некорректное действие модерации." });
    return res.json({ success: true, review: updateReviewStatus(id, status), counts: countStatuses() });
  });

  app.get("/api/leads", authorizeAdmin, (req, res) => {
    const status = req.query.status === "new" || req.query.status === "handled" ? req.query.status : undefined;
    res.json({ success: true, leads: listLeads(status), counts: countLeadStatuses() });
  });

  app.post("/api/leads/submit", async (req, res) => {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ success: false, error: "Некорректное тело запроса." });
    }
    if (normalizeText(payload.company, 120)) return res.status(202).json({ success: true, message: "Заявка принята." });
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (leadRateLimited(ip)) {
      return res.status(429).json({ success: false, error: "Слишком много заявок подряд. Попробуйте позже." });
    }
    if (payload.personalDataConsent !== true || payload.consentVersion !== consentVersions.lead) {
      return res.status(400).json({ success: false, error: "Подтвердите согласие на обработку персональных данных." });
    }
    const name = normalizeText(payload.name, 80);
    const phone = normalizePhone(payload.phone);
    const propertyType = normalizeText(payload.propertyType, 20);
    const area = normalizeText(payload.area, 10);
    const budget = normalizeText(payload.budget, 60);
    const timeline = normalizeText(payload.timeline, 60);
    const comment = normalizeText(payload.comment, 1200);
    if (name.length < 2) return res.status(400).json({ success: false, error: "Укажите имя." });
    if (!phone) return res.status(400).json({ success: false, error: "Укажите корректный телефон." });
    if (!["apartment", "house", "office"].includes(propertyType)) {
      return res.status(400).json({ success: false, error: "Выберите тип объекта." });
    }
    if (area && !/^\d{1,5}$/.test(area)) {
      return res.status(400).json({ success: false, error: "Площадь укажите числом в м²." });
    }
    const now = new Date().toISOString();
    const lead = saveLead({
      id: randomUUID(), name, phone, propertyType, area, budget, timeline, comment,
      status: "new", createdAt: now, updatedAt: now, consentVersion: consentVersions.lead, consentAt: now,
    });
    let emailSent = false;
    if (process.env.LEAD_NOTIFICATIONS_DISABLED !== "1") {
      try {
        emailSent = (await sendLeadNotification(lead)).sent;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`Lead ${lead.id} saved, but email delivery failed: ${reason}`);
      }
    }
    return res.status(201).json({ success: true, emailSent, message: "Спасибо! Заявка принята — свяжемся с вами в ближайшее время." });
  });

  app.post("/api/leads/update", authorizeAdmin, (req, res) => {
    const { id, action } = req.body || {};
    if (!id || !action) return res.status(400).json({ success: false, error: "Нужны id заявки и действие." });
    if (!getLeadById(id)) return res.status(404).json({ success: false, error: "Заявка не найдена." });
    if (action === "delete") {
      deleteLeadById(id);
      return res.json({ success: true, deleted: true, counts: countLeadStatuses() });
    }
    if (action !== "new" && action !== "handled") {
      return res.status(400).json({ success: false, error: "Некорректное действие." });
    }
    return res.json({ success: true, lead: updateLeadStatus(id, action), counts: countLeadStatuses() });
  });

  if (process.env.NODE_ENV === "production") {
    const distDir = path.join(__dirname, "../dist");
    const indexHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
    app.use(express.static(distDir, { index: false }));
    app.get("/privacy", (_req, res) => res.redirect(301, "/privacy-policy/"));
    app.get("/cookies", (_req, res) => res.redirect(301, "/cookie-policy/"));
    for (const [route, page] of Object.entries(legalPages)) {
      const noSlashRoute = route.slice(0, -1);
      app.get(noSlashRoute, (_req, res) => res.redirect(301, route));
      app.get(route, (_req, res) => res.type("html").send(pageShell({ ...page, canonical: `${siteUrl}${route}` })));
    }
    app.get("/", (_req, res) => res.type("html").send(indexHtml));
    app.use((_req, res) => res.status(404).type("html").send(pageShell({
      title: "Страница не найдена | Умный Ремонт",
      description: "Запрошенная страница не найдена.",
      canonical: `${siteUrl}/`,
      noindex: true,
      body: '<h1>Страница не найдена</h1><p>Проверьте адрес или вернитесь на главную страницу сайта.</p><p><a class="button" href="/">На главную</a></p>',
    })));
  }

  app.use((error, req, res, _next) => {
    const isCorsDenied = error instanceof Error && error.message === "CORS_ORIGIN_DENIED";
    const isMalformedJson = error?.type === "entity.parse.failed";
    const status = isCorsDenied ? 403 : isMalformedJson ? 400 : 500;
    if (status === 500) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Unhandled request error: ${reason}`);
    }
    const message = status === 403
      ? "Источник запроса не разрешён."
      : status === 400
        ? "Некорректный запрос."
        : "Внутренняя ошибка сервера.";
    if (req.path.startsWith("/api/")) {
      return res.status(status).json({ success: false, error: message });
    }
    return res.status(status).type("html").send(message);
  });
  return app;
};

const app = createApp();
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const port = Number.parseInt(process.env.PORT || "3001", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
    if (process.env.LEAD_NOTIFICATIONS_DISABLED === "1" || !isLeadEmailConfigured) return;
    verifyLeadEmailTransport().catch((error) => {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Lead email transport verification failed: ${reason}`);
    });
  });
}
