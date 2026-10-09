import type { Lang } from './types';

/**
 * Public profiles. A network added here shows up in the
 * hero, the contact section, the footer and the JSON-LD `sameAs` automatically.
 * `icon` must be one of the names supported by `components/Icon.astro`.
 */
export interface SocialProfile {
  id: string;
  network: string;
  handle: string;
  href: string;
  icon: 'github' | 'linkedin' | 'instagram' | 'globe';
  /** Accessible label per language. */
  label: Record<Lang, string>;
}

export const socialProfiles: SocialProfile[] = [
  {
    id: 'github',
    network: 'GitHub',
    handle: 'OsmarLG',
    href: 'https://github.com/OsmarLG',
    icon: 'github',
    label: { es: 'GitHub de Osmar Liera (OsmarLG)', en: 'Osmar Liera on GitHub (OsmarLG)' },
  },
  {
    id: 'linkedin',
    network: 'LinkedIn',
    handle: 'osmar-lg',
    href: 'https://linkedin.com/in/osmar-lg',
    icon: 'linkedin',
    label: { es: 'LinkedIn de Osmar Liera', en: 'Osmar Liera on LinkedIn' },
  },
  {
    id: 'instagram',
    network: 'Instagram',
    handle: '@soyosmarlg',
    href: 'https://www.instagram.com/soyosmarlg/',
    icon: 'instagram',
    label: { es: 'Instagram de Osmar Liera (@soyosmarlg)', en: 'Osmar Liera on Instagram (@soyosmarlg)' },
  },
];

/** ELROI Labs, Osmar's company (used in `worksFor` and as a link). */
export const company = {
  name: 'ELROI Labs',
  url: 'https://labs.elroi.cloud',
  domain: 'labs.elroi.cloud',
  sameAs: ['https://www.instagram.com/elroi.labs/'],
  instagram: { href: 'https://www.instagram.com/elroi.labs/', handle: '@elroi.labs' },
  label: { es: 'Sitio de ELROI Labs', en: 'ELROI Labs website' },
  instagramLabel: { es: 'Instagram de ELROI Labs (@elroi.labs)', en: 'ELROI Labs on Instagram (@elroi.labs)' },
} as const;
