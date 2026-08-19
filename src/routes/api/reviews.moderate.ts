import { createFileRoute } from "@tanstack/react-router";
import {
  checkAdmin,
  countStatuses,
  deleteReviewById,
  getReviewById,
  updateReviewStatus,
  type ReviewStatus,
} from "@/lib/reviews-store";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

export const Route = createFileRoute("/api/reviews/moderate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = checkAdmin(request);
        if (denied) return json({ success: false, error: denied.error }, denied.status);

        let body: { id?: string; action?: string } = {};
        try {
          body = (await request.json()) as { id?: string; action?: string };
        } catch {
          body = {};
        }

        const { id: reviewId, action } = body;
        if (!reviewId || !action) {
          return json({ success: false, error: "Нужны id отзыва и действие." }, 400);
        }

        if (!getReviewById(reviewId)) {
          return json({ success: false, error: "Отзыв не найден." }, 404);
        }

        if (action === "delete") {
          deleteReviewById(reviewId);
          return json({ success: true, deleted: true, counts: countStatuses() });
        }

        const actionToStatus: Record<string, ReviewStatus> = {
          approve: "approved",
          reject: "rejected",
          pending: "pending",
        };
        const nextStatus = actionToStatus[action];
        if (!nextStatus) {
          return json({ success: false, error: "Некорректное действие модерации." }, 400);
        }

        return json({
          success: true,
          review: updateReviewStatus(reviewId, nextStatus),
          counts: countStatuses(),
        });
      },
    },
  },
});
