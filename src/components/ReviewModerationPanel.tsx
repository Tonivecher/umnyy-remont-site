import React, { useEffect, useState } from "react";
import { Check, Clock3, EyeOff, Shield, Trash2, X } from "lucide-react";
import { formatReviewDate, ReviewStatus, StoredReview } from "@/utils/reviews";
import { LeadsModerationList } from "./LeadsModerationList";

type ReviewFilter = ReviewStatus | "all";

type ModerationCounts = Record<ReviewStatus, number>;

type ReviewModerationPanelProps = {
  onReviewsUpdated: () => Promise<void>;
};

const filterLabels: Record<ReviewFilter, string> = {
  pending: "На модерации",
  approved: "Опубликованные",
  rejected: "Отклоненные",
  all: "Все",
};

const statusLabels: Record<ReviewStatus, string> = {
  pending: "Ожидает проверки",
  approved: "Опубликован",
  rejected: "Отклонен",
};

const filterOrder: ReviewFilter[] = ["pending", "approved", "rejected", "all"];

const emptyCounts: ModerationCounts = {
  pending: 0,
  approved: 0,
  rejected: 0,
};

export const ReviewModerationPanel: React.FC<ReviewModerationPanelProps> = ({
  onReviewsUpdated,
}) => {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [counts, setCounts] = useState<ModerationCounts>(emptyCounts);
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>("pending");
  const [actionReviewId, setActionReviewId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"reviews" | "leads">("reviews");

  const loadReviews = async (rawPassword = password, filter = activeFilter) => {
    if (!rawPassword) return;

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ scope: "admin" });
      if (filter !== "all") params.set("status", filter);

      const response = await fetch(`/api/reviews?${params.toString()}`, {
        headers: {
          "x-reviews-admin-password": rawPassword,
        },
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Не удалось загрузить отзывы для модерации.");
      }

      setReviews(payload.reviews || []);
      setCounts(payload.counts || emptyCounts);
      setIsUnlocked(true);
      sessionStorage.setItem("reviews_admin_password", rawPassword);
    } catch (loadError) {
      setIsUnlocked(false);
      setReviews([]);
      setCounts(emptyCounts);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить отзывы для модерации.",
      );
      sessionStorage.removeItem("reviews_admin_password");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("reviews_admin_password");
    if (!savedPassword) return;

    setPassword(savedPassword);
    void loadReviews(savedPassword, activeFilter);
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;
    void loadReviews(password, activeFilter);
  }, [activeFilter]);

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadReviews(password, activeFilter);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("reviews_admin_password");
    setIsUnlocked(false);
    setPassword("");
    setReviews([]);
    setCounts(emptyCounts);
    setError("");
  };

  const handleAction = async (
    reviewId: string,
    action: "approve" | "reject" | "pending" | "delete",
  ) => {
    setActionReviewId(reviewId);
    setError("");

    try {
      const response = await fetch("/api/reviews/moderate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-reviews-admin-password": password,
        },
        body: JSON.stringify({ id: reviewId, action }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Не удалось обновить статус отзыва.");
      }

      await loadReviews(password, activeFilter);
      await onReviewsUpdated();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Не удалось обновить статус отзыва.",
      );
    } finally {
      setActionReviewId(null);
    }
  };

  return (
    <div className="mb-16 rounded-[2rem] border border-white/10 bg-[#151515] p-8 md:p-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] opacity-40 block mb-3">
            Скрытый режим
          </span>
          <h3 className="text-2xl md:text-3xl font-display flex items-center gap-3">
            <Shield size={20} className="text-brand-accent" />
            Модерация отзывов и заявок
          </h3>
          <p className="text-sm opacity-60 mt-4 max-w-2xl leading-relaxed">
            Все новые отзывы сначала попадают в очередь. Публично видны только отзывы со статусом
            «Опубликован».
          </p>
        </div>

        {isUnlocked ? (
          <button
            type="button"
            onClick={handleLogout}
            className="text-[10px] uppercase tracking-[0.3em] opacity-60 hover:opacity-100 transition-opacity"
          >
            Выйти из модерации
          </button>
        ) : null}
      </div>

      {!isUnlocked ? (
        <form onSubmit={handleUnlock} className="mt-8 flex flex-col md:flex-row gap-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="flex-1 rounded-full bg-white/[0.04] border border-white/15 px-6 py-4 outline-none focus:border-white/40 transition-colors"
            placeholder="Пароль модератора"
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={isLoading || !password}
            className="px-6 py-4 bg-white text-brand-dark text-[10px] uppercase tracking-[0.3em] disabled:opacity-50"
          >
            {isLoading ? "Проверка..." : "Открыть"}
          </button>
        </form>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-2 rounded-full border border-white/10 p-1.5 w-fit">
            {(
              [
                ["reviews", "Отзывы"],
                ["leads", "Заявки"],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`premium-action min-h-11 rounded-full px-6 py-3 text-[10px] uppercase tracking-[0.25em] transition-colors ${
                  activeTab === tab ? "bg-white text-brand-dark" : "text-white/60 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "leads" ? (
            <LeadsModerationList password={password} />
          ) : (
            <>
              <div className="mt-8 flex flex-wrap gap-3">
                {filterOrder.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`premium-action min-h-11 rounded-full px-5 py-3 border text-[10px] uppercase tracking-[0.25em] transition-colors ${
                      activeFilter === filter
                        ? "border-brand-accent bg-brand-accent text-brand-dark"
                        : "border-white/10 text-white/70 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {filterLabels[filter]}
                    {filter !== "all" ? ` (${counts[filter] || 0})` : ""}
                  </button>
                ))}
              </div>

              <div className="mt-8 space-y-5">
                {reviews.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-white/8 p-6 text-sm opacity-50">
                    Для выбранного фильтра отзывов пока нет.
                  </div>
                ) : (
                  reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-[1.75rem] border border-white/8 p-6 md:p-8"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.25em] opacity-55">
                            <span>{statusLabels[review.status]}</span>
                            <span>{formatReviewDate(review.createdAt)}</span>
                            <span>{review.city || "Без города"}</span>
                          </div>

                          <div>
                            <h4 className="text-xl font-display">{review.name}</h4>
                            <div className="text-[10px] uppercase tracking-[0.25em] opacity-40 mt-2">
                              Оценка: {review.rating}/5
                            </div>
                          </div>

                          <p className="text-base md:text-lg leading-relaxed opacity-85 max-w-3xl">
                            {review.text}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3 md:max-w-[280px]">
                          {review.status !== "approved" ? (
                            <button
                              type="button"
                              onClick={() => handleAction(review.id, "approve")}
                              disabled={actionReviewId === review.id}
                              className="px-4 py-3 bg-white text-brand-dark text-[10px] uppercase tracking-[0.25em] disabled:opacity-50"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Check size={14} />
                                Опубликовать
                              </span>
                            </button>
                          ) : null}

                          {review.status !== "pending" ? (
                            <button
                              type="button"
                              onClick={() => handleAction(review.id, "pending")}
                              disabled={actionReviewId === review.id}
                              className="premium-action btn-glass min-h-11 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/85 hover:text-white disabled:opacity-50"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Clock3 size={14} />
                                Вернуть в очередь
                              </span>
                            </button>
                          ) : null}

                          {review.status !== "rejected" ? (
                            <button
                              type="button"
                              onClick={() => handleAction(review.id, "reject")}
                              disabled={actionReviewId === review.id}
                              className="premium-action btn-glass min-h-11 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/85 hover:text-white disabled:opacity-50"
                            >
                              <span className="inline-flex items-center gap-2">
                                <EyeOff size={14} />
                                Отклонить
                              </span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleAction(review.id, "delete")}
                            disabled={actionReviewId === review.id}
                            className="premium-action btn-glass min-h-11 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-red-100/80 hover:text-red-100 disabled:opacity-50"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Trash2 size={14} />
                              Удалить
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}

      {error ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-red-200/80">
          <X size={16} />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
};
