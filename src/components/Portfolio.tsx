import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MagneticButton } from './MagneticButton';
import { telegramLinks } from '../utils/telegramLinks';

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

const portfolioLeadHref = telegramLinks.estimatePortfolio;

const projects: Project[] = [
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
        src: '/portfolio/objects/tower-residence/03-hall.jpg',
        alt: 'Башенная резиденция — проходная зона и гостиная',
        caption: 'Проходная зона',
      },
      {
        src: '/portfolio/objects/tower-residence/04-bedroom-texture.jpg',
        alt: 'Башенная резиденция — спальня с фактурным изголовьем',
        caption: 'Спальня с фактурной стеной',
      },
      {
        src: '/portfolio/objects/tower-residence/05-lounge.jpg',
        alt: 'Башенная резиденция — зона отдыха с мягким светом',
        caption: 'Лаунж-зона',
      },
      {
        src: '/portfolio/objects/tower-residence/06-kitchen.jpg',
        alt: 'Башенная резиденция — линейная кухня',
        caption: 'Линейная кухня',
      },
      {
        src: '/portfolio/objects/tower-residence/07-bedroom-curve.jpg',
        alt: 'Башенная резиденция — спальня с криволинейной стеной',
        caption: 'Спальня с криволинейной геометрией',
      },
      {
        src: '/portfolio/objects/tower-residence/08-bedroom-headboard.jpg',
        alt: 'Башенная резиденция — акцентная стена спальни',
        caption: 'Акцентная стена спальни',
      },
      {
        src: '/portfolio/objects/tower-residence/09-corridor-alt.jpg',
        alt: 'Башенная резиденция — коридор с дубовым рисунком пола',
        caption: 'Коридор и дубовый пол',
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
      {
        src: '/portfolio/objects/compact-light-apartment/04-entry.jpg',
        alt: 'Светлая компактная квартира — входная группа',
        caption: 'Входная группа',
      },
      {
        src: '/portfolio/objects/compact-light-apartment/05-bathroom.jpg',
        alt: 'Светлая компактная квартира — санузел',
        caption: 'Санузел с черной сантехникой',
      },
      {
        src: '/portfolio/objects/compact-light-apartment/06-work-nook.jpg',
        alt: 'Светлая компактная квартира — рабочий уголок',
        caption: 'Рабочий уголок',
      },
      {
        src: '/portfolio/objects/compact-light-apartment/07-bedroom-glass.jpg',
        alt: 'Светлая компактная квартира — спальня со стеклянной перегородкой',
        caption: 'Спальня со стеклянной перегородкой',
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
        src: '/portfolio/objects/glass-block-apartment/02-bath-mirror.jpg',
        alt: 'Апартамент со стеклоблоками — санузел с зеркалом',
        caption: 'Санузел и зеркало',
      },
      {
        src: '/portfolio/objects/glass-block-apartment/03-bath-angle.jpg',
        alt: 'Апартамент со стеклоблоками — ванная зона',
        caption: 'Ванная зона',
      },
      {
        src: '/portfolio/objects/glass-block-apartment/04-bath-detail.jpg',
        alt: 'Апартамент со стеклоблоками — деталь ванной',
        caption: 'Деталь ванной комнаты',
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
        src: '/portfolio/objects/graphite-apartment/02-entry.jpg',
        alt: 'Графитовый апартамент — входная зона',
        caption: 'Входная зона',
      },
      {
        src: '/portfolio/objects/graphite-apartment/03-bedroom-wallpaper.jpg',
        alt: 'Графитовый апартамент — спальня с акцентной стеной',
        caption: 'Спальня с акцентной стеной',
      },
      {
        src: '/portfolio/objects/graphite-apartment/04-bathroom-laundry.jpg',
        alt: 'Графитовый апартамент — постирочная и санузел',
        caption: 'Постирочная зона',
      },
      {
        src: '/portfolio/objects/graphite-apartment/05-bathroom-vanity.jpg',
        alt: 'Графитовый апартамент — ванная с латунью',
        caption: 'Ванная с латунными деталями',
      },
      {
        src: '/portfolio/objects/graphite-apartment/06-bathroom-detail.jpg',
        alt: 'Графитовый апартамент — деталь ванной комнаты',
        caption: 'Деталь ванной комнаты',
      },
    ],
  },
  {
    id: 'warm-city-studio',
    title: 'Теплая городская студия',
    category: 'Студия',
    stage: 'Реализация',
    description:
      'Компактная студия в теплой гамме, где кухня и входная зона решены как единый спокойный объем.',
    highlights: ['теплые фасады', 'компактная кухня', 'мягкий свет'],
    gallery: [
      {
        src: '/portfolio/objects/warm-city-studio/01-kitchen.jpg',
        alt: 'Теплая городская студия — кухня',
        caption: 'Кухня теплой гаммы',
      },
      {
        src: '/portfolio/objects/warm-city-studio/02-entry.jpg',
        alt: 'Теплая городская студия — вид на входную зону',
        caption: 'Связка кухни и входа',
      },
    ],
  },
  {
    id: 'chamber-suite',
    title: 'Камерный спальневый блок',
    category: 'Квартира',
    stage: 'Реализация',
    description:
      'Нейтральная спальня с лаунж-зоной, мягкими формами и фактурной стеной построена на тихих оттенках и приглушенном свете.',
    highlights: ['лаунж-зона', 'фактурная стена', 'мягкий текстиль'],
    gallery: [
      {
        src: '/portfolio/objects/chamber-suite/01-bedroom.jpg',
        alt: 'Камерный спальневый блок — спальня',
        caption: 'Спальня с мягким светом',
      },
      {
        src: '/portfolio/objects/chamber-suite/02-lounge.jpg',
        alt: 'Камерный спальневый блок — диванная зона',
        caption: 'Небольшая лаунж-зона',
      },
      {
        src: '/portfolio/objects/chamber-suite/03-texture-wall.jpg',
        alt: 'Камерный спальневый блок — фактурная стена',
        caption: 'Фактурная стена у изголовья',
      },
      {
        src: '/portfolio/objects/chamber-suite/04-wardrobe.jpg',
        alt: 'Камерный спальневый блок — система хранения',
        caption: 'Система хранения',
      },
    ],
  },
  {
    id: 'stone-bath-suite',
    title: 'Каменный санузел',
    category: 'Санузел',
    stage: 'Реализация',
    description:
      'Крупный рисунок камня и латунная арматура создают мягкую, почти отельную атмосферу в небольшом объеме.',
    highlights: ['крупный керамогранит', 'латунная сантехника', 'светлый тон'],
    gallery: [
      {
        src: '/portfolio/objects/stone-bath-suite/01-bathroom.jpg',
        alt: 'Каменный санузел — общий вид',
        caption: 'Общий вид санузла',
      },
      {
        src: '/portfolio/objects/stone-bath-suite/02-bathroom-entry.jpg',
        alt: 'Каменный санузел — вид от входа',
        caption: 'Вид от входа',
      },
    ],
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
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="portfolio" className="bg-brand-dark px-8 py-24 md:px-24 md:py-36">
      <div className="mb-16 flex flex-col gap-8 md:mb-20 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="mb-4 block text-[10px] uppercase tracking-[0.3em] opacity-40">
            Объекты и пространства
          </span>
          <h2 data-split-heading className="text-5xl font-display md:text-7xl">
            Портфолио
          </h2>
        </div>

        <div className="flex flex-col items-start gap-5 md:items-end">
          <div className="hidden text-[10px] uppercase tracking-[0.2em] opacity-40 md:block">
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
              <div className="absolute inset-0 translate-y-full bg-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0" />
            </a>
          </MagneticButton>
        </div>
      </div>

      <div ref={containerRef} className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-3 md:gap-12">
        {projects.map((project) => {
          const previewImages = project.gallery.slice(1, 4);

          return (
            <article
              key={project.id}
              className="portfolio-item overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-[1px] md:p-5"
            >
              <div className="relative mb-6 overflow-hidden rounded-[1.35rem] border border-white/8 bg-black/30">
                <img
                  src={project.gallery[0].src}
                  alt={project.gallery[0].alt}
                  className="aspect-[4/5] h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.12),rgba(10,10,10,0.04)_42%,rgba(10,10,10,0.78))]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6">
                  <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.24em] text-white/58">
                    <span>{project.category}</span>
                    <span>{project.stage}</span>
                    <span>{`${project.gallery.length} кадров`}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {project.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/58"
                  >
                    {highlight}
                  </span>
                ))}
              </div>

              <h3 className="text-2xl font-display leading-tight md:text-[2rem]">
                {project.title}
              </h3>
              <p className="mt-3 max-w-[22rem] text-sm leading-relaxed text-white/45">
                {project.description}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {previewImages.map((image) => (
                  <figure
                    key={image.src}
                    className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="aspect-[4/5] h-full w-full object-cover"
                      loading="lazy"
                    />
                  </figure>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
