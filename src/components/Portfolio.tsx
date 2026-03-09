import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
      const items = gsap.utils.toArray('.portfolio-item') as HTMLElement[];
      
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
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="portfolio" className="py-24 md:py-36 px-8 md:px-24 bg-brand-dark">
      <div className="flex justify-between items-end mb-16 md:mb-20">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] mb-4 block opacity-40">Избранные проекты</span>
          <h2 className="text-5xl md:text-7xl font-display">Портфолио</h2>
        </div>
        <div className="hidden md:block text-[10px] uppercase tracking-[0.2em] opacity-40">
          {`Просмотр 01 — ${String(projects.length).padStart(2, '0')}`}
        </div>
      </div>

      <div
        ref={containerRef}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10 md:gap-12"
      >
        {projects.map((project, index) => (
          <div 
            key={index} 
            className="portfolio-item group cursor-pointer"
          >
            <div className="relative aspect-[4/5] overflow-hidden mb-5">
              <img 
                src={project.image} 
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Hover details */}
              <div className="absolute bottom-6 left-6 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em]">
                  <span>{project.location}</span>
                  <span>{project.area}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-2xl md:text-3xl font-display leading-tight group-hover:italic transition-all duration-500">
                {project.title}
              </h3>
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-brand-dark transition-colors duration-500">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 11L11 1M11 1H1M11 1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
