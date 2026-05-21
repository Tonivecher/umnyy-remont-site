import React from 'react';
import { telegramLinks } from '../utils/telegramLinks';

export const FloatingTelegramCta: React.FC = () => {
  return (
    <a
      href={telegramLinks.measureFloating}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-full border border-white/15 bg-brand-dark/85 px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white shadow-2xl shadow-black/30 backdrop-blur-md transition hover:border-brand-accent hover:text-brand-accent md:bottom-8 md:right-8"
      aria-label="Оставить заявку в Telegram-боте Умный Ремонт"
    >
      <span className="flex h-2.5 w-2.5 rounded-full bg-brand-accent shadow-[0_0_16px_rgba(197,160,89,0.85)]" />
      <span className="hidden sm:inline">Заявка в Telegram</span>
      <span className="sm:hidden">Telegram</span>
    </a>
  );
};
