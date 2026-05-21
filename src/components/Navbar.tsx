import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { telegramLinks } from '../utils/telegramLinks';

const navLinks = [
  { href: '#portfolio', label: 'Работы' },
  { href: '#about', label: 'О нас' },
  { href: '#testimonials', label: 'Отзывы' },
  { href: '#contact', label: 'Контакты' },
];

export const Navbar: React.FC = () => {
  const navRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
        delay: 0.5,
      });
    });
    return () => ctx.revert();
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 text-white"
        aria-label="Main Navigation"
      >
        {/* Backdrop blur bar */}
        <div className="absolute inset-0 nav-readable pointer-events-none" />

        <a href="#" className="relative block shrink-0" onClick={closeMenu}>
          <img
            src="/brand/umniremont-logo-white.svg"
            alt="Умный Ремонт"
            className="h-8 w-auto origin-left scale-[1.45] transform-gpu md:h-12 md:scale-[1.35]"
          />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex gap-10 text-[10px] uppercase tracking-[0.3em] font-medium relative items-center">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-readable-link transition-opacity">
              {link.label}
            </a>
          ))}
          <a
            href={telegramLinks.estimateNav}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/25 px-5 py-3 text-white transition hover:border-brand-accent hover:text-brand-accent"
          >
            Расчёт
          </a>
        </div>

        {/* Mobile burger */}
        <button
          className="relative md:hidden flex flex-col justify-center gap-[6px] w-8 h-8"
          aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <motion.span
            className="block h-px bg-white origin-center"
            animate={isOpen ? { rotate: 45, y: 7, width: '100%' } : { rotate: 0, y: 0, width: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.span
            className="block h-px bg-white"
            animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="block h-px bg-white origin-center"
            animate={isOpen ? { rotate: -45, y: -7, width: '100%' } : { rotate: 0, y: 0, width: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-brand-dark flex flex-col justify-center items-center md:hidden"
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              className="absolute right-8 top-4 flex h-8 w-8 flex-col justify-center gap-[6px]"
              aria-label="Закрыть меню"
              onClick={closeMenu}
            >
              <span className="block h-px w-full rotate-45 translate-y-[3.5px] bg-white origin-center" />
              <span className="block h-px w-full -rotate-45 -translate-y-[3.5px] bg-white origin-center" />
            </button>

            <nav className="flex flex-col items-center gap-10">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="text-4xl font-display text-white tracking-tight"
                  onClick={closeMenu}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>

            <motion.a
              href={telegramLinks.estimateMobile}
              target="_blank"
              rel="noreferrer"
              className="mt-12 rounded-full border border-brand-accent px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-accent"
              onClick={closeMenu}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ delay: 0.36, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              Рассчитать ремонт
            </motion.a>

            <motion.div
              className="absolute bottom-12 text-[9px] uppercase tracking-[0.3em] opacity-30 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 0.4 }}
            >
              Умный Ремонт
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
