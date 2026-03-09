import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star } from 'lucide-react';
import { ReviewForm, Review } from './ReviewForm';

gsap.registerPlugin(ScrollTrigger);

const staticTestimonials = [
  {
    quote: "Уровень детализации и приверженность первоначальному архитектурному видению превзошли наши ожидания. По-настоящему премиальный опыт.",
    author: "Александр Волков",
    role: "Частный клиент",
    rating: 5
  },
  {
    quote: "Работа с «Умным Ремонтом» — это спокойствие. Они понимают язык роскоши и важность точности.",
    author: "Елена Петрова",
    role: "Архитектурный дизайнер",
    rating: 5
  }
];

export const Testimonials: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  const loadReviews = () => {
    const saved = JSON.parse(localStorage.getItem('user_reviews') || '[]');
    setUserReviews(saved);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.testimonial-card', {
        y: 50,
        opacity: 0,
        duration: 1.5,
        stagger: 0.3,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        }
      });
    });
    return () => ctx.revert();
  }, [userReviews]);

  return (
    <section ref={sectionRef} id="testimonials" className="py-32 md:py-64 px-8 md:px-24 bg-brand-dark">
      <div className="mb-24">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-4 block opacity-40">Голоса</span>
        <h2 className="text-5xl md:text-7xl font-display">Отзывы</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-16 md:gap-32 mb-32">
        {/* User Reviews First */}
        {userReviews.map((t, i) => (
          <div key={`user-${i}`} className="testimonial-card border-l border-white/10 pl-12 py-8">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, idx) => (
                <Star 
                  key={idx} 
                  size={14} 
                  fill={idx < t.rating ? "currentColor" : "none"}
                  className={idx < t.rating ? "text-brand-accent" : "text-white/10"}
                />
              ))}
            </div>
            <p className="text-2xl md:text-3xl font-display italic mb-12 leading-relaxed opacity-90">
              "{t.text}"
            </p>
            <div>
              <span className="block text-sm font-medium tracking-wide">{t.name}</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] opacity-40 mt-1">{t.city} • {t.date}</span>
            </div>
          </div>
        ))}

        {/* Static Testimonials */}
        {staticTestimonials.map((t, i) => (
          <div key={`static-${i}`} className="testimonial-card border-l border-white/10 pl-12 py-8">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, idx) => (
                <Star 
                  key={idx} 
                  size={14} 
                  fill={idx < t.rating ? "currentColor" : "none"}
                  className={idx < t.rating ? "text-brand-accent" : "text-white/10"}
                />
              ))}
            </div>
            <p className="text-2xl md:text-3xl font-display italic mb-12 leading-relaxed opacity-90">
              "{t.quote}"
            </p>
            <div>
              <span className="block text-sm font-medium tracking-wide">{t.author}</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] opacity-40 mt-1">{t.role}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto">
        <ReviewForm onReviewAdded={loadReviews} />
      </div>
    </section>
  );
};
