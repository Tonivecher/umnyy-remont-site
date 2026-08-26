import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { telegramLinks } from "../utils/telegramLinks";
import { MessengerLinks } from "./MessengerLinks";

gsap.registerPlugin(ScrollTrigger);

export const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const fadingElements = contentRef.current?.querySelectorAll("[data-hero-fade]") ?? [];

      gsap.from(fadingElements, {
        y: isMobileViewport ? 28 : 100,
        opacity: 0,
        duration: isMobileViewport ? 1 : 2,
        stagger: isMobileViewport ? 0.12 : 0.2,
        ease: "power4.out",
        delay: isMobileViewport ? 0.35 : 0.8,
      });

      if (isMobileViewport) return;

      gsap.to(bgRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      gsap.to(contentRef.current, {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div ref={bgRef} className="absolute inset-0 z-0 scale-110">
        <img
          src="/images/hero-interior.jpg"
          alt="Интерьер квартиры с современной отделкой"
          className="w-full h-full object-cover"
          width={1920}
          height={1440}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />

        <div className="hero-overlay"></div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-brand-dark"></div>
      </div>

      {/* Hero Content */}
      <div ref={contentRef} className="hero-readable-panel relative z-10 w-full px-5 text-center">
        <h1
          data-split-heading
          className="hero-brand-title mx-auto mb-6 max-w-[11ch] text-[3.6rem] leading-[0.96] sm:max-w-none sm:text-7xl md:max-w-[13ch] md:text-[clamp(5.5rem,8.8vw,8.75rem)] md:leading-[0.94]"
          style={{
            fontFamily: '"Nunito", "Manrope", ui-sans-serif, system-ui, sans-serif',
            letterSpacing: "0.018em",
          }}
        >
          Умный Ремонт
        </h1>
        <p
          data-hero-fade
          className="hero-support-text mobile-kicker mx-auto max-w-[28ch] text-[0.68rem] font-medium uppercase leading-loose md:max-w-none md:text-sm md:tracking-[0.5em]"
        >
          Премиальная реализация интерьеров
        </p>
        <div
          data-hero-fade
          className="mx-auto mt-9 flex w-full max-w-[20rem] flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center"
        >
          <a
            href="#contact"
            className="premium-action btn-glass btn-glass-gold relative inline-flex items-center justify-center px-7 py-4 text-[10px] font-semibold uppercase sm:px-10 sm:py-5"
          >
            <span className="mobile-action-text relative z-10 md:tracking-[0.28em]">
              Обсудить ремонт
            </span>
          </a>
          <a
            href={telegramLinks.channel}
            target="_blank"
            rel="noreferrer"
            className="premium-action btn-glass hero-support-text inline-flex items-center justify-center px-7 py-4 text-[10px] uppercase sm:px-10 sm:py-5"
          >
            <span className="mobile-action-text md:tracking-[0.28em]">Канал с советами</span>
          </a>
        </div>

        <div
          data-hero-fade
          className="mx-auto mt-5 flex w-full max-w-[20rem] flex-col items-center gap-3 sm:max-w-none"
        >
          <span className="hero-support-text text-[9px] font-semibold uppercase tracking-[0.22em]">
            Написать напрямую
          </span>
          <MessengerLinks tone="dark" showLabels={false} />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4">
        <span className="text-[9px] uppercase tracking-[0.3em] opacity-60">Листайте</span>
        <div className="w-px h-12 bg-white/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white origin-top animate-scroll-line"></div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scroll-line {
          0% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          50.1% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }
        .animate-scroll-line {
          animation: scroll-line 2s cubic-bezier(0.76, 0, 0.24, 1) infinite;
        }
      `,
        }}
      />
    </section>
  );
};
