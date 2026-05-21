import React from 'react';
import { messengerLinks } from '../utils/messengerLinks';
import { cn } from '../utils/cn';

type MessengerLinksProps = {
  tone?: 'dark' | 'light';
  layout?: 'row' | 'stack' | 'dock';
  showLabels?: boolean;
  className?: string;
};

type MessengerIconProps = {
  className?: string;
};

const MaxIcon: React.FC<MessengerIconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M5.2 4.8h13.6A2.2 2.2 0 0 1 21 7v8.45a2.2 2.2 0 0 1-2.2 2.2h-4.88l-3.2 2.36a.72.72 0 0 1-1.15-.58v-1.78H5.2A2.2 2.2 0 0 1 3 15.45V7a2.2 2.2 0 0 1 2.2-2.2Zm2.63 4.05v5.5h1.45v-2.78l1.58 2.06h.33l1.58-2.06v2.78h1.45v-5.5h-1.32l-1.87 2.43-1.88-2.43H7.83Zm7.6 0 1.8 2.68-1.92 2.82h1.62l1.1-1.64 1.1 1.64h1.62l-1.92-2.82 1.8-2.68h-1.6l-1 1.5-1-1.5h-1.6Z"
    />
  </svg>
);

const WhatsAppIcon: React.FC<MessengerIconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M12.04 3.2a8.62 8.62 0 0 0-7.4 13.04L3.7 20.8l4.68-1.1a8.62 8.62 0 1 0 3.66-16.5Zm0 1.58a7.04 7.04 0 1 1-3.24 13.3l-.25-.13-2.78.65.58-2.72-.16-.27a7.04 7.04 0 0 1 5.85-10.83Zm-2.1 3.53c-.15-.34-.31-.35-.46-.36h-.4c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.72 0 1.01.74 1.99.84 2.13.1.13 1.43 2.29 3.53 3.12 1.75.7 2.1.56 2.48.52.38-.03 1.22-.5 1.4-.98.17-.48.17-.9.12-.98-.05-.09-.19-.14-.4-.24-.2-.1-1.22-.6-1.4-.67-.19-.07-.33-.1-.47.1-.13.2-.53.66-.65.8-.12.14-.24.15-.45.05-.2-.1-.87-.32-1.66-1.02-.61-.55-1.03-1.22-1.15-1.43-.12-.2-.01-.32.09-.42.09-.09.2-.24.31-.36.1-.12.14-.2.2-.34.07-.14.04-.26-.02-.36-.05-.1-.46-1.1-.64-1.51Z"
    />
  </svg>
);

const TelegramIcon: React.FC<MessengerIconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M20.74 4.73c.3-.13.63.12.56.45l-2.54 13.39c-.07.37-.51.53-.8.29l-4.04-3.34-2.16 2.08c-.25.24-.67.13-.77-.2l-.78-2.58-3.93-1.3c-.4-.13-.43-.69-.05-.86L20.74 4.73Zm-3.3 3.1-8.43 5.3 2.48.82 5.95-6.12Zm-5.2 6.93.36 1.2 1.02-.98 2.43-4.23-3.8 4.01Z"
    />
  </svg>
);

const messengers = [
  {
    id: 'max',
    label: 'MAX',
    href: messengerLinks.max,
    ariaLabel: 'Написать через MAX',
    icon: MaxIcon,
    brandClass:
      'border-transparent bg-[radial-gradient(136%_141%_at_100%_100%,#8d28c8_0%,#7c42fa_20%,#007aff_80%,#609ceb_100%)] text-white shadow-[0_14px_36px_rgba(0,122,255,0.32)] hover:brightness-110',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    href: messengerLinks.whatsapp,
    ariaLabel: 'Написать в WhatsApp',
    icon: WhatsAppIcon,
    brandClass:
      'border-transparent bg-[#25D366] text-white shadow-[0_14px_36px_rgba(37,211,102,0.28)] hover:bg-[#1ebe5d]',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    href: messengerLinks.telegram,
    ariaLabel: 'Написать в Telegram',
    icon: TelegramIcon,
    brandClass:
      'border-transparent bg-[#27A7E7] text-white shadow-[0_14px_36px_rgba(39,167,231,0.3)] hover:bg-[#229ed9]',
  },
];

export const MessengerLinks: React.FC<MessengerLinksProps> = ({
  tone = 'dark',
  layout = 'row',
  showLabels = true,
  className,
}) => {
  const isLight = tone === 'light';

  return (
    <div
      className={cn(
        'flex max-w-full gap-2.5',
        layout === 'stack' ? 'w-full flex-col' : 'items-center justify-center',
        layout === 'dock' && 'rounded-full border border-white/12 bg-brand-dark/85 p-2 shadow-2xl shadow-black/30 backdrop-blur-md',
        className,
      )}
      aria-label="Связаться в мессенджере"
    >
      {messengers.map(({ id, label, href, ariaLabel, icon: Icon, brandClass }) => (
        <a
          key={id}
          href={href}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'premium-action group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] transition-[filter,transform,box-shadow,background-color] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/80',
            layout === 'stack' ? 'w-full px-5 py-4' : 'h-12 px-4',
            layout === 'dock' && 'h-11 w-11 px-0',
            brandClass,
            isLight ? 'ring-1 ring-black/5' : 'ring-1 ring-white/10',
          )}
          aria-label={ariaLabel}
        >
          <Icon
            className={cn(
              layout === 'dock' ? 'h-5 w-5' : 'h-[18px] w-[18px]',
              'text-white',
            )}
          />
          {showLabels && layout !== 'dock' ? <span>{label}</span> : null}
        </a>
      ))}
    </div>
  );
};
