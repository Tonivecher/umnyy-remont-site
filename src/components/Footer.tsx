import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-20 px-8 md:px-24 border-t border-white/5 bg-brand-dark">
      <div className="grid md:grid-cols-4 gap-16 mb-20">
        <div className="md:col-span-2">
          <a href="#" className="inline-block mb-8">
            <img
              src="/brand/logo-white@3x.png"
              alt="Умный Ремонт"
              className="w-40 md:w-44 h-auto"
            />
          </a>
          <p className="text-sm opacity-40 max-w-sm leading-relaxed">
            Архитектурная реализация интерьеров для тех, кто ценит точность, материальность и вневременной дизайн.
          </p>
        </div>
        
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] mb-6 block opacity-40">Соцсети</span>
          <ul className="flex flex-col gap-4 text-xs uppercase tracking-widest">
            <li><a href="#" className="hover:opacity-50 transition-opacity">Instagram</a></li>
            <li><a href="#" className="hover:opacity-50 transition-opacity">Behance</a></li>
            <li><a href="#" className="hover:opacity-50 transition-opacity">Pinterest</a></li>
          </ul>
        </div>
        
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] mb-6 block opacity-40">Юридическая информация</span>
          <ul className="flex flex-col gap-4 text-xs uppercase tracking-widest">
            <li><a href="#" className="hover:opacity-50 transition-opacity">Политика конфиденциальности</a></li>
            <li><a href="#" className="hover:opacity-50 transition-opacity">Условия использования</a></li>
          </ul>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 text-[9px] uppercase tracking-[0.3em] opacity-30">
        <span>© 2026 Умный Ремонт. Все права защищены.</span>
        <span className="mt-4 md:mt-0">Создано для совершенства</span>
      </div>
    </footer>
  );
};
