import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = process.env.DB_PATH ? process.env.DB_PATH : path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT,
    text TEXT NOT NULL,
    rating INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt TEXT,
    updatedAt TEXT,
    approvedAt TEXT,
    rejectedAt TEXT
  )
`);

export const listReviews = () => {
  const stmt = db.prepare('SELECT * FROM reviews ORDER BY updatedAt DESC');
  return stmt.all();
};

export const saveReview = (review) => {
  const stmt = db.prepare(`
    INSERT INTO reviews (id, name, city, text, rating, status, createdAt, updatedAt)
    VALUES (@id, @name, @city, @text, @rating, @status, @createdAt, @updatedAt)
  `);
  stmt.run(review);
  return review;
};

export const getReviewById = (id) => {
  const stmt = db.prepare('SELECT * FROM reviews WHERE id = ?');
  return stmt.get(id);
};

export const updateReviewStatus = (id, nextStatus) => {
  const now = new Date().toISOString();
  let stmt;
  
  if (nextStatus === 'approved') {
    stmt = db.prepare('UPDATE reviews SET status = ?, updatedAt = ?, approvedAt = ?, rejectedAt = NULL WHERE id = ?');
  } else if (nextStatus === 'rejected') {
    stmt = db.prepare('UPDATE reviews SET status = ?, updatedAt = ?, rejectedAt = ?, approvedAt = NULL WHERE id = ?');
  } else {
    stmt = db.prepare('UPDATE reviews SET status = ?, updatedAt = ?, approvedAt = NULL, rejectedAt = NULL WHERE id = ?');
  }
  
  stmt.run(nextStatus, now, now, id);
  return getReviewById(id);
};

export const deleteReviewById = (id) => {
  const stmt = db.prepare('DELETE FROM reviews WHERE id = ?');
  stmt.run(id);
};

export const countStatuses = () => {
  const reviews = listReviews();
  return reviews.reduce(
    (acc, review) => {
      if (review.status === 'approved') acc.approved += 1;
      if (review.status === 'pending') acc.pending += 1;
      if (review.status === 'rejected') acc.rejected += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );
};
