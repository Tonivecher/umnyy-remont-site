import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MagneticButton } from './MagneticButton';

export const CTA: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cta-content', {
        y: 30,
        opacity: 0,
        duration: 1.5,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        }
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      id="contact"
      className="py-32 md:py-64 px-8 md:px-24 bg-brand-light text-brand-dark overflow-hidden"
    >
      <div className="cta-content text-center max-w-4xl mx-auto">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-8 block opacity-60">Начните свой путь</span>
        <h2 className="text-5xl md:text-8xl font-display mb-16 leading-none">
          Давайте реализуем ваше видение вместе.
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          <MagneticButton>
            <button className="group relative py-6 px-12 bg-brand-dark text-white overflow-hidden">
              <span className="relative z-10 text-[10px] uppercase tracking-[0.3em]">Обсудить проект</span>
              <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-expo"></div>
            </button>
          </MagneticButton>
          
          <a 
            href="tel:+79991234567" 
            className="text-[10px] uppercase tracking-[0.3em] border-b border-brand-dark/20 pb-2 hover:border-brand-dark transition-colors"
          >
            +7 (999) 123-45-67
          </a>
        </div>
      </div>
    </section>
  );
};
