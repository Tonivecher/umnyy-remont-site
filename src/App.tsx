import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import SplitType from "split-type";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LeadBanner } from "@/components/LeadBanner";
import { About } from "@/components/About";
import { Portfolio } from "@/components/Portfolio";
import { Quote } from "@/components/Quote";
import { Testimonials } from "@/components/Testimonials";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { PremiumCursor } from "@/components/PremiumCursor";
import { FilmGrain } from "@/components/FilmGrain";
import { FloatingTelegramCta } from "@/components/FloatingTelegramCta";
import { initTremble } from "@/utils/tremble";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const [enableAmbientFx, setEnableAmbientFx] = useState(false);

  useEffect(() => initTremble(), []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const isSmallViewport = window.matchMedia("(max-width: 767px)").matches;
    const isLowPower =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined &&
      ((navigator as Navigator & { deviceMemory?: number }).deviceMemory as number) <= 4;

    setEnableAmbientFx(
      !prefersReducedMotion && !isCoarsePointer && !isSmallViewport && !isLowPower,
    );

    const lenis = new Lenis({
      lerp: isSmallViewport ? 0.14 : 0.08,
      smoothWheel: !prefersReducedMotion,
      syncTouch: false,
      gestureOrientation: "vertical",
    });

    const handleLenisScroll = () => ScrollTrigger.update();
    const handleGsapTick = (time: number) => lenis.raf(time * 1000);

    lenis.on("scroll", handleLenisScroll);
    gsap.ticker.add(handleGsapTick);
    gsap.ticker.lagSmoothing(0);

    const splitHeadings: SplitType[] = [];

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Reduced motion: no entrance animation at all, content is visible instantly.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(gsap.utils.toArray<HTMLElement>("section"), { opacity: 1, clearProps: "all" });
        gsap.set(gsap.utils.toArray<HTMLElement>("[data-split-heading]"), { opacity: 1, y: 0 });
      });

      // Shared, cheap section fade — tuned per device class.
      mm.add(
        {
          isMobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
          isTablet:
            "(min-width: 768px) and (max-width: 1279px) and (prefers-reduced-motion: no-preference)",
          isDesktop: "(min-width: 1280px) and (prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const conditions = context.conditions as Record<string, boolean>;
          const isMobile = Boolean(conditions["isMobile"]);
          const isTablet = Boolean(conditions["isTablet"]);

          // One batched trigger for all sections instead of one per section.
          ScrollTrigger.batch("section", {
            start: isMobile ? "top 95%" : "top 90%",
            once: true,
            onEnter: (batch) =>
              gsap.from(batch, {
                opacity: 0,
                y: isMobile ? 12 : 0,
                duration: isMobile ? 0.5 : isTablet ? 0.75 : 1,
                ease: "none",
                stagger: 0.06,
                clearProps: "opacity,transform",
              }),
          });

          const headings = gsap.utils.toArray<HTMLElement>("[data-split-heading]");

          // Per-character 3D split is expensive: mobile gets a simple line fade.
          if (isMobile) {
            headings.forEach((heading) => {
              gsap.fromTo(
                heading,
                { opacity: 0, y: 16 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.6,
                  ease: "power2.out",
                  scrollTrigger: { trigger: heading, start: "top 90%", once: true },
                },
              );
            });
            return;
          }

          headings.forEach((heading) => {
            const accessibleLabel = heading.textContent?.replace(/\s+/g, " ").trim();
            if (accessibleLabel) heading.setAttribute("aria-label", accessibleLabel);
            const split = new SplitType(heading, {
              types: "lines,chars",
              lineClass: "split-line",
              charClass: "split-char",
            });

            splitHeadings.push(split);
            if (!split.chars?.length) return;

            gsap.set(split.chars, {
              yPercent: 110,
              opacity: 0,
              rotateX: isTablet ? -45 : -80,
              transformOrigin: "50% 100%",
              force3D: true,
            });

            gsap.to(split.chars, {
              yPercent: 0,
              opacity: 1,
              rotateX: 0,
              duration: isTablet ? 0.7 : 0.85,
              ease: "power4.out",
              stagger: isTablet ? 0.008 : 0.012,
              scrollTrigger: {
                trigger: heading,
                start: "top 85%",
                once: true,
                // Promote to its own layer only while the animation runs.
                onEnter: () => split.chars?.forEach((char) => char.classList.add("is-animating")),
              },
              onComplete: () => {
                split.chars?.forEach((char) => char.classList.remove("is-animating"));
                gsap.set(split.chars, { clearProps: "transform,opacity" });
              },
            });
          });
        },
      );
    }, mainRef);

    ScrollTrigger.config({ ignoreMobileResize: true });
    ScrollTrigger.refresh();

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const handleResize = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 180);
    };
    window.addEventListener("orientationchange", handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener("orientationchange", handleResize);
      window.removeEventListener("resize", handleResize);
      splitHeadings.forEach((split) => split.revert());
      ctx.revert();
      gsap.ticker.remove(handleGsapTick);
      lenis.off("scroll", handleLenisScroll);
      lenis.destroy();
    };
  }, []);

  return (
    <main ref={mainRef} className="relative bg-brand-dark overflow-x-hidden">
      {enableAmbientFx ? <FilmGrain /> : null}
      {enableAmbientFx ? <PremiumCursor /> : null}
      <Navbar />
      <Hero />
      <LeadBanner />
      <About />
      <Portfolio />
      <Quote />
      <Testimonials />
      <CTA />
      <Footer />
      <FloatingTelegramCta />
    </main>
  );
}
