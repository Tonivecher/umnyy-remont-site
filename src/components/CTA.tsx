import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MessengerLinks } from "./MessengerLinks";
import { messengerLinks } from "../utils/messengerLinks";

const contactLinks = {
  phoneHref: messengerLinks.phoneHref,
  phoneLabel: messengerLinks.phoneDisplay,
};

export const CTA: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".cta-content", {
        y: 30,
        opacity: 0,
        duration: 1.5,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="contact"
      className="overflow-hidden bg-brand-light px-6 py-28 text-brand-dark md:px-24 md:py-64"
    >
      <div className="cta-content text-center max-w-4xl mx-auto">
        <span className="mobile-kicker mb-8 block text-[10px] uppercase opacity-60 md:tracking-[0.3em]">
          Начните с понятного расчёта
        </span>
        <h2
          data-split-heading
          className="mb-14 text-4xl font-display leading-[1.02] md:mb-16 md:text-8xl md:leading-none"
        >
          Прикинем бюджет ремонта без давления и строительного тумана.
        </h2>

        <div className="flex flex-col gap-6 justify-center items-center">
          <MessengerLinks
            tone="light"
            layout="stack"
            showLabels
            className="w-full max-w-[21rem] md:max-w-xl md:flex-row"
          />

          <a
            href={contactLinks.phoneHref}
            className="premium-action btn-glass btn-glass-light inline-flex min-h-12 items-center justify-center px-8 py-4 text-[10px] uppercase tracking-[0.18em] md:tracking-[0.3em]"
          >
            {contactLinks.phoneLabel}
          </a>
        </div>
      </div>
    </section>
  );
};
