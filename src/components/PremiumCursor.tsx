import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type CursorMode = "default" | "magnetic" | "portfolio";

const cursorVariants: Record<
  CursorMode,
  {
    size: number;
    backgroundColor: string;
    borderColor: string;
    opacity: number;
    blendMode: React.CSSProperties["mixBlendMode"];
  }
> = {
  default: {
    size: 14,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "rgba(255, 255, 255, 0)",
    opacity: 0.85,
    blendMode: "normal",
  },
  magnetic: {
    size: 64,
    backgroundColor: "rgba(197, 160, 89, 0.14)",
    borderColor: "rgba(197, 160, 89, 0.45)",
    opacity: 1,
    blendMode: "normal",
  },
  portfolio: {
    size: 104,
    backgroundColor: "rgba(10, 10, 10, 0.55)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    opacity: 1,
    blendMode: "normal",
  },
};

export const PremiumCursor: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<CursorMode>("default");

  const pointerX = useMotionValue(-120);
  const pointerY = useMotionValue(-120);

  const springX = useSpring(pointerX, {
    stiffness: 520,
    damping: 42,
    mass: 0.28,
  });

  const springY = useSpring(pointerY, {
    stiffness: 520,
    damping: 42,
    mass: 0.28,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(pointer: fine)");

    const syncCursorAvailability = () => {
      const nextEnabled = mediaQuery.matches;
      setIsEnabled(nextEnabled);
      document.body.classList.toggle("has-premium-cursor", nextEnabled);
    };

    syncCursorAvailability();
    mediaQuery.addEventListener("change", syncCursorAvailability);

    return () => {
      document.body.classList.remove("has-premium-cursor");
      mediaQuery.removeEventListener("change", syncCursorAvailability);
    };
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const handlePointerMove = (event: MouseEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
      setIsVisible((visible) => (visible ? visible : true));
    };

    // Mode resolution runs on over/out (rare) instead of every move (~120/s).
    const handlePointerOver = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-cursor-portfolio]")) {
        setMode("portfolio");
        return;
      }
      if (target?.closest("[data-cursor-magnetic]")) {
        setMode("magnetic");
        return;
      }
      setMode("default");
    };

    const handlePointerLeave = () => {
      setIsVisible(false);
      setMode("default");
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseover", handlePointerOver, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseover", handlePointerOver);
      document.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, [isEnabled, pointerX, pointerY]);

  if (!isEnabled) {
    return null;
  }

  const activeVariant = cursorVariants[mode];

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[120] hidden md:block"
      style={{
        x: springX,
        y: springY,
      }}
      animate={{
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        duration: 0.18,
        ease: "easeOut",
      }}
    >
      <motion.div
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border"

        style={{
          mixBlendMode: activeVariant.blendMode,
        }}
        animate={{
          width: activeVariant.size,
          height: activeVariant.size,
          backgroundColor: activeVariant.backgroundColor,
          borderColor: activeVariant.borderColor,
          opacity: activeVariant.opacity,
        }}
        transition={{
          type: "spring",
          stiffness: 240,
          damping: 24,
          mass: 0.45,
        }}
      >
        <motion.span
          className="pl-[0.32em] text-[8px] uppercase tracking-[0.32em] text-white/82"
          animate={{
            opacity: mode === "portfolio" ? 1 : 0,
            scale: mode === "portfolio" ? 1 : 0.86,
          }}
          transition={{
            duration: 0.18,
            ease: "easeOut",
          }}
        >
          View
        </motion.span>
      </motion.div>
    </motion.div>
  );
};
