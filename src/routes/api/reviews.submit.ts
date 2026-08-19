import { createFileRoute } from "@tanstack/react-router";
import { normalizeField, saveReview, type StoredReview } from "@/lib/reviews-store";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

export const Route = createFileRoute("/api/reviews/submit")({
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

        const name = normalizeField(payload["name"], 80);
        const city = normalizeField(payload["city"], 80);
        const text = normalizeField(payload["text"], 1200);
        const honeypot = normalizeField(payload["company"], 120);
        const rating = Number.parseInt(String(payload["rating"] ?? "5"), 10);

        if (honeypot) {
          return json({ success: true, message: "Спасибо. Отзыв отправлен на модерацию." }, 202);
        }

        if (!name) return json({ success: false, error: "Укажите имя." }, 400);
        if (!text || text.length < 12)
          return json({ success: false, error: "Отзыв должен быть не короче 12 символов." }, 400);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5)
          return json({ success: false, error: "Оценка должна быть от 1 до 5." }, 400);

        const now = new Date().toISOString();
        const review: StoredReview = {
          id: crypto.randomUUID(),
          name,
          city,
          text,
          rating,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        };

        saveReview(review);

        return json(
          {
            success: true,
            message: "Спасибо. Отзыв отправлен на модерацию и появится на сайте после проверки.",
          },
          201,
        );
      },
    },
  },
});
