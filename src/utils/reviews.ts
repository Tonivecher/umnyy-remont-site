export type ReviewStatus = "pending" | "approved" | "rejected";

export type PublicReview = {
  id: string;
  name: string;
  city: string;
  text: string;
  rating: number;
  createdAt: string;
  approvedAt?: string;
};

export type StoredReview = PublicReview & {
  status: ReviewStatus;
  updatedAt: string;
  rejectedAt?: string;
};

export const formatReviewDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const isReviewsAdminMode = () => {
  if (typeof window === "undefined") return false;

  return new URLSearchParams(window.location.search).get("admin") === "reviews";
};
