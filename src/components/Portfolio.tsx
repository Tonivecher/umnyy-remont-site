import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MagneticButton } from './MagneticButton';

gsap.registerPlugin(ScrollTrigger);

type ProjectImage = {
  src: string;
  alt: string;
  caption: string;
};

type Project = {
  id: string;
  title: string;
  category: string;
  stage: string;
  description: string;
  highlights: string[];
  gallery: ProjectImage[];
};

const projects: Project[] = [
  {
    id: 'modern-interior',
    title: 'Современный интерьер',
    category: 'Квартира',
    stage: 'Реализация',
    description:
      'Лаконичные формы, продуманная геометрия пространства и чистые цвета. Современный подход к проектированию комфортной среды.',
    highlights: ['панорамные окна', 'натуральное дерево', 'светлые тона'],
    gallery: [
      {
        src: '/portfolio/objects/modern-interior/media__1779356868461.jpg',
        alt: 'Современный интерьер — гостиная',
        caption: 'Зона гостиной с видом',
      },
      {
        src: '/portfolio/objects/modern-interior/media__1779356868460.jpg',
        alt: 'Современный интерьер — кухня',
        caption: 'Кухня и столовая',
      },
      {
        src: '/portfolio/objects/modern-interior/media__1779356868465.jpg',
        alt: 'Современный интерьер — ванная комната',
        caption: 'Ванная с мраморной текстурой',
      },
    ],
  },
  {
    id: 'tower-residence',
    title: 'Башенная резиденция',
    category: 'Квартира',
    stage: 'Реализация',
    description:
      'Панорамные спальни, глубокий камень в санузле и теплый рисунок пола собраны в цельный интерьер без визуального шума.',
    highlights: ['панорамное остекление', 'темный камень', 'скрытый свет'],
    gallery: [
      {
        src: '/portfolio/objects/tower-residence/01-bedroom-view.jpg',
        alt: 'Башенная резиденция — спальня с панорамным окном',
        caption: 'Спальня с панорамным остеклением',
      },
      {
        src: '/portfolio/objects/tower-residence/02-bathroom-onyx.jpg',
        alt: 'Башенная резиденция — санузел с темным камнем',
        caption: 'Санузел с темным камнем',
      },
      {
        src: '/portfolio/objects/tower-residence/06-kitchen.jpg',
        alt: 'Башенная резиденция — линейная кухня',
        caption: 'Линейная кухня',
      },
      {
        src: '/portfolio/objects/tower-residence/03-hall.jpg',
        alt: 'Башенная резиденция — проходная зона и гостиная',
        caption: 'Проходная зона',
      },
    ],
  },
  {
    id: 'compact-light-apartment',
    title: 'Светлая компактная квартира',
    category: 'Квартира',
    stage: 'Реализация',
    description:
      'Светлый дуб, черные акценты и зеркальные поверхности работают на ощущение воздуха даже в компактном формате.',
    highlights: ['светлый дуб', 'черные детали', 'интегрированное хранение'],
    gallery: [
      {
        src: '/portfolio/objects/compact-light-apartment/01-bedroom.jpg',
        alt: 'Светлая компактная квартира — спальня',
        caption: 'Главная спальня',
      },
      {
        src: '/portfolio/objects/compact-light-apartment/02-kitchenette.jpg',
        alt: 'Светлая компактная квартира — кухня и проход',
        caption: 'Кухня и проход',
      },
      {
        src: '/portfolio/objects/compact-light-apartment/03-dining.jpg',
        alt: 'Светлая компактная квартира — обеденная зона',
        caption: 'Небольшая обеденная зона',
      },
    ],
  },
  {
    id: 'glass-block-apartment',
    title: 'Апартамент со стеклоблоками',
    category: 'Апартамент',
    stage: 'Реализация',
    description:
      'Функциональный блок построен на чистой геометрии: белая плитка, стеклоблоки и спокойный свет делают пространство легким.',
    highlights: ['стеклоблоки', 'белая плитка', 'функциональная ванная'],
    gallery: [
      {
        src: '/portfolio/objects/glass-block-apartment/01-corridor.jpg',
        alt: 'Апартамент со стеклоблоками — коридор',
        caption: 'Коридор со стеклоблоками',
      },
      {
        src: '/portfolio/objects/glass-block-apartment/03-bath-angle.jpg',
        alt: 'Апартамент со стеклоблоками — ванная зона',
        caption: 'Ванная зона',
      },
      {
        src: '/portfolio/objects/glass-block-apartment/02-bath-mirror.jpg',
        alt: 'Апартамент со стеклоблоками — санузел с зеркалом',
        caption: 'Санузел и зеркало',
      },
    ],
  },
  {
    id: 'graphite-apartment',
    title: 'Графитовый апартамент',
    category: 'Апартамент',
    stage: 'Реализация',
    description:
      'Графитовая кухня, древесные плоскости и латунные акценты собирают интерьер с более плотным, камерным характером.',
    highlights: ['графитовая кухня', 'латунные акценты', 'акцентная спальня'],
    gallery: [
      {
        src: '/portfolio/objects/graphite-apartment/01-kitchen.jpg',
        alt: 'Графитовый апартамент — кухня',
        caption: 'Графитовая кухня',
      },
      {
        src: '/portfolio/objects/graphite-apartment/03-bedroom-wallpaper.jpg',
        alt: 'Графитовый апартамент — спальня с акцентной стеной',
        caption: 'Спальня с акцентной стеной',
      },
      {
        src: '/portfolio/objects/graphite-apartment/05-bathroom-vanity.jpg',
        alt: 'Графитовый апартамент — ванная с латунью',
        caption: 'Ванная с латунными деталями',
      },
    ],
  },
];

