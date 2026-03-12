import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MagneticButton } from './MagneticButton';
import { SpotlightCard } from './SpotlightCard';
import { DistortionImage } from './DistortionImage';

gsap.registerPlugin(ScrollTrigger);

const portfolioLeadHref = 'https://t.me/umniyremontbot?start=measure_site_works';

const projects = [
  {
    title: "Санузел: Темный мрамор",
    location: "Москва, RU",
    area: "Квартира",
    image: "/portfolio/bathroom-dark-marble.jpg"
  },
  {
    title: "Гостиная и коридор",
    location: "Москва, RU",
    area: "Квартира",
    image: "/portfolio/living-corridor.jpg"
  },
  {
    title: "Спальня: Минимализм",
    location: "Москва, RU",
    area: "Квартира",
    image: "/portfolio/bedroom-minimal.jpg"
  },
  {
    title: "Спальня: Панорамный вид",
    location: "Москва, RU",
    area: "Квартира",
    image: "/portfolio/bedroom-panoramic-view.jpg"
  },
  {
    title: "Зона отдыха",
    location: "Москва, RU",
    area: "Квартира",
    image: "/portfolio/lounge-lighting.jpg"
  },
  {
    title: "Кухня: Современная линия",
    location: "Москва, RU",
    area: "Квартира",
    image: "/portfolio/kitchen-modern.jpg"
  },
  {
    title: "Спальня: Уют",
    location: "Москва, RU",
    area: "Квартира",
    image: "/portfolio/bedroom-cozy.jpg"
  },
];

export const Portfolio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('.portfolio-item');
      
      items.forEach((item) => {
        gsap.from(item, {
          y: 100,
          opacity: 0,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
          }
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="portfolio" className="py-24 md:py-36 px-8 md:px-24 bg-brand-dark">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between mb-16 md:mb-20">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] mb-4 block opacity-40">Избранные проекты</span>
          <h2 data-split-heading className="text-5xl md:text-7xl font-display">Портфолио</h2>
        </div>

        <div className="flex flex-col items-start gap-5 md:items-end">
          <div className="hidden md:block text-[10px] uppercase tracking-[0.2em] opacity-40">
            {`Просмотр 01 — ${String(projects.length).padStart(2, '0')}`}
          </div>

          <MagneticButton>
            <a
              href={portfolioLeadHref}
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center justify-center overflow-hidden border border-white/15 px-8 py-4 text-[10px] uppercase tracking-[0.3em] text-white transition-colors hover:border-white/35"
              aria-label="Оставить заявку через Telegram"
            >
              <span className="relative z-10 transition-colors duration-500 group-hover:text-brand-dark">
                Оставить заявку
              </span>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"></div>
            </a>
          </MagneticButton>
        </div>
      </div>

      <div
        ref={containerRef}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10 md:gap-12"
      >
        {projects.map((project, index) => (
          <SpotlightCard
            key={index} 
            className="portfolio-item group cursor-pointer p-4 md:p-5"
            data-cursor-portfolio
          >
            <div className="relative h-full">
              <DistortionImage
                src={project.image}
                alt={project.title}
                className="mb-6 aspect-[4/5] rounded-[1.35rem] border border-white/8 bg-black/30"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.08),rgba(10,10,10,0.02)_42%,rgba(10,10,10,0.7))]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6">
                  <div className="translate-y-6 opacity-0 transition-all duration-500 delay-100 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.24em] text-white/58">
                      <span>{project.location}</span>
                      <span>{project.area}</span>
                    </div>
                  </div>
                </div>
              </DistortionImage>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl md:text-[2rem] font-display leading-tight transition-all duration-500 group-hover:italic">
                    {project.title}
                  </h3>
                  <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-white/45">
                    Продуманная геометрия, материал и свет собраны в цельную интерьерную композицию.
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-white/70 transition-colors duration-500 group-hover:bg-white group-hover:text-brand-dark">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 11L11 1M11 1H1M11 1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
};
