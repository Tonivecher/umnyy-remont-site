import React from 'react';
import { MessengerLinks } from './MessengerLinks';

export const FloatingTelegramCta: React.FC = () => {
  return (
    <MessengerLinks
      tone="dark"
      layout="dock"
      showLabels={false}
      className="fixed bottom-4 right-4 z-40 md:bottom-8 md:right-8"
    />
  );
};
