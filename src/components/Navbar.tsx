import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const navLinks = [
  { href: "#portfolio", label: "Работы" },
  { href: "#about", label: "О нас" },
  { href: "#testimonials", label: "Отзывы" },
  { href: "#contact", label: "Контакты" },
];

export const Navbar: React.FC = () => {
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const hasOpenedMenuRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -100,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        delay: 0.5,
      });
    });
    return () => ctx.revert();
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (isOpen) {
      hasOpenedMenuRef.current = true;
      firstMobileLinkRef.current?.focus();
    } else if (hasOpenedMenuRef.current) {
      menuButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (!isOpen || event.key !== "Tab") return;

      const overlayLinks = Array.from(
        menuOverlayRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [],
      );
      const focusable = overlayLinks.filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;

      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? focusable.length - 1
          : currentIndex - 1
        : currentIndex < 0 || currentIndex === focusable.length - 1
          ? 0
          : currentIndex + 1;
      event.preventDefault();
      focusable[nextIndex]?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const desktopViewport = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktopViewport.matches) setIsOpen(false);
    };
    closeOnDesktop();
    desktopViewport.addEventListener("change", closeOnDesktop);
    return () => desktopViewport.removeEventListener("change", closeOnDesktop);
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 text-white"
        aria-label="Основная навигация"
      >
        {/* Backdrop blur bar */}
        <div className="absolute inset-0 nav-readable pointer-events-none" />

        <a href="/" className="relative inline-flex min-h-11 min-w-11 shrink-0 items-center" aria-label="На главную страницу Умный Ремонт" onClick={closeMenu}>
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
            href="#contact"
            className="premium-action btn-glass inline-flex min-h-11 items-center justify-center px-6 py-3 text-white hover:text-brand-accent"
          >
            Связаться
          </a>
        </div>

        {/* Mobile burger */}
        <button
          className="relative -mr-2 flex h-11 w-11 flex-col items-center justify-center gap-[6px] md:hidden"
          aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          ref={menuButtonRef}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <motion.span
            className="block h-px w-7 bg-white origin-center"
            animate={
              isOpen ? { rotate: 45, y: 7, width: "100%" } : { rotate: 0, y: 0, width: "100%" }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.span
            className="block h-px w-7 bg-white"
            animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          />
          <motion.span
            className="block h-px w-7 bg-white origin-center"
            animate={
              isOpen ? { rotate: -45, y: -7, width: "100%" } : { rotate: 0, y: 0, width: "100%" }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuOverlayRef}
            role="dialog"
            aria-modal="true"
            aria-label="Меню сайта"
            className="fixed inset-0 z-[60] bg-brand-dark flex flex-col justify-center items-center md:hidden"
            initial={prefersReducedMotion ? { opacity: 1, clipPath: "inset(0 0 0% 0)" } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              className="absolute right-6 top-4 flex h-11 w-11 items-center justify-center"
              aria-label="Закрыть меню"
              onClick={closeMenu}
            >
              <span className="absolute h-px w-7 rotate-45 bg-white" />
              <span className="absolute h-px w-7 -rotate-45 bg-white" />
            </button>
            <nav id="mobile-navigation" className="flex flex-col items-center gap-10" aria-label="Мобильная навигация">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  ref={i === 0 ? firstMobileLinkRef : undefined}
                  className="text-4xl font-display text-white tracking-tight"
                  onClick={closeMenu}
                  initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.1 + i * 0.07, duration: prefersReducedMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>

            <motion.a
              href="#contact"
              className="premium-action btn-glass mt-12 inline-flex items-center justify-center px-9 py-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-accent"
              onClick={closeMenu}
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.36, duration: prefersReducedMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              Связаться
            </motion.a>

            <motion.div
              className="absolute bottom-12 text-[9px] uppercase tracking-[0.3em] opacity-30 text-white"
              initial={{ opacity: prefersReducedMotion ? 0.3 : 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.4, duration: prefersReducedMotion ? 0 : undefined }}
            >
              Умный Ремонт
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
