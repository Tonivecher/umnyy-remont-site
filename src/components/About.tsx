import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MagneticButton } from "./MagneticButton";

gsap.registerPlugin(ScrollTrigger);

export const About: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;

    const ctx = gsap.context(() => {
      gsap.from(textRef.current, {
        x: isMobileViewport ? 0 : -50,
        y: isMobileViewport ? 28 : 0,
        opacity: 0,
        duration: 1.5,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });

      gsap.from(imageRef.current, {
        scale: 1.1,
        opacity: 0,
        duration: 2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="grid items-center gap-16 bg-brand-light px-6 py-28 text-brand-dark md:grid-cols-2 md:gap-32 md:px-24 md:py-64"
    >
      <div ref={textRef} className="max-w-xl">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-8 block opacity-60">
          Философия
        </span>
        <h2 data-split-heading className="text-4xl md:text-6xl mb-10 leading-[1.1]">
          Мы не просто строим стены. Мы реализуем архитектурные видения.
        </h2>
        <div className="space-y-6 text-lg leading-relaxed opacity-80 font-light">
          <p>
            Наш подход основан на точности скандинавского дизайна и душе средиземноморского тепла.
            Каждый проект — это диалог между пространством, светом и материальностью.
          </p>
          <div className="pt-8 border-t border-brand-dark/10">
            <p className="text-base font-medium mb-4">
              Команда «Умный Ремонт» выполняет ремонт квартир под ключ в Москве.
            </p>
            <p className="text-sm">
              Мы специализируемся на профессиональной отделке интерьеров, точной геометрии и
              аккуратной работе с материалами.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">• ремонт квартир под ключ</li>
              <li className="flex items-center gap-2">• отделку интерьеров</li>
              <li className="flex items-center gap-2">• комплексный ремонт квартир</li>
            </ul>
            <p className="mt-4 text-sm font-medium">Работаем по Москве и Московской области.</p>
          </div>
        </div>
        <div className="mt-12">
          <MagneticButton>
            <a href="#portfolio" className="premium-action btn-glass btn-glass-light relative inline-flex w-full items-center justify-center px-9 py-4 sm:w-auto">
              <span className="mobile-action-text relative z-10 text-[10px] uppercase md:tracking-[0.2em]">
                Смотреть работы
              </span>
            </a>
          </MagneticButton>
        </div>
      </div>

      <div
        ref={imageRef}
        className="media-outline-light aspect-[4/5] overflow-hidden rounded-[1.75rem]"
      >
        <img
          src="/images/about-architecture.jpg"
          alt="Светлый интерьер с архитектурной композицией"
          className="w-full h-full object-cover"
          width={1200}
          height={801}
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
};
