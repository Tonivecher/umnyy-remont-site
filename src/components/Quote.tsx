import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Quote: React.FC = () => {
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(textRef.current, {
        y: 50,
        opacity: 0,
        duration: 2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: textRef.current,
          start: 'top 80%',
        }
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="py-32 md:py-64 px-8 md:px-24 flex items-center justify-center text-center bg-brand-light text-brand-dark">
      <h2 
        ref={textRef}
        data-split-heading
        className="text-4xl md:text-7xl font-display italic leading-tight max-w-5xl"
      >
        "Архитектура — это мастерская, правильная и великолепная игра форм, объединенных светом."
      </h2>
    </section>
  );
};
