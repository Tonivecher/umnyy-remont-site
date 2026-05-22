import React, { useEffect, useState } from 'react';
import { MessengerLinks } from './MessengerLinks';

export const FloatingTelegramCta: React.FC = () => {
  const [isPortfolioVisible, setIsPortfolioVisible] = useState(false);

  useEffect(() => {
    const portfolio = document.getElementById('portfolio');
    if (!portfolio) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPortfolioVisible(entry.isIntersecting),
      { rootMargin: '-25% 0px -25% 0px', threshold: 0.01 },
    );

    observer.observe(portfolio);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={[
        'fixed bottom-4 left-1/2 z-40 -translate-x-1/2 transition-all duration-500 md:bottom-8 md:left-auto md:right-8 md:translate-x-0',
        isPortfolioVisible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      ].join(' ')}
      aria-hidden={!isPortfolioVisible}
    >
      <MessengerLinks tone="dark" layout="dock" showLabels={false} />
    </div>
  );
};
