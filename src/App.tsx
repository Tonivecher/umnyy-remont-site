import { useEffect, useState } from "react";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LeadBanner } from "@/components/LeadBanner";
import { About } from "@/components/About";
import { Portfolio } from "@/components/Portfolio";
import { FAQ } from "@/components/FAQ";
import { Quote } from "@/components/Quote";
import { Testimonials } from "@/components/Testimonials";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { PremiumCursor } from "@/components/PremiumCursor";
import { FloatingTelegramCta } from "@/components/FloatingTelegramCta";
import { initTremble } from "@/utils/tremble";

export default function App() {
  const [enablePremiumCursor, setEnablePremiumCursor] = useState(false);

  useEffect(() => initTremble(), []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const isSmallViewport = window.matchMedia("(max-width: 767px)").matches;
    const isLowPower =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined &&
      ((navigator as Navigator & { deviceMemory?: number }).deviceMemory as number) <= 4;

    setEnablePremiumCursor(
      !prefersReducedMotion && !isCoarsePointer && !isSmallViewport && !isLowPower,
    );
  }, []);

  return (
    <main className="relative bg-brand-dark overflow-x-hidden">
      {enablePremiumCursor ? <PremiumCursor /> : null}
      <Navbar />
      <Hero />
      <LeadBanner />
      <About />
      <Portfolio />
      <FAQ />
      <Quote />
      <Testimonials />
      <CTA />
      <Footer />
      <FloatingTelegramCta />
    </main>
  );
}
