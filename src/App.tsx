import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { EstimateApp } from './components/EstimateApp';
import { Portfolio } from './components/Portfolio';
import { Quote } from './components/Quote';
import { Testimonials } from './components/Testimonials';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    // Smooth scroll behavior or any global animations
    const ctx = gsap.context(() => {
      // Global reveal animation for sections
      gsap.utils.toArray('section').forEach((section: any) => {
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
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="relative bg-brand-dark overflow-x-hidden">
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
