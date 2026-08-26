import React from "react";

import { telegramLinks } from "../utils/telegramLinks";

export const Footer: React.FC = () => {
  return (
    <footer className="py-20 px-8 md:px-24 border-t border-white/5 bg-brand-dark">
      <div className="grid gap-16 mb-20 md:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
        <div>
          <a href="/" className="inline-block mb-8" aria-label="На главную страницу Умный Ремонт">
            <img
              src="/brand/umniremont-logo-white.svg"
              alt="Умный Ремонт"
              className="h-12 w-auto md:h-16"
            />
          </a>
          <p className="max-w-sm text-sm leading-relaxed opacity-60">
            Архитектурная реализация интерьеров для тех, кто ценит точность, материальность и
            вневременной дизайн.
          </p>
        </div>

        <div>
          <span className="mb-6 block text-[10px] uppercase tracking-[0.2em] opacity-60">
            Telegram
          </span>
          <ul className="flex flex-col gap-1 text-xs uppercase tracking-widest">
            <li>
              <a
                href={telegramLinks.channel}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center hover:opacity-50 transition-opacity"
              >
                Канал «Про умный ремонт»
              </a>
            </li>
            <li><a href="/privacy-policy/" className="inline-flex min-h-11 items-center hover:opacity-50 transition-opacity">Политика конфиденциальности</a></li>
            <li><a href="/personal-data-consent/" className="inline-flex min-h-11 items-center hover:opacity-50 transition-opacity">Согласие на данные</a></li>
            <li><a href="/review-publication-consent/" className="inline-flex min-h-11 items-center hover:opacity-50 transition-opacity">Публикация отзывов</a></li>
            <li><a href="/cookie-policy/" className="inline-flex min-h-11 items-center hover:opacity-50 transition-opacity">Политика cookie</a></li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between border-t border-white/5 pt-12 text-[10px] uppercase tracking-[0.3em] text-white/60 md:flex-row">
        <div className="text-center md:text-left">
          <span className="block">© 2026 Умный Ремонт. Все права защищены.</span>
          <span className="mt-2 block">Информация обновлена 26 августа 2026 года.</span>
        </div>
        <a className="mt-4 inline-flex min-h-11 items-center md:mt-0 hover:opacity-80" href="https://github.com/Tonivecher" target="_blank" rel="noreferrer noopener">Разработка сайта — Николай · GitHub</a>
      </div>
    </footer>
  );
};
