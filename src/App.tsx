import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { EstimateApp } from './components/EstimateApp';
import { Portfolio } from './components/Portfolio';
import { Quote } from './components/Quote';
import { Testimonials } from './components/Testimonials';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { PremiumCursor } from './components/PremiumCursor';
import { FilmGrain } from './components/FilmGrain';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

const portfolioModalEvent = 'portfolio-modal-toggle';

export default function App() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      gestureOrientation: 'vertical',
    });

    const handleLenisScroll = () => {
      ScrollTrigger.update();
    };

    const handleGsapTick = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on('scroll', handleLenisScroll);
    gsap.ticker.add(handleGsapTick);
    gsap.ticker.lagSmoothing(0);

    const handlePortfolioModalToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      const isOpen = Boolean(customEvent.detail?.open);

      if (isOpen) {
        lenis.stop();
      } else {
        lenis.start();
        ScrollTrigger.update();
      }
    };

    window.addEventListener(portfolioModalEvent, handlePortfolioModalToggle as EventListener);

    const splitHeadings: SplitType[] = [];

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('section');
      const headings = gsap.utils.toArray<HTMLElement>('[data-split-heading]');

      sections.forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          duration: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
          }
        });
      });

      headings.forEach((heading) => {
        const split = new SplitType(heading, {
          types: 'lines,chars',
          lineClass: 'split-line',
          charClass: 'split-char',
        });

        splitHeadings.push(split);

        if (!split.chars?.length) return;

        gsap.set(split.chars, {
          yPercent: 110,
          opacity: 0,
          rotateX: -80,
          transformOrigin: '50% 100%',
        });

        gsap.to(split.chars, {
          yPercent: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1.2,
          ease: 'power4.out',
          stagger: 0.018,
          scrollTrigger: {
            trigger: heading,
            start: 'top 85%',
            once: true,
          },
        });
      });
    }, mainRef);

    ScrollTrigger.refresh();

    return () => {
      splitHeadings.forEach((split) => split.revert());
      ctx.revert();
      gsap.ticker.remove(handleGsapTick);
      lenis.off('scroll', handleLenisScroll);
      window.removeEventListener(portfolioModalEvent, handlePortfolioModalToggle as EventListener);
      lenis.destroy();
    };
  }, []);

  return (
    <main ref={mainRef} className="relative bg-brand-dark overflow-x-hidden">
      <FilmGrain />
      <PremiumCursor />
      <Navbar />
      <Hero />
      <About />
      <EstimateApp />
      <Portfolio />
      <Quote />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
