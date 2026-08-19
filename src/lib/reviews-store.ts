// Preview-compatible replacement for the original Express + SQLite reviews backend
// (original source preserved in legacy/server/db.js and legacy/server/index.js).
// The portable runtime does not use better-sqlite3, so reviews live in an
// in-memory store seeded with demo data. The HTTP contract is identical.

export type ReviewStatus = "pending" | "approved" | "rejected";

export type StoredReview = {
  id: string;
  name: string;
  city: string;
  text: string;
  rating: number;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | undefined;
  rejectedAt?: string | undefined;
};

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

const seed: StoredReview[] = [
  {
    id: "seed-1",
    name: "Ирина Соколова",
    city: "Москва",
    text: "Ремонт трёхкомнатной квартиры сделали точно в срок. Отдельное спасибо за аккуратность и ежедневные отчёты по этапам работ.",
    rating: 5,
    status: "approved",
    createdAt: iso(42),
    updatedAt: iso(40),
    approvedAt: iso(40),
  },
  {
    id: "seed-2",
    name: "Дмитрий Королёв",
    city: "Одинцово",
    text: "Понравился инженерный подход: сметы прозрачные, материалы согласовывали заранее, скрытых доплат не было.",
    rating: 5,
    status: "approved",
    createdAt: iso(28),
    updatedAt: iso(26),
    approvedAt: iso(26),
  },
  {
    id: "seed-3",
    name: "Марина Гущина",
    city: "Красногорск",
    text: "Санузел с камнем и подсветкой получился именно таким, как на визуализации. Работой бригады довольны.",
    rating: 4,
    status: "approved",
    createdAt: iso(15),
    updatedAt: iso(14),
    approvedAt: iso(14),
  },
  {
    id: "seed-4",
    name: "Сергей Ланской",
    city: "Москва",
    text: "Отправил отзыв после сдачи объекта: команда действительно держит уровень премиального ремонта.",
    rating: 5,
    status: "pending",
    createdAt: iso(2),
    updatedAt: iso(2),
  },
];

const globalStore = globalThis as unknown as { __umniReviews?: StoredReview[] };
if (!globalStore.__umniReviews) {
  globalStore.__umniReviews = seed.map((review) => ({ ...review }));
}

const reviews = () => globalStore.__umniReviews!;

export const listReviews = () =>
  [...reviews()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

export const saveReview = (review: StoredReview) => {
  reviews().push(review);
  return review;
};

export const getReviewById = (id: string) => reviews().find((review) => review.id === id);

export const deleteReviewById = (id: string) => {
  const index = reviews().findIndex((review) => review.id === id);
  if (index >= 0) reviews().splice(index, 1);
};

export const updateReviewStatus = (id: string, nextStatus: ReviewStatus) => {
  const review = getReviewById(id);
  if (!review) return undefined;

  const now = new Date().toISOString();
  review.status = nextStatus;
  review.updatedAt = now;
  review.approvedAt = nextStatus === "approved" ? now : undefined;
  review.rejectedAt = nextStatus === "rejected" ? now : undefined;
  return review;
};

export const countStatuses = () =>
  reviews().reduce(
    (acc, review) => {
      acc[review.status] += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 } as Record<ReviewStatus, number>,
  );

export const normalizeField = (value: unknown, maxLength: number) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

export const getAdminPassword = () => process.env["REVIEWS_ADMIN_PASSWORD"] || "umniremont";

export const checkAdmin = (request: Request) => {
  const expected = getAdminPassword();
  if (!expected) {
    return { status: 503, error: "Пароль модератора не настроен." };
  }

  const provided = (request.headers.get("x-reviews-admin-password") || "").trim();
  if (!provided) return { status: 401, error: "Нужен пароль модератора." };
  if (provided !== expected) return { status: 403, error: "Неверный пароль модератора." };

  return null;
};
