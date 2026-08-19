import React, { useEffect, useState } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { formatReviewDate } from "@/utils/reviews";

type LeadStatus = "new" | "handled";

type Lead = {
  id: string;
  name: string;
  phone: string;
  propertyType: "apartment" | "house" | "office";
  area: string;
  budget: string;
  timeline: string;
  comment: string;
  status: LeadStatus;
  createdAt: string;
};

const propertyLabels: Record<Lead["propertyType"], string> = {
  apartment: "Квартира",
  house: "Дом",
  office: "Офис",
};

const statusLabels: Record<LeadStatus, string> = {
  new: "Новая",
  handled: "Обработана",
};

const filters: { value: LeadStatus | "all"; label: string }[] = [
  { value: "new", label: "Новые" },
  { value: "handled", label: "Обработанные" },
  { value: "all", label: "Все" },
];

export const LeadsModerationList: React.FC<{ password: string }> = ({ password }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Record<LeadStatus, number>>({ new: 0, handled: 0 });
  const [filter, setFilter] = useState<LeadStatus | "all">("new");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async (nextFilter = filter) => {
    if (!password) return;
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (nextFilter !== "all") params.set("status", nextFilter);
      const response = await fetch(`/api/leads?${params.toString()}`, {
        headers: { "x-reviews-admin-password": password },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Не удалось загрузить заявки.");
      setLeads(payload.leads || []);
      setCounts(payload.counts || { new: 0, handled: 0 });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заявки.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load(filter);
  }, [filter, password]);

  const act = async (id: string, action: LeadStatus | "delete") => {
    setActionId(id);
    setError("");
    try {
      const response = await fetch("/api/leads/update", {
        method: "POST",
        headers: { "content-type": "application/json", "x-reviews-admin-password": password },
        body: JSON.stringify({ id, action }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Не удалось обновить заявку.");
      await load(filter);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Не удалось обновить заявку.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <div className="mt-8 flex flex-wrap gap-3">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`premium-action min-h-11 rounded-full border px-5 py-3 text-[10px] uppercase tracking-[0.25em] transition-colors ${
              filter === item.value
                ? "border-brand-accent bg-brand-accent text-brand-dark"
                : "border-white/10 text-white/70 hover:border-white/25 hover:text-white"
            }`}
          >
            {item.label}
            {item.value !== "all" ? ` (${counts[item.value] || 0})` : ""}
          </button>
        ))}
      </div>

      {error ? <p className="mt-5 text-sm text-red-200/80">{error}</p> : null}

      <div className="mt-8 space-y-5">
        {isLoading && leads.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/8 p-6 text-sm opacity-50">
            Загрузка...
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/8 p-6 text-sm opacity-50">
            Заявок для выбранного фильтра пока нет.
          </div>
        ) : (
          leads.map((lead) => (
            <article key={lead.id} className="rounded-[1.75rem] border border-white/8 p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.25em] opacity-55">
                    <span>{statusLabels[lead.status]}</span>
                    <span className="num-tabular">{formatReviewDate(lead.createdAt)}</span>
                    <span>{propertyLabels[lead.propertyType]}</span>
                  </div>

                  <div>
                    <h4 className="text-xl font-display">{lead.name}</h4>
                    <a
                      href={`tel:${lead.phone}`}
                      className="num-tabular mt-2 inline-flex min-h-11 items-center text-sm opacity-80 hover:opacity-100"
                    >
                      {lead.phone}
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.2em] opacity-50">
                    {lead.area ? <span className="num-tabular">{lead.area} м²</span> : null}
                    {lead.budget ? <span>{lead.budget}</span> : null}
                    {lead.timeline ? <span>{lead.timeline}</span> : null}
                  </div>

                  {lead.comment ? (
                    <p className="max-w-2xl text-sm leading-relaxed opacity-70">{lead.comment}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3">
                  {lead.status === "new" ? (
                    <button
                      type="button"
                      disabled={actionId === lead.id}
                      onClick={() => act(lead.id, "handled")}
                      className="premium-action inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[10px] uppercase tracking-[0.25em] hover:border-white/40 disabled:opacity-50"
                    >
                      <Check size={14} /> Обработана
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionId === lead.id}
                      onClick={() => act(lead.id, "new")}
                      className="premium-action inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[10px] uppercase tracking-[0.25em] hover:border-white/40 disabled:opacity-50"
                    >
                      <RotateCcw size={14} /> В новые
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={actionId === lead.id}
                    onClick={() => act(lead.id, "delete")}
                    className="premium-action inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] opacity-60 hover:opacity-100 disabled:opacity-40"
                  >
                    <Trash2 size={14} /> Удалить
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};
