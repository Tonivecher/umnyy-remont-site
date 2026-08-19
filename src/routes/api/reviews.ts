import { createFileRoute } from "@tanstack/react-router";
import { checkAdmin, countStatuses, listReviews } from "@/lib/reviews-store";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

export const Route = createFileRoute("/api/reviews")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const scope = url.searchParams.get("scope");
        const statusFilter = url.searchParams.get("status");
        const reviews = listReviews();

        if (scope === "admin") {
          const denied = checkAdmin(request);
          if (denied) return json({ success: false, error: denied.error }, denied.status);

          return json({
            success: true,
            reviews: statusFilter
              ? reviews.filter((review) => review.status === statusFilter)
              : reviews,
            counts: countStatuses(),
          });
        }

        return json({
          success: true,
          reviews: reviews
            .filter((review) => review.status === "approved")
            .map(({ id, name, city, text, rating, createdAt, approvedAt }) => ({
              id,
              name,
              city,
              text,
              rating,
              createdAt,
              approvedAt,
            })),
          counts: countStatuses(),
        });
      },
    },
  },
});
