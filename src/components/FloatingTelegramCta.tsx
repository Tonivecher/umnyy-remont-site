import React from 'react';
import { MessengerLinks } from './MessengerLinks';

export const FloatingTelegramCta: React.FC = () => {
  return (
    <MessengerLinks
      tone="dark"
      layout="dock"
      showLabels={false}
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 md:bottom-8 md:left-auto md:right-8 md:translate-x-0"
    />
  );
};
