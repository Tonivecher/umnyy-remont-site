import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star } from 'lucide-react';
import { ReviewForm } from './ReviewForm';
import { ReviewModerationPanel } from './ReviewModerationPanel';
import { formatReviewDate, isReviewsAdminMode, PublicReview } from '@/src/utils/reviews';

gsap.registerPlugin(ScrollTrigger);

const staticTestimonials = [
  {
    quote: 'Уровень детализации и приверженность первоначальному архитектурному видению превзошли наши ожидания. По-настоящему премиальный опыт.',
    author: 'Александр Волков',
    role: 'Частный клиент',
    rating: 5,
  },
  {
    quote: 'Работа с «Умным Ремонтом» — это спокойствие. Они понимают язык роскоши и важность точности.',
    author: 'Елена Петрова',
    role: 'Архитектурный дизайнер',
    rating: 5,
  },
];

export const Testimonials: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [approvedReviews, setApprovedReviews] = useState<PublicReview[]>([]);
  const [adminMode, setAdminMode] = useState(false);

  const loadReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) {
        throw new Error('Failed to load reviews');
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.testimonial-card', {
        y: 50,
        opacity: 0,
        duration: 1.5,
        stagger: 0.18,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });
    });
    return () => ctx.revert();
  }, [approvedReviews, adminMode]);

  return (
    <section ref={sectionRef} id="testimonials" className="py-32 md:py-64 px-8 md:px-24 bg-brand-dark">
      <div className="mb-24">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-4 block opacity-40">Голоса</span>
        <h2 className="text-5xl md:text-7xl font-display">Отзывы</h2>
      </div>

      {adminMode ? <ReviewModerationPanel onReviewsUpdated={loadReviews} /> : null}

      <div className="grid md:grid-cols-2 gap-16 md:gap-32 mb-32">
        {approvedReviews.map((review) => (
          <div key={review.id} className="testimonial-card border-l border-white/10 pl-12 py-8">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  size={14}
                  fill={index < review.rating ? 'currentColor' : 'none'}
                  className={index < review.rating ? 'text-brand-accent' : 'text-white/10'}
                />
              ))}
            </div>

            <p className="text-2xl md:text-3xl font-display italic mb-12 leading-relaxed opacity-90">
              "{review.text}"
            </p>

            <div>
              <span className="block text-sm font-medium tracking-wide">{review.name}</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] opacity-40 mt-1">
                {review.city || 'Без города'} • {formatReviewDate(review.approvedAt || review.createdAt)}
              </span>
            </div>
          </div>
        ))}

        {staticTestimonials.map((testimonial, index) => (
          <div key={`static-${index}`} className="testimonial-card border-l border-white/10 pl-12 py-8">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, starIndex) => (
                <Star
                  key={starIndex}
                  size={14}
                  fill={starIndex < testimonial.rating ? 'currentColor' : 'none'}
                  className={starIndex < testimonial.rating ? 'text-brand-accent' : 'text-white/10'}
                />
              ))}
            </div>
            <p className="text-2xl md:text-3xl font-display italic mb-12 leading-relaxed opacity-90">
              "{testimonial.quote}"
            </p>
            <div>
              <span className="block text-sm font-medium tracking-wide">{testimonial.author}</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] opacity-40 mt-1">{testimonial.role}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto">
        <ReviewForm onReviewSubmitted={loadReviews} />
      </div>
    </section>
  );
};
