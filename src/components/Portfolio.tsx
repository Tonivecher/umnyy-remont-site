import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MagneticButton } from './MagneticButton';
import { SpotlightCard } from './SpotlightCard';
import { DistortionImage } from './DistortionImage';

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

const portfolioLeadHref = 'https://t.me/umniyremontbot?start=measure_site_works';

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
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;

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

  useEffect(() => {
    if (!activeProject) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveProjectId(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeProject]);

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
          const hiddenImagesCount = Math.max(project.gallery.length - 4, 0);

          return (
            <SpotlightCard key={project.id} className="portfolio-item p-4 md:p-5">
              <button
                type="button"
                onClick={() => setActiveProjectId(project.id)}
                className="group block h-full w-full text-left"
                aria-label={`Открыть объект ${project.title}`}
                data-cursor-portfolio
              >
                <div className="relative h-full">
                  <DistortionImage
                    src={project.gallery[0].src}
                    alt={project.gallery[0].alt}
                    className="mb-6 aspect-[4/5] rounded-[1.35rem] border border-white/8 bg-black/30"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.08),rgba(10,10,10,0.02)_42%,rgba(10,10,10,0.78))]" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6">
                      <div className="translate-y-6 opacity-0 transition-all duration-500 delay-100 group-hover:translate-y-0 group-hover:opacity-100">
                        <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.24em] text-white/58">
                          <span>{project.category}</span>
                          <span>{project.stage}</span>
                          <span>{`${project.gallery.length} кадров`}</span>
                        </div>
                      </div>
                    </div>
                  </DistortionImage>

                  <div className="flex items-start justify-between gap-4">
                    <div>
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

                      <h3 className="text-2xl font-display leading-tight transition-all duration-500 group-hover:italic md:text-[2rem]">
                        {project.title}
                      </h3>
                      <p className="mt-3 max-w-[20rem] text-sm leading-relaxed text-white/45">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-white/70 transition-colors duration-500 group-hover:bg-white group-hover:text-brand-dark">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M1 11L11 1M11 1H1M11 1V11"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {previewImages.map((image) => (
                      <div
                        key={image.src}
                        className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]"
                      >
                        <img src={image.src} alt={image.alt} className="aspect-[4/5] h-full w-full object-cover" loading="lazy" />
                      </div>
                    ))}

                    {hiddenImagesCount > 0 ? (
                      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-[12px] uppercase tracking-[0.24em] text-white/58">
                        {`+${hiddenImagesCount}`}
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            </SpotlightCard>
          );
        })}
      </div>

      {activeProject ? (
        <div
          className="fixed inset-0 z-[110] overflow-y-auto px-4 py-6 md:px-8 md:py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="portfolio-dialog-title"
          onClick={() => setActiveProjectId(null)}
        >
          <div className="absolute inset-0 bg-black/78 backdrop-blur-md" />

          <div
            className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707]/95 shadow-[0_32px_120px_rgba(0,0,0,0.42)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-6 border-b border-white/10 px-6 py-6 md:flex-row md:items-start md:justify-between md:px-8 md:py-8">
              <div className="max-w-3xl">
                <span className="text-[10px] uppercase tracking-[0.28em] text-white/40">
                  {`${activeProject.category} · ${activeProject.stage} · ${activeProject.gallery.length} кадров`}
                </span>
                <h3 id="portfolio-dialog-title" className="mt-4 text-3xl font-display md:text-5xl">
                  {activeProject.title}
                </h3>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/58 md:text-base">
                  {activeProject.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {activeProject.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/58"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveProjectId(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 text-white/72 transition-colors hover:border-white/30 hover:text-white"
                aria-label="Закрыть галерею"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 1L11 11M11 1L1 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 pb-6 pt-5 md:px-8 md:pb-8">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <span className="text-[10px] uppercase tracking-[0.28em] text-white/36">
                  Полная подборка по объекту
                </span>

                <a
                  href={portfolioLeadHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-white/60 transition-colors hover:text-white"
                >
                  <span>Обсудить похожий проект</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1 11L11 1M11 1H1M11 1V11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {activeProject.gallery.map((image, index) => (
                  <figure
                    key={image.src}
                    className={`overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.03] ${
                      index === 0 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <img src={image.src} alt={image.alt} className="aspect-[4/5] h-full w-full object-cover" loading="lazy" />
                    <figcaption className="border-t border-white/8 px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-white/40">
                      {image.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
