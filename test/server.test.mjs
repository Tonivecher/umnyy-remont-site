import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";
import Database from "better-sqlite3";

const port = 4317;
const baseUrl = `http://127.0.0.1:${port}`;
const dbPath = await mkdtemp(path.join(tmpdir(), "umniremont-test-"));
const sourceIndexHtml = await readFile("index.html", "utf8");
const legacyDb = new Database(path.join(dbPath, "database.sqlite"));
legacyDb.exec("CREATE TABLE reviews (id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT, text TEXT NOT NULL, rating INTEGER NOT NULL, status TEXT, createdAt TEXT, updatedAt TEXT, approvedAt TEXT, rejectedAt TEXT); CREATE TABLE leads (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, propertyType TEXT NOT NULL, area TEXT, budget TEXT, timeline TEXT, comment TEXT, status TEXT, createdAt TEXT, updatedAt TEXT);");
legacyDb.close();
const server = spawn("node", ["server/index.js"], {
  env: { ...process.env, NODE_ENV: "production", PORT: String(port), DB_PATH: dbPath, LEAD_NOTIFICATIONS_DISABLED: "1", REVIEWS_ADMIN_PASSWORD: "test-password" },
  stdio: "ignore",
});

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(`${baseUrl}/health`)).ok) return; } catch { /* wait for startup */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Test server did not start.");
};

await waitForServer();
test.after(() => server.kill());

test("public routes, metadata and headers", async () => {
  const home = await fetch(`${baseUrl}/`);
  const html = await home.text();
  assert.equal(home.status, 200);
  assert.match(html, /Умный Ремонт/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /rel="canonical" href="https:\/\/umniremont\.pro\//);
  assert.match(html, /og:site_name/);
  assert.match(html, /inLanguage/);
  assert.match(home.headers.get("content-security-policy") || "", /default-src 'self'/);
  assert.equal(home.headers.get("x-content-type-options"), "nosniff");
  assert.match(home.headers.get("strict-transport-security") || "", /max-age=/);
  for (const route of ["/privacy-policy/", "/personal-data-consent/", "/review-publication-consent/", "/cookie-policy/"]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(await response.text(), /<h1>/);
    assert.equal((await fetch(`${baseUrl}${route.slice(0, -1)}`, { redirect: "manual" })).status, 301, route);
  }
  assert.equal((await fetch(`${baseUrl}/privacy`, { redirect: "manual" })).status, 301);
  assert.equal((await fetch(`${baseUrl}/cookies`, { redirect: "manual" })).status, 301);
  const missing = await fetch(`${baseUrl}/missing-page`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /noindex,follow/);
  const hostileMissing = await fetch(`${baseUrl}/%22%3E%3Cscript%3Ealert(1)%3C/script%3E`);
  const hostileHtml = await hostileMissing.text();
  assert.equal(hostileMissing.status, 404);
  assert.match(hostileHtml, /rel="canonical" href="https:\/\/umniremont\.pro\//);
  assert.ok(!hostileHtml.includes("alert(1)"));
  const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
  assert.equal(sitemap.status, 200);
  assert.match(await sitemap.text(), /<urlset/);
  assert.match(await (await fetch(`${baseUrl}/robots.txt`)).text(), /Sitemap: https:\/\/umniremont\.pro\/sitemap\.xml/);
});

test("SEO shell styles cannot match the React application", () => {
  assert.match(sourceIndexHtml, /<main class="seo-shell">/);
  assert.match(sourceIndexHtml, /#root > \.seo-shell/);
  assert.ok(!sourceIndexHtml.includes("#root > main"));
  assert.ok(!sourceIndexHtml.includes("#root h1"));
  assert.ok(!sourceIndexHtml.includes("#root a"));
});

test("consent is enforced and accepted data is serialized safely", async () => {
  const headers = { "content-type": "application/json" };
  const rejectedLead = await fetch(`${baseUrl}/api/leads/submit`, { method: "POST", headers, body: JSON.stringify({ name: "Тест", phone: "+79153261910", propertyType: "apartment" }) });
  assert.equal(rejectedLead.status, 400);
  const acceptedLead = await fetch(`${baseUrl}/api/leads/submit`, { method: "POST", headers, body: JSON.stringify({ name: "Тест", phone: "+79153261910", propertyType: "apartment", personalDataConsent: true, consentVersion: "2026-08-26" }) });
  assert.equal(acceptedLead.status, 201);
  const adminHeaders = { "x-reviews-admin-password": "test-password" };
  const storedLeads = await (await fetch(`${baseUrl}/api/leads`, { headers: adminHeaders })).json();
  assert.equal(storedLeads.leads[0].consentVersion, "2026-08-26");
  assert.match(storedLeads.leads[0].consentAt, /^\d{4}-\d{2}-\d{2}T/);
  const rejectedReview = await fetch(`${baseUrl}/api/reviews/submit`, { method: "POST", headers, body: JSON.stringify({ name: "Тест", text: "Проверочный отзыв для теста", rating: 5 }) });
  assert.equal(rejectedReview.status, 400);
  const acceptedReview = await fetch(`${baseUrl}/api/reviews/submit`, { method: "POST", headers, body: JSON.stringify({ name: "Тест", city: "Москва", text: "Проверочный отзыв для теста", rating: 5, publicationConsent: true, consentVersion: "2026-08-26" }) });
  assert.equal(acceptedReview.status, 201);
  const pending = await (await fetch(`${baseUrl}/api/reviews?scope=admin`, { headers: adminHeaders })).json();
  assert.equal(pending.reviews.length, 1);
  assert.equal(pending.reviews[0].publicationConsentVersion, "2026-08-26");
  assert.match(pending.reviews[0].publicationConsentAt, /^\d{4}-\d{2}-\d{2}T/);
  const moderation = await fetch(`${baseUrl}/api/reviews/moderate`, { method: "POST", headers: { ...headers, ...adminHeaders }, body: JSON.stringify({ id: pending.reviews[0].id, action: "approve" }) });
  assert.equal(moderation.status, 200);
  const publicReviews = await (await fetch(`${baseUrl}/api/reviews`)).json();
  assert.equal(publicReviews.reviews.length, 1);
  assert.equal("counts" in publicReviews, false);
  assert.deepEqual(Object.keys(publicReviews.reviews[0]).sort(), ["approvedAt", "city", "createdAt", "id", "name", "rating", "text"]);
});

test("malformed JSON and disallowed CORS origins get explicit client errors", async () => {
  const malformed = await fetch(`${baseUrl}/api/leads/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);

  const denied = await fetch(`${baseUrl}/api/reviews`, {
    headers: { origin: "https://example.invalid" },
  });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("access-control-allow-origin"), null);

  const sameOrigin = await fetch(`${baseUrl}/api/reviews`, {
    headers: { origin: baseUrl },
  });
  assert.equal(sameOrigin.status, 200);
  assert.equal(sameOrigin.headers.get("access-control-allow-origin"), baseUrl);
});

test("legacy database receives additive consent columns", () => {
  const database = new Database(path.join(dbPath, "database.sqlite"), { readonly: true });
  const leadColumns = database.prepare("PRAGMA table_info(leads)").all().map((column) => column.name);
  const reviewColumns = database.prepare("PRAGMA table_info(reviews)").all().map((column) => column.name);
  database.close();
  assert.ok(leadColumns.includes("consentVersion") && leadColumns.includes("consentAt"));
  assert.ok(reviewColumns.includes("publicationConsentVersion") && reviewColumns.includes("publicationConsentAt"));
});
