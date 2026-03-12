import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { cn } from '@/src/utils/cn';

type DistortionImageProps = {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
};

const DistortionCanvas = lazy(async () => {
  const module = await import('./DistortionCanvas');
  return { default: module.DistortionCanvas };
});

export const DistortionImage: React.FC<DistortionImageProps> = ({ src, alt, className, children }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');

    const syncInteractivity = () => {
      setIsInteractive(mediaQuery.matches);
    };

    syncInteractivity();
    mediaQuery.addEventListener('change', syncInteractivity);

    return () => {
      mediaQuery.removeEventListener('change', syncInteractivity);
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || isNearViewport || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setIsNearViewport(true);
        observer.disconnect();
      },
      {
        rootMargin: '240px 0px',
        threshold: 0.15,
      },
    );

    observer.observe(frame);

    return () => {
      observer.disconnect();
    };
  }, [isNearViewport]);

  return (
    <div ref={frameRef} className={cn('relative overflow-hidden', className)}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
      />

      {isInteractive && isNearViewport ? (
        <Suspense fallback={null}>
          <DistortionCanvas src={src} alt={alt} hoverTargetRef={frameRef} />
        </Suspense>
      ) : null}

      {children}
    </div>
  );
};
