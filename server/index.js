import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number.parseInt(process.env.PORT || "3001", 10);

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "100kb" }));

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

const authorizeAdmin = (req, res, next) => {
  const expected = process.env.REVIEWS_ADMIN_PASSWORD || "";
  if (!expected) {
    return res.status(503).json({ success: false, error: "Пароль модератора не настроен." });
  }

  const provided = String(req.headers["x-reviews-admin-password"] || "").trim();
  if (!provided) {
    return res.status(401).json({ success: false, error: "Нужен пароль модератора." });
  }
  if (provided !== expected) {
    return res.status(403).json({ success: false, error: "Неверный пароль модератора." });
  }
  next();
};

const leadHits = new Map();
const isRateLimited = (key) => {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (leadHits.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= 5) {
    leadHits.set(key, recent);
    return true;
  }
  recent.push(now);
  leadHits.set(key, recent);
  return false;
};

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/reviews", (req, res) => {
  const reviews = listReviews();
  if (req.query.scope === "admin") {
    return authorizeAdmin(req, res, () => {
      const status = req.query.status;
      res.json({
        success: true,
        reviews: status ? reviews.filter((review) => review.status === status) : reviews,
        counts: countStatuses(),
      });
    });
  }

  res.json({
    success: true,
    reviews: reviews
      .filter((review) => review.status === "approved")
      .map(({ id, name, city, text, rating, createdAt, approvedAt }) => ({
        id,
        name,
        city,
        text,
        rating,
        createdAt,
        approvedAt,
      })),
    counts: countStatuses(),
  });
});

app.post("/api/reviews/submit", (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ success: false, error: "Некорректное тело запроса." });
  }

  const name = normalizeText(payload.name, 80);
  const city = normalizeText(payload.city, 80);
  const text = normalizeText(payload.text, 1200);
  const honeypot = normalizeText(payload.company, 120);
  const rating = Number.parseInt(String(payload.rating ?? "5"), 10);

  if (honeypot) {
    return res.status(202).json({ success: true, message: "Спасибо. Отзыв отправлен." });
  }
  if (!name) return res.status(400).json({ success: false, error: "Укажите имя." });
  if (!text || text.length < 12) {
    return res.status(400).json({ success: false, error: "Отзыв должен быть не короче 12 символов." });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: "Оценка должна быть от 1 до 5." });
  }

  const now = new Date().toISOString();
  saveReview({
    id: randomUUID(),
    name,
    city,
    text,
    rating,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  return res.status(201).json({
    success: true,
    message: "Спасибо. Отзыв отправлен на модерацию и появится на сайте после проверки.",
  });
});

app.post("/api/reviews/moderate", authorizeAdmin, (req, res) => {
  const { id, action } = req.body || {};
  if (!id || !action) {
    return res.status(400).json({ success: false, error: "Нужны id отзыва и действие." });
  }
  if (!getReviewById(id)) {
    return res.status(404).json({ success: false, error: "Отзыв не найден." });
  }
  if (action === "delete") {
    deleteReviewById(id);
    return res.json({ success: true, deleted: true, counts: countStatuses() });
  }

  const statuses = { approve: "approved", reject: "rejected", pending: "pending" };
  const status = statuses[action];
  if (!status) {
    return res.status(400).json({ success: false, error: "Некорректное действие модерации." });
  }

  return res.json({
    success: true,
    review: updateReviewStatus(id, status),
    counts: countStatuses(),
  });
});

app.get("/api/leads", authorizeAdmin, (req, res) => {
  const status = req.query.status;
  const safeStatus = status === "new" || status === "handled" ? status : undefined;
  res.json({
    success: true,
    leads: listLeads(safeStatus),
    counts: countLeadStatuses(),
  });
});

app.post("/api/leads/submit", (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ success: false, error: "Некорректное тело запроса." });
  }

  if (normalizeText(payload.company, 120)) {
    return res.status(202).json({ success: true, message: "Заявка принята." });
  }

  const ip =
    String(req.headers["cf-connecting-ip"] || "") ||
    String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.ip ||
    "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({
      success: false,
      error: "Слишком много заявок подряд. Попробуйте позже.",
    });
  }

  const name = normalizeText(payload.name, 80);
  const phone = normalizePhone(payload.phone);
  const propertyType = normalizeText(payload.propertyType, 20);
  const area = normalizeText(payload.area, 10);
  const budget = normalizeText(payload.budget, 60);
  const timeline = normalizeText(payload.timeline, 60);
  const comment = normalizeText(payload.comment, 1200);

  if (name.length < 2) {
    return res.status(400).json({ success: false, error: "Укажите имя." });
  }
  if (!phone) {
    return res.status(400).json({ success: false, error: "Укажите корректный телефон." });
  }
  if (!["apartment", "house", "office"].includes(propertyType)) {
    return res.status(400).json({ success: false, error: "Выберите тип объекта." });
  }
  if (area && !/^\d{1,5}$/.test(area)) {
    return res.status(400).json({ success: false, error: "Площадь укажите числом в м²." });
  }

  const now = new Date().toISOString();
  saveLead({
    id: randomUUID(),
    name,
    phone,
    propertyType,
    area,
    budget,
    timeline,
    comment,
    status: "new",
    createdAt: now,
    updatedAt: now,
  });

  return res.status(201).json({
    success: true,
    message: "Спасибо! Заявка принята — свяжемся с вами в ближайшее время.",
  });
});

app.post("/api/leads/update", authorizeAdmin, (req, res) => {
  const { id, action } = req.body || {};
  if (!id || !action) {
    return res.status(400).json({ success: false, error: "Нужны id заявки и действие." });
  }
  if (!getLeadById(id)) {
    return res.status(404).json({ success: false, error: "Заявка не найдена." });
  }
  if (action === "delete") {
    deleteLeadById(id);
    return res.json({ success: true, deleted: true, counts: countLeadStatuses() });
  }
  if (action !== "new" && action !== "handled") {
    return res.status(400).json({ success: false, error: "Некорректное действие." });
  }

  return res.json({
    success: true,
    lead: updateLeadStatus(id, action),
    counts: countLeadStatuses(),
  });
});

if (process.env.NODE_ENV === "production") {
  const distDir = path.join(__dirname, "../dist");
  const indexHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => {
    res.type("html").send(indexHtml);
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
