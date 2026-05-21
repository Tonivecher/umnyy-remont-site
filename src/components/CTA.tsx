import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MagneticButton } from './MagneticButton';
import { telegramLinks } from '../utils/telegramLinks';

const contactLinks = {
  phoneHref: 'tel:+79991234567',
  phoneLabel: '+7 (999) 123-45-67',
  whatsappHref: 'https://wa.me/79990000000',
  telegramHref: telegramLinks.measureContact,
};

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
        <span className="text-[10px] uppercase tracking-[0.3em] mb-8 block opacity-60">Начните с понятного расчёта</span>
        <h2 data-split-heading className="text-5xl md:text-8xl font-display mb-16 leading-none">
          Прикинем бюджет ремонта без давления и строительного тумана.
        </h2>
        
        <div className="flex flex-col gap-6 justify-center items-center">
          <div className="flex flex-col md:flex-row gap-5 justify-center items-center">
            <MagneticButton>
              <a
                href={contactLinks.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex items-center justify-center py-6 px-12 bg-brand-dark text-white overflow-hidden"
                aria-label="Написать в WhatsApp"
              >
                <span className="relative z-10 text-[10px] uppercase tracking-[0.3em]">WhatsApp</span>
                <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-expo"></div>
              </a>
            </MagneticButton>

            <MagneticButton>
              <a
                href={contactLinks.telegramHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center py-6 px-12 border border-brand-dark/15 text-[10px] uppercase tracking-[0.3em] hover:border-brand-dark transition-colors"
                aria-label="Написать в Telegram"
              >
                Рассчитать в Telegram
              </a>
            </MagneticButton>
          </div>

          <a 
            href={contactLinks.phoneHref}
            className="text-[10px] uppercase tracking-[0.3em] border-b border-brand-dark/20 pb-2 hover:border-brand-dark transition-colors"
          >
            {contactLinks.phoneLabel}
          </a>
        </div>
      </div>
    </section>
  );
};
