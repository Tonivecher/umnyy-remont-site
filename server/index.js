import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listReviews, saveReview, getReviewById, deleteReviewById, updateReviewStatus, countStatuses } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const normalizeField = (value, maxLength) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const getAdminPassword = () => process.env.REVIEWS_ADMIN_PASSWORD || '';

const authorizeAdmin = (req, res, next) => {
  const expectedPassword = getAdminPassword();
  if (!expectedPassword) {
    return res.status(503).json({ success: false, error: 'Пароль модератора не настроен.' });
  }

  const providedPassword = req.headers['x-reviews-admin-password']?.trim() || '';
  if (!providedPassword) {
    return res.status(401).json({ success: false, error: 'Нужен пароль модератора.' });
  }

  if (providedPassword !== expectedPassword) {
    return res.status(403).json({ success: false, error: 'Неверный пароль модератора.' });
  }

  next();
};

app.get('/api/reviews', (req, res) => {
  const scope = req.query.scope;
  const statusFilter = req.query.status;
  const reviews = listReviews();

  if (scope === 'admin') {
    return authorizeAdmin(req, res, () => {
      const filteredReviews = statusFilter
        ? reviews.filter((review) => review.status === statusFilter)
        : reviews;

      res.json({
        success: true,
        reviews: filteredReviews,
        counts: countStatuses(),
      });
    });
  }

  const publicReviews = reviews
    .filter((review) => review.status === 'approved')
    .map(review => ({
      id: review.id,
      name: review.name,
      city: review.city,
      text: review.text,
      rating: review.rating,
      createdAt: review.createdAt,
      approvedAt: review.approvedAt,
    }));

  res.json({
    success: true,
    reviews: publicReviews,
    counts: countStatuses(),
  });
});

app.post('/api/reviews/submit', (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ success: false, error: 'Некорректное тело запроса.' });
  }

  const name = normalizeField(payload.name, 80);
  const city = normalizeField(payload.city, 80);
  const text = normalizeField(payload.text, 1200);
  const honeypot = normalizeField(payload.company, 120);
  const rating = Number.parseInt(String(payload.rating ?? '5'), 10);

  if (honeypot) {
    return res.status(202).json({ success: true, message: 'Спасибо. Отзыв отправлен на модерацию.' });
  }

  if (!name) return res.status(400).json({ success: false, error: 'Укажите имя.' });
  if (!text || text.length < 12) return res.status(400).json({ success: false, error: 'Отзыв должен быть не короче 12 символов.' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, error: 'Оценка должна быть от 1 до 5.' });

  const review = {
    id: randomUUID(),
    name,
    city,
    text,
    rating,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveReview(review);
  res.status(201).json({ success: true, message: 'Спасибо. Отзыв отправлен на модерацию и появится на сайте после проверки.' });
});

app.post('/api/reviews/moderate', authorizeAdmin, (req, res) => {
  const { id: reviewId, action } = req.body;
  if (!reviewId || !action) {
    return res.status(400).json({ success: false, error: 'Нужны id отзыва и действие.' });
  }

  const review = getReviewById(reviewId);
  if (!review) {
    return res.status(404).json({ success: false, error: 'Отзыв не найден.' });
  }

  if (action === 'delete') {
    deleteReviewById(reviewId);
    return res.json({ success: true, deleted: true, counts: countStatuses() });
  }

  const actionToStatus = { approve: 'approved', reject: 'rejected', pending: 'pending' };
  const nextStatus = actionToStatus[action];
  if (!nextStatus) {
    return res.status(400).json({ success: false, error: 'Некорректное действие модерации.' });
  }

  const updatedReview = updateReviewStatus(reviewId, nextStatus);
  res.json({ success: true, review: updatedReview, counts: countStatuses() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
