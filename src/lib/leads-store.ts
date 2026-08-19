// Preview-compatible in-memory store for renovation lead requests.
// Mirrors the contract of the reviews store so it can later be swapped for a
// persistent database without touching the frontend.

export type LeadStatus = "new" | "handled";

export type PropertyType = "apartment" | "house" | "office";

export type StoredLead = {
  id: string;
  name: string;
  phone: string;
  propertyType: PropertyType;
  area: string;
  budget: string;
  timeline: string;
  comment: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: "Квартира",
  house: "Дом",
  office: "Офис",
};

export const budgetOptions = [
  "до 1 млн ₽",
  "1–3 млн ₽",
  "3–6 млн ₽",
  "более 6 млн ₽",
  "нужен расчёт",
] as const;

export const timelineOptions = [
  "как можно скорее",
  "в течение 1–3 месяцев",
  "во втором полугодии",
  "пока планирую",
] as const;

const globalStore = globalThis as unknown as {
  __umniLeads?: StoredLead[];
  __umniLeadHits?: Map<string, number[]>;
};

if (!globalStore.__umniLeads) globalStore.__umniLeads = [];
if (!globalStore.__umniLeadHits) globalStore.__umniLeadHits = new Map();

const leads = () => globalStore.__umniLeads!;

export const listLeads = (status?: LeadStatus) =>
  [...leads()]
    .filter((lead) => (status ? lead.status === status : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export const saveLead = (lead: StoredLead) => {
  leads().unshift(lead);
  return lead;
};

export const getLeadById = (id: string) => leads().find((lead) => lead.id === id);

export const deleteLeadById = (id: string) => {
  const index = leads().findIndex((lead) => lead.id === id);
  if (index >= 0) leads().splice(index, 1);
};

export const updateLeadStatus = (id: string, status: LeadStatus) => {
  const lead = getLeadById(id);
  if (!lead) return undefined;
  lead.status = status;
  lead.updatedAt = new Date().toISOString();
  return lead;
};

export const countLeadStatuses = () =>
  leads().reduce(
    (acc, lead) => {
      acc[lead.status] += 1;
      return acc;
    },
    { new: 0, handled: 0 } as Record<LeadStatus, number>,
  );

// Simple in-memory rate limit: max 5 submissions per IP per 10 minutes.
export const isRateLimited = (key: string) => {
  const hits = globalStore.__umniLeadHits!;
  const now = Date.now();
  const window = 10 * 60 * 1000;
  const recent = (hits.get(key) || []).filter((time) => now - time < window);

  if (recent.length >= 5) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);
  return false;
};

export const normalizeText = (value: unknown, maxLength: number) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

export const normalizePhone = (value: unknown) => {
  const raw = String(value ?? "")
    .trim()
    .slice(0, 32);
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length < 10 || digits.length > 15) return "";
  return raw.startsWith("+") ? `+${digits}` : digits.length === 11 ? `+${digits}` : digits;
};

// Notification hook. External channels (Telegram / email) are intentionally not
// wired yet — plug the transport in here without touching the route handler.
export const notifyNewLead = async (_lead: StoredLead) => {
  return;
};