export const Portfolio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade up effect for each portfolio block
      const items = gsap.utils.toArray<HTMLElement>('.portfolio-item');
      items.forEach((item) => {
        gsap.from(item, {
          y: 80,
          opacity: 0,
          duration: 1.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
          },
        });
      });

      // Smooth parallax for main images
      const parallaxImages = gsap.utils.toArray<HTMLElement>('.image-parallax');
      parallaxImages.forEach((img) => {
        gsap.to(img, {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: img.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="portfolio" className="bg-brand-dark px-6 py-24 md:px-12 xl:px-24 md:py-40">
      <div className="mb-20 flex flex-col gap-10 md:mb-32 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="mb-6 block text-[10px] uppercase tracking-[0.3em] opacity-40">
            Избранные работы
          </span>
          <h2 data-split-heading className="text-5xl font-display md:text-7xl lg:text-[6rem] leading-[0.9]">
            Портфолио
          </h2>
        </div>

        <div className="flex flex-col items-start gap-6 md:items-end">
          <div className="hidden text-[10px] uppercase tracking-[0.2em] opacity-40 md:block">
            {`Показано 01 — ${String(projects.length).padStart(2, '0')}`}
          </div>

          <MagneticButton>
            <a
              href="#contact"
              className="premium-action group relative inline-flex w-full items-center justify-center overflow-hidden border border-white/20 px-8 py-5 text-[10px] uppercase text-white hover:border-white/40 sm:w-auto sm:px-10 sm:text-[11px]"
              aria-label="Перейти к контактам для обсуждения проекта"
            >
              <span className="mobile-action-text relative z-10 transition-colors duration-500 group-hover:text-brand-dark md:tracking-[0.25em]">
                Обсудить проект
              </span>
              <div className="absolute inset-0 translate-y-full bg-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0" />
            </a>
          </MagneticButton>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-col gap-32 md:gap-48 lg:gap-64 pb-20">
        {projects.map((project, index) => {
          const isEven = index % 2 === 0;
          const mainImg = project.gallery[0];
          const secondaryImgs = project.gallery.slice(1, 3);

          return (
            <article
              key={project.id}
              className="portfolio-item group relative w-full"
            >
              <div className={`flex flex-col gap-10 md:gap-16 lg:gap-32 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center`}>
                
                {/* Main Image Container */}
                <div className="w-full md:w-7/12 lg:w-2/3">
                  <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded-sm bg-[#111]">
                    <img
                      src={mainImg.src}
                      alt={mainImg.alt}
                      className="image-parallax absolute top-[-10%] left-0 w-full h-[120%] object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Content & Secondary Images */}
                <div className="w-full md:w-5/12 lg:w-1/3 flex flex-col justify-center">
                  <div className="mb-10">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-white/40 block mb-4">
                      {project.category} &bull; {project.stage}
                    </span>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-display leading-tight mb-5 text-white/90">
                      {project.title}
                    </h3>
                    <p className="text-white/50 text-sm md:text-base leading-relaxed mb-8 max-w-sm">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="px-4 py-2 border border-white/10 rounded-full text-[9px] uppercase tracking-[0.2em] text-white/50 bg-white/[0.02]"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Imagery */}
                  {secondaryImgs.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 md:gap-6 mt-4">
                      {secondaryImgs.map((img) => (
                        <figure
                          key={img.src}
                          className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#111]"
                        >
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover opacity-60 transition-opacity duration-700 group-hover:opacity-90 hover:!opacity-100 grayscale-[20%] hover:grayscale-0"
                            loading="lazy"
                          />
                        </figure>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
