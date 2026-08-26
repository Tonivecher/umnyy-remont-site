import React, { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import MarqueeImport from "react-fast-marquee";

// react-fast-marquee ships CJS; normalize the interop default in the Vite/SSR runtime.
const Marquee = ((MarqueeImport as unknown as { default?: typeof MarqueeImport }).default ??
  MarqueeImport) as typeof MarqueeImport;
import { ReviewForm } from "./ReviewForm";
import { ReviewModerationPanel } from "./ReviewModerationPanel";
import { formatReviewDate, isReviewsAdminMode, PublicReview } from "@/utils/reviews";

gsap.registerPlugin(ScrollTrigger);

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
  <article className="testimonial-card mx-4 flex h-full w-[min(30rem,calc(100vw-4.5rem))] flex-col justify-between rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-8 md:mx-5 md:w-[34rem] md:p-10 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
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
      <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] opacity-40">
        {testimonial.meta}
      </span>
    </div>
  </article>
);

export const Testimonials: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
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

  const marqueeRows = useMemo(() => {
    const primary = testimonials.filter((_, index) => index % 2 === 0);
    const secondary = testimonials.filter((_, index) => index % 2 !== 0);

    return [primary.length ? primary : testimonials, secondary.length ? secondary : testimonials];
  }, [testimonials]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-testimonials-marquee]");
      if (!rows.length) return;

      gsap.from(rows, {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.14,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [approvedReviews.length, prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="py-32 md:py-64 px-8 md:px-24 bg-brand-dark"
    >
      <div className="mb-24">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-4 block opacity-40">Голоса</span>
        <h2 data-split-heading className="text-5xl md:text-7xl font-display">
          Отзывы
        </h2>
      </div>

      {adminMode ? <ReviewModerationPanel onReviewsUpdated={loadReviews} /> : null}

      <ul className="sr-only">
        {testimonials.map((testimonial) => (
          <li key={`accessible-${testimonial.id}`}>
            {testimonial.author}, {testimonial.meta}. Оценка: {testimonial.rating} из 5. «
            {testimonial.quote}»
          </li>
        ))}
      </ul>

      <div className="mb-32 space-y-5 overflow-hidden" aria-hidden="true">
        {marqueeRows.map((row, index) => (
          <div key={`row-${index}`} data-testimonials-marquee className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-brand-dark to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-brand-dark to-transparent" />

            <Marquee
              autoFill
              play={!prefersReducedMotion}
              pauseOnHover
              gradient={false}
              speed={index === 0 ? 26 : 22}
              direction={index === 0 ? "left" : "right"}
            >
              {row.map((testimonial) => (
                <TestimonialCard key={`${index}-${testimonial.id}`} testimonial={testimonial} />
              ))}
            </Marquee>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto">
        <ReviewForm onReviewSubmitted={loadReviews} />
      </div>
    </section>
  );
};
