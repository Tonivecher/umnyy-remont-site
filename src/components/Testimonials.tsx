import React, { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { ReviewForm } from "./ReviewForm";
import { ReviewModerationPanel } from "./ReviewModerationPanel";
import { formatReviewDate, isReviewsAdminMode, PublicReview } from "@/utils/reviews";

type DisplayTestimonial = {
  id: string;
  quote: string;
  author: string;
  meta: string;
  rating: number;
};

const staticTestimonials: DisplayTestimonial[] = [
  {
    id: "static-alexander-volkov",
    quote:
      "Уровень детализации и приверженность первоначальному архитектурному видению превзошли наши ожидания. По-настоящему премиальный опыт.",
    author: "Александр Волков",
    meta: "Частный клиент",
    rating: 5,
  },
  {
    id: "static-elena-petrova",
    quote:
      "Работа с «Умным Ремонтом» — это спокойствие. Они понимают язык роскоши и важность точности.",
    author: "Елена Петрова",
    meta: "Архитектурный дизайнер",
    rating: 5,
  },
];

const TestimonialCard: React.FC<{ testimonial: DisplayTestimonial }> = ({ testimonial }) => (
  <article className="testimonial-card flex h-full flex-col justify-between rounded-[1.75rem] border border-white/10 bg-[#151515] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.18)] md:p-10">
    <div>
      <div className="mb-6 flex gap-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            size={14}
            fill={index < testimonial.rating ? "currentColor" : "none"}
            className={index < testimonial.rating ? "text-brand-accent" : "text-white/10"}
          />
        ))}
      </div>

      <p className="text-xl leading-relaxed font-display italic opacity-90 md:text-2xl">
        "{testimonial.quote}"
      </p>
    </div>

    <div className="mt-10 border-t border-white/8 pt-6">
      <span className="block text-sm font-medium tracking-wide">{testimonial.author}</span>
      <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] opacity-60">
        {testimonial.meta}
      </span>
    </div>
  </article>
);

export const Testimonials: React.FC = () => {
  const [approvedReviews, setApprovedReviews] = useState<PublicReview[]>([]);
  const [adminMode, setAdminMode] = useState(false);

  const loadReviews = async () => {
    try {
      const response = await fetch("/api/reviews");
      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }

      const payload = await response.json();
      setApprovedReviews(payload.reviews || []);
    } catch {
      setApprovedReviews([]);
    }
  };

  useEffect(() => {
    setAdminMode(isReviewsAdminMode());
    void loadReviews();
  }, []);

  const testimonials = useMemo<DisplayTestimonial[]>(
    () => [
      ...approvedReviews.map((review) => ({
        id: review.id,
        quote: review.text,
        author: review.name,
        meta: `${review.city || "Без города"} • ${formatReviewDate(review.approvedAt || review.createdAt)}`,
        rating: review.rating,
      })),
      ...staticTestimonials,
    ],
    [approvedReviews],
  );

  return (
    <section
      id="testimonials"
      className="py-32 md:py-64 px-8 md:px-24 bg-brand-dark"
    >
      <div className="mb-24">
        <span className="mb-4 block text-[10px] uppercase tracking-[0.3em] opacity-60">Голоса</span>
        <h2 data-split-heading className="text-5xl md:text-7xl font-display">
          Отзывы
        </h2>
      </div>

      {adminMode ? <ReviewModerationPanel onReviewsUpdated={loadReviews} /> : null}

      <div className="mb-32 grid gap-5 lg:grid-cols-2">
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>

      <div className="max-w-3xl mx-auto">
        <ReviewForm onReviewSubmitted={loadReviews} />
      </div>
    </section>
  );
};
