const contactPhoneDigits = '79153261910';
const contactPhoneDisplay = '+7 915 326-19-10';
const maxShareText = `Здравствуйте. Хочу обсудить ремонт. Телефон: ${contactPhoneDisplay}`;

export const messengerLinks = {
  phoneDisplay: contactPhoneDisplay,
  phoneHref: `tel:+${contactPhoneDigits}`,
  whatsapp: `https://wa.me/${contactPhoneDigits}`,
  telegram: `https://t.me/+${contactPhoneDigits}`,
  max: `https://max.ru/:share?text=${encodeURIComponent(maxShareText)}`,
};
