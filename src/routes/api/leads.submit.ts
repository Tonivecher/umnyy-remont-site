import { createFileRoute } from "@tanstack/react-router";
import {
  isRateLimited,
  normalizePhone,
  normalizeText,
  notifyNewLead,
  propertyTypeLabels,
  saveLead,
  type PropertyType,
  type StoredLead,
} from "@/lib/leads-store";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

export const Route = createFileRoute("/api/leads/submit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Record<string, unknown> | null = null;
        try {
          payload = (await request.json()) as Record<string, unknown>;
        } catch {
          payload = null;
        }

        if (!payload || typeof payload !== "object") {
          return json({ success: false, error: "Некорректное тело запроса." }, 400);
        }

        const honeypot = normalizeText(payload["company"], 120);
        if (honeypot) {
          return json({ success: true, message: "Заявка принята." }, 202);
        }

        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown";

        if (isRateLimited(ip)) {
          return json(
            { success: false, error: "Слишком много заявок подряд. Попробуйте позже." },
            429,
          );
        }

        const name = normalizeText(payload["name"], 80);
        const phone = normalizePhone(payload["phone"]);
        const propertyTypeRaw = normalizeText(payload["propertyType"], 20) as PropertyType;
        const area = normalizeText(payload["area"], 10);
        const budget = normalizeText(payload["budget"], 60);
        const timeline = normalizeText(payload["timeline"], 60);
        const comment = normalizeText(payload["comment"], 1200);

        if (!name || name.length < 2) {
          return json({ success: false, error: "Укажите имя." }, 400);
        }
        if (!phone) {
          return json({ success: false, error: "Укажите корректный телефон." }, 400);
        }
        if (!(propertyTypeRaw in propertyTypeLabels)) {
          return json({ success: false, error: "Выберите тип объекта." }, 400);
        }
        if (area && !/^\d{1,5}$/.test(area)) {
          return json({ success: false, error: "Площадь укажите числом в м²." }, 400);
        }

        const now = new Date().toISOString();
        const lead: StoredLead = {
          id: crypto.randomUUID(),
          name,
          phone,
          propertyType: propertyTypeRaw,
          area,
          budget,
          timeline,
          comment,
          status: "new",
          createdAt: now,
          updatedAt: now,
        };

        saveLead(lead);
        await notifyNewLead(lead);

        return json(
          {
            success: true,
            message: "Спасибо! Заявка принята — свяжемся с вами в ближайшее время.",
          },
          201,
        );
      },
    },
  },
});
