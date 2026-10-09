/**
 * Shared, language-independent facts. Source of truth: the current CVs
 * (cv-ai-*, cv-sr-*, cv-fullstack-es).
 */
export const SITE_URL = 'https://osmarlg.elroi.cloud';

export const person = {
  fullName: 'Osmar Alejandro Liera Gómez',
  shortName: 'Osmar Liera',
  email: 'lieragomezosmaralejandro@gmail.com',
  phoneDisplay: '+52 615 155 9659',
  phoneE164: '+526151559659',
  whatsappNumber: '5216151559659',
  city: 'La Paz',
  region: 'Baja California Sur',
  country: 'MX',
  image: `${SITE_URL}/images/osmar-liera-perfil.jpg`,
} as const;

export const whatsappHref = (message: string): string =>
  `https://wa.me/${person.whatsappNumber}?text=${encodeURIComponent(message)}`;
