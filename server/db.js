import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = process.env.DB_PATH || path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "database.sqlite"));
db.pragma("journal_mode = WAL");

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
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    propertyType TEXT NOT NULL,
    area TEXT,
    budget TEXT,
    timeline TEXT,
    comment TEXT,
    status TEXT DEFAULT 'new',
    createdAt TEXT,
    updatedAt TEXT
  );
`);

export const listReviews = () =>
  db.prepare("SELECT * FROM reviews ORDER BY updatedAt DESC").all();

export const saveReview = (review) => {
  db.prepare(`
    INSERT INTO reviews (id, name, city, text, rating, status, createdAt, updatedAt)
    VALUES (@id, @name, @city, @text, @rating, @status, @createdAt, @updatedAt)
  `).run(review);
  return review;
};

export const getReviewById = (id) =>
  db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);

export const updateReviewStatus = (id, nextStatus) => {
  const now = new Date().toISOString();
  const statements = {
    approved:
      "UPDATE reviews SET status = ?, updatedAt = ?, approvedAt = ?, rejectedAt = NULL WHERE id = ?",
    rejected:
      "UPDATE reviews SET status = ?, updatedAt = ?, rejectedAt = ?, approvedAt = NULL WHERE id = ?",
    pending:
      "UPDATE reviews SET status = ?, updatedAt = ?, approvedAt = NULL, rejectedAt = NULL WHERE id = ?",
  };
  const params = nextStatus === "pending" ? [nextStatus, now, id] : [nextStatus, now, now, id];
  db.prepare(statements[nextStatus]).run(...params);
  return getReviewById(id);
};

export const deleteReviewById = (id) =>
  db.prepare("DELETE FROM reviews WHERE id = ?").run(id);

export const countStatuses = () =>
  listReviews().reduce(
    (counts, review) => {
      if (review.status in counts) counts[review.status] += 1;
      return counts;
    },
    { pending: 0, approved: 0, rejected: 0 },
  );

export const listLeads = (status) => {
  if (status) {
    return db
      .prepare("SELECT * FROM leads WHERE status = ? ORDER BY createdAt DESC")
      .all(status);
  }
  return db.prepare("SELECT * FROM leads ORDER BY createdAt DESC").all();
};

export const saveLead = (lead) => {
  db.prepare(`
    INSERT INTO leads (
      id, name, phone, propertyType, area, budget, timeline, comment, status, createdAt, updatedAt
    ) VALUES (
      @id, @name, @phone, @propertyType, @area, @budget, @timeline, @comment, @status, @createdAt, @updatedAt
    )
  `).run(lead);
  return lead;
};

export const getLeadById = (id) =>
  db.prepare("SELECT * FROM leads WHERE id = ?").get(id);

export const updateLeadStatus = (id, status) => {
  db.prepare("UPDATE leads SET status = ?, updatedAt = ? WHERE id = ?").run(
    status,
    new Date().toISOString(),
    id,
  );
  return getLeadById(id);
};

export const deleteLeadById = (id) =>
  db.prepare("DELETE FROM leads WHERE id = ?").run(id);

export const countLeadStatuses = () =>
  listLeads().reduce(
    (counts, lead) => {
      if (lead.status in counts) counts[lead.status] += 1;
      return counts;
    },
    { new: 0, handled: 0 },
  );
