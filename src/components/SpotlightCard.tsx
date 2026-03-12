import React, { useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '@/src/utils/cn';

type SpotlightCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  spotlightColor?: string;
  spotlightSize?: number;
};

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor = 'rgba(197, 160, 89, 0.18)',
  spotlightSize = 320,
  onMouseMove,
  onMouseLeave,
  ...props
}) => {
  const [isActive, setIsActive] = useState(false);
  const pointerX = useMotionValue(-spotlightSize);
  const pointerY = useMotionValue(-spotlightSize);

  const spotlight = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${pointerX}px ${pointerY}px, ${spotlightColor}, transparent 70%)`;
  const glow = useMotionTemplate`radial-gradient(${spotlightSize * 0.4}px circle at ${pointerX}px ${pointerY}px, rgba(255,255,255,0.08), transparent 72%)`;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(event.clientX - bounds.left);
    pointerY.set(event.clientY - bounds.top);
    setIsActive(true);
    onMouseMove?.(event);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsActive(false);
    onMouseLeave?.(event);
  };

  return (
    <div
      {...props}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] backdrop-blur-[1px]',
        className,
      )}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        animate={{
          opacity: isActive ? 1 : 0,
        }}
        style={{
          backgroundImage: spotlight,
        }}
        transition={{
          duration: 0.28,
          ease: 'easeOut',
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[1px] rounded-[calc(1.75rem-1px)]"
        animate={{
          opacity: isActive ? 1 : 0,
        }}
        style={{
          backgroundImage: glow,
        }}
        transition={{
          duration: 0.24,
          ease: 'easeOut',
        }}
      />

      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_22%,transparent_70%,rgba(255,255,255,0.03))]" />

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};
