import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const Navbar: React.FC = () => {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
        delay: 0.5
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <nav 
      ref={navRef}
      className="nav-readable fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-10 mix-blend-difference text-white"
      aria-label="Main Navigation"
    >
      <div className="text-xl font-display tracking-widest uppercase">
        Умный Ремонт
      </div>
      
      <div className="hidden md:flex gap-12 text-[10px] uppercase tracking-[0.3em] font-medium">
        <a href="#portfolio" className="nav-readable-link transition-opacity">Работы</a>
        <a href="#about" className="nav-readable-link transition-opacity">О нас</a>
        <a href="#testimonials" className="nav-readable-link transition-opacity">Отзывы</a>
        <a href="#contact" className="nav-readable-link transition-opacity">Контакты</a>
      </div>

      <button 
        className="md:hidden flex flex-col gap-1.5"
        aria-label="Toggle Menu"
      >
        <span className="w-6 h-px bg-white"></span>
        <span className="w-6 h-px bg-white"></span>
      </button>
    </nav>
  );
};
