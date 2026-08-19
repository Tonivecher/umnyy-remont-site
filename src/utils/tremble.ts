// Randomizes the button "tremble" hover animation so no two hovers look alike.
// One delegated listener per page; only CSS custom properties are written, the
// animation itself stays in CSS (interruptible, transform-only).

const SELECTOR = ".premium-action, .btn-glass, .btn-glass-edge";

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const sign = () => (Math.random() < 0.5 ? -1 : 1);

export const initTremble = (): (() => void) => {
  if (typeof window === "undefined") return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (reduced || coarse) return () => {};

  const handleMouseOver = (event: MouseEvent) => {
    const target = event.target as Element | null;
    const button = target?.closest?.(SELECTOR) as HTMLElement | null;
    if (!button) return;

    // Skip re-randomizing while moving between children of the same button.
    const related = event.relatedTarget as Element | null;
    if (related && button.contains(related)) return;

    // Random direction with a slightly biased magnitude per axis.
    const angle = Math.random() * Math.PI * 2;
    const amplitude = rand(1.1, 2.5);

    button.style.setProperty("--tremble-x", `${(Math.cos(angle) * amplitude).toFixed(2)}px`);
    button.style.setProperty("--tremble-y", `${(Math.sin(angle) * amplitude).toFixed(2)}px`);
    button.style.setProperty("--tremble-rot", `${(sign() * rand(0.14, 0.5)).toFixed(2)}deg`);
    button.style.setProperty("--tremble-dur", `${rand(0.65, 0.95).toFixed(2)}s`);
  };

  document.addEventListener("mouseover", handleMouseOver, { passive: true });

  return () => document.removeEventListener("mouseover", handleMouseOver);
};
