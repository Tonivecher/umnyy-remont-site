import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MagneticButton } from './MagneticButton';

gsap.registerPlugin(ScrollTrigger);

const estimateAppHref = 'https://t.me/umniyremontbot?start=estimate_site_materials';

const estimateFeatures = [
  {
    title: 'Комнаты и площади',
    description: 'Укажите тип помещений, площадь и базовые параметры объекта, чтобы получить рабочий ориентир до первого замера.',
  },
  {
    title: 'Материалы и объемы',
    description: 'Приложение собирает предварительный расчет по ключевым материалам и помогает понять ожидаемый объем закупки.',
  },
  {
    title: 'Стоимость и следующий шаг',
    description: 'На выходе вы видите ориентир по материалам и можете перейти к следующему этапу обсуждения уже с подготовленной базой.',
  },
];

const estimateHighlights = ['Несколько комнат', 'Сценарии отделки', 'Предварительный бюджет'];

export const EstimateApp: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.estimate-app-copy', {
        x: -40,
        opacity: 0,
        duration: 1.4,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });

      gsap.from('.estimate-feature-card', {
        y: 40,
        opacity: 0,
        duration: 1.1,
        stagger: 0.14,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 78%',
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 md:py-44 px-8 md:px-24 bg-brand-dark overflow-hidden">
      <div className="grid gap-14 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] items-start">
        <div className="estimate-app-copy max-w-3xl">
          <span className="text-[10px] uppercase tracking-[0.3em] mb-6 block opacity-40">
            SmartRepair Mini App
          </span>

          <h2 className="text-5xl md:text-7xl font-display leading-[0.98] max-w-4xl">
            Предварительную стоимость материалов можно рассчитать еще до замера.
          </h2>

          <p className="mt-8 max-w-2xl text-base md:text-lg leading-relaxed opacity-70">
            В приложении вы задаете комнаты, площадь и сценарий отделки, а система собирает ориентировочный
            расчет по материалам и предварительный бюджет. Это не заменяет финальную смету, но дает быстрый
            ориентир до первого созвона.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <MagneticButton>
              <a
                href={estimateAppHref}
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex items-center justify-center overflow-hidden bg-white px-8 py-4 text-[10px] uppercase tracking-[0.3em] text-brand-dark"
                aria-label="Открыть приложение SmartRepair"
              >
                <span className="relative z-10">Открыть приложение</span>
                <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"></div>
              </a>
            </MagneticButton>

            <div className="inline-flex items-center border border-white/10 px-5 py-4 text-[10px] uppercase tracking-[0.3em] text-white/55">
              Работает внутри Telegram
            </div>
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.2em] opacity-35">
            Из сайта пользователь попадает в бота, а оттуда открывает Mini App в корректном Telegram-контексте.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.15),transparent_58%)] pointer-events-none" />

          <div className="relative border border-white/10 bg-white/[0.04] p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] mb-3 block opacity-40">Что внутри</span>
                <h3 className="text-3xl md:text-4xl font-display">Быстрый ориентир по материалам</h3>
              </div>

              <div className="text-[10px] uppercase tracking-[0.2em] opacity-30">до звонка и замера</div>
            </div>

            <div className="mt-10 space-y-4">
              {estimateFeatures.map((feature, index) => (
                <article key={feature.title} className="estimate-feature-card grid grid-cols-[auto_1fr] gap-5 border border-white/8 bg-black/20 p-5">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-brand-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div>
                    <h4 className="text-xl font-display">{feature.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed opacity-65">{feature.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {estimateHighlights.map((item) => (
                <div
                  key={item}
                  className="border border-white/8 px-4 py-4 text-[10px] uppercase tracking-[0.28em] text-white/45"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
