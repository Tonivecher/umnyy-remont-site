import { getStore } from '@netlify/blobs';
import { randomUUID, timingSafeEqual } from 'node:crypto';

const STORE_NAME = 'reviews';
const REVIEW_PREFIX = 'review:';
const REVIEW_STATUSES = new Set(['pending', 'approved', 'rejected']);

const responseHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const getReviewsStore = () => getStore({ name: STORE_NAME, consistency: 'strong' });

const makeReviewKey = (reviewId) => `${REVIEW_PREFIX}${reviewId}`;

const normalizeField = (value, maxLength) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

export const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: responseHeaders,
  });

export const methodNotAllowed = (allowedMethods) =>
  new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      ...responseHeaders,
      allow: allowedMethods.join(', '),
    },
  });

export const readJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

export const validateReviewPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { error: 'Некорректное тело запроса.' };
  }

  const name = normalizeField(payload.name, 80);
  const city = normalizeField(payload.city, 80);
  const text = normalizeField(payload.text, 1200);
  const honeypot = normalizeField(payload.company, 120);
  const rating = Number.parseInt(String(payload.rating ?? '5'), 10);

  if (honeypot) {
    return { spam: true };
  }

  if (!name) {
    return { error: 'Укажите имя.' };
  }

  if (!text || text.length < 12) {
    return { error: 'Отзыв должен быть не короче 12 символов.' };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Оценка должна быть от 1 до 5.' };
  }

  return {
    value: {
      id: randomUUID(),
      name,
      city,
      text,
      rating,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
};

export const listReviews = async () => {
  const store = getReviewsStore();
  const { blobs } = await store.list({ prefix: REVIEW_PREFIX });

  const reviews = await Promise.all(
    blobs.map(async ({ key }) => {
      const review = await store.get(key, { type: 'json' });
      return review ?? null;
    }),
  );

  return reviews
    .filter(Boolean)
    .sort((left, right) => {
      const leftTime = Date.parse(left.updatedAt || left.createdAt || 0);
      const rightTime = Date.parse(right.updatedAt || right.createdAt || 0);
      return rightTime - leftTime;
    });
};

export const saveReview = async (review) => {
  const store = getReviewsStore();
  await store.setJSON(makeReviewKey(review.id), review);
  return review;
};

export const getReviewById = async (reviewId) => {
  const store = getReviewsStore();
  return store.get(makeReviewKey(reviewId), { type: 'json' });
};

export const deleteReviewById = async (reviewId) => {
  const store = getReviewsStore();
  await store.delete(makeReviewKey(reviewId));
};

export const updateReviewStatus = async (reviewId, nextStatus) => {
  if (!REVIEW_STATUSES.has(nextStatus)) {
    throw new Error('Некорректный статус отзыва.');
  }

  const existingReview = await getReviewById(reviewId);
  if (!existingReview) {
    return null;
  }

  const now = new Date().toISOString();
  const nextReview = {
    ...existingReview,
    status: nextStatus,
    updatedAt: now,
  };

  if (nextStatus === 'approved') {
    nextReview.approvedAt = now;
    delete nextReview.rejectedAt;
  }

  if (nextStatus === 'rejected') {
    nextReview.rejectedAt = now;
    delete nextReview.approvedAt;
  }

  if (nextStatus === 'pending') {
    delete nextReview.approvedAt;
    delete nextReview.rejectedAt;
  }

  await saveReview(nextReview);
  return nextReview;
};

export const toPublicReview = (review) => ({
  id: review.id,
  name: review.name,
  city: review.city,
  text: review.text,
  rating: review.rating,
  createdAt: review.createdAt,
  approvedAt: review.approvedAt,
});

export const countStatuses = (reviews) =>
  reviews.reduce(
    (accumulator, review) => {
      if (review.status === 'approved') accumulator.approved += 1;
      if (review.status === 'pending') accumulator.pending += 1;
      if (review.status === 'rejected') accumulator.rejected += 1;
      return accumulator;
    },
    { pending: 0, approved: 0, rejected: 0 },
  );

const getAdminPassword = () =>
  globalThis.Netlify?.env?.get?.('REVIEWS_ADMIN_PASSWORD') || process.env.REVIEWS_ADMIN_PASSWORD || '';

export const authorizeAdmin = (request) => {
  const expectedPassword = getAdminPassword();
  if (!expectedPassword) {
    return json(
      {
        success: false,
        error: 'Пароль модератора не настроен. Добавьте REVIEWS_ADMIN_PASSWORD в Netlify environment variables.',
      },
      503,
    );
  }

  const providedPassword = request.headers.get('x-reviews-admin-password')?.trim() || '';
  if (!providedPassword) {
    return json({ success: false, error: 'Нужен пароль модератора.' }, 401);
  }

  const providedBuffer = Buffer.from(providedPassword);
  const expectedBuffer = Buffer.from(expectedPassword);

  const isValid =
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer);

  if (!isValid) {
    return json({ success: false, error: 'Неверный пароль модератора.' }, 403);
  }

  return null;
};

export const parseStatusFilter = (value) => (REVIEW_STATUSES.has(value) ? value : null);
