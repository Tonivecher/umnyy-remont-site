import { createFileRoute } from "@tanstack/react-router";
import { checkAdmin } from "@/lib/reviews-store";
import { countLeadStatuses, listLeads, type LeadStatus } from "@/lib/leads-store";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

export const Route = createFileRoute("/api/leads")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = checkAdmin(request);
        if (denied) return json({ success: false, error: denied.error }, denied.status);

        const url = new URL(request.url);
        const statusParam = url.searchParams.get("status");
        const status =
          statusParam === "new" || statusParam === "handled"
            ? (statusParam as LeadStatus)
            : undefined;

        return json({
          success: true,
          leads: listLeads(status),
          counts: countLeadStatuses(),
        });
      },
    },
  },
});
