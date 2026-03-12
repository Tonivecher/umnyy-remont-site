import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const fadingElements = contentRef.current?.querySelectorAll('[data-hero-fade]') ?? [];

      gsap.from(fadingElements, {
        y: 100,
        opacity: 0,
        duration: 2,
        stagger: 0.2,
        ease: 'power4.out',
        delay: 0.8
      });

      // Parallax effect
      gsap.to(bgRef.current, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // Content parallax (slower)
      gsap.to(contentRef.current, {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={heroRef}
      className="relative h-screen w-full overflow-hidden flex items-center justify-center"
    >
      {/* Background Image */}
      <div 
        ref={bgRef}
        className="absolute inset-0 z-0 scale-110"
      >
        <img 
          src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1920&auto=format&fit=crop" 
          alt="Luxury Interior Design"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="hero-overlay"></div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-brand-dark"></div>
      </div>

      {/* Hero Content */}
      <div 
        ref={contentRef}
        className="relative z-10 text-center px-4"
      >
        <h1
          data-split-heading
          className="text-7xl md:text-[12vw] font-display leading-none mb-6 tracking-tighter"
        >
          Умный Ремонт
        </h1>
        <p data-hero-fade className="text-xs md:text-sm uppercase tracking-[0.5em] font-light opacity-80">
          Премиальная реализация интерьеров
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4">
        <span className="text-[9px] uppercase tracking-[0.3em] opacity-40">Листайте</span>
        <div className="w-px h-12 bg-white/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white origin-top animate-scroll-line"></div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scroll-line {
          0% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          50.1% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }
        .animate-scroll-line {
          animation: scroll-line 2s cubic-bezier(0.76, 0, 0.24, 1) infinite;
        }
      `}} />
    </section>
  );
};
