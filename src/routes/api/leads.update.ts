import { createFileRoute } from "@tanstack/react-router";
import { checkAdmin } from "@/lib/reviews-store";
import {
  countLeadStatuses,
  deleteLeadById,
  getLeadById,
  updateLeadStatus,
} from "@/lib/leads-store";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

export const Route = createFileRoute("/api/leads/update")({
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

        const { id, action } = body;
        if (!id || !action) {
          return json({ success: false, error: "Нужны id заявки и действие." }, 400);
        }
        if (!getLeadById(id)) {
          return json({ success: false, error: "Заявка не найдена." }, 404);
        }

        if (action === "delete") {
          deleteLeadById(id);
          return json({ success: true, deleted: true, counts: countLeadStatuses() });
        }

        if (action !== "new" && action !== "handled") {
          return json({ success: false, error: "Некорректное действие." }, 400);
        }

        return json({
          success: true,
          lead: updateLeadStatus(id, action),
          counts: countLeadStatuses(),
        });
      },
    },
  },
});
