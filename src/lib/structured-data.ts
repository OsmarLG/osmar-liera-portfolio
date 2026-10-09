import type { Dictionary } from '../i18n';
import { SITE_URL, person } from '../i18n/profile';
import { company, socialProfiles } from '../i18n/social';

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Builds the JSON-LD graph (WebSite + ProfilePage + Person) for a page.
 */
export function buildStructuredData(dict: Dictionary, pageUrl: string, pageName: string, description: string) {
  const isEs = dict.lang === 'es';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: `${SITE_URL}/`,
        name: 'Osmar Liera',
        inLanguage: ['es-MX', 'en'],
        publisher: { '@id': PERSON_ID },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${pageUrl}#profilepage`,
        url: pageUrl,
        name: pageName,
        description,
        inLanguage: dict.htmlLang,
        isPartOf: { '@id': WEBSITE_ID },
        mainEntity: { '@id': PERSON_ID },
        dateModified: '2026-10-09',
      },
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: person.fullName,
        alternateName: person.shortName,
        givenName: 'Osmar Alejandro',
        familyName: 'Liera Gómez',
        jobTitle: isEs
          ? ['Ingeniero de IA Aplicada (Applied AI Engineer)', 'Ingeniero Backend / Full-Stack']
          : ['Applied AI Engineer', 'Backend / Full-Stack Engineer'],
        description: dict.meta.homeDescription,
        url: `${SITE_URL}/`,
        image: person.image,
        email: `mailto:${person.email}`,
        telephone: person.phoneE164,
        address: {
          '@type': 'PostalAddress',
          addressLocality: person.city,
          addressRegion: person.region,
          addressCountry: person.country,
        },
        worksFor: [
          {
            '@type': 'Organization',
            name: company.name,
            url: company.url,
            sameAs: [...company.sameAs],
            founder: { '@id': PERSON_ID },
            address: { '@type': 'PostalAddress', addressLocality: 'La Paz', addressRegion: 'Baja California Sur', addressCountry: 'MX' },
          },
          { '@type': 'Organization', name: 'Tangramx' },
        ],
        hasOccupation: [
          { '@type': 'Occupation', name: isEs ? 'Fundador y líder técnico (ELROI Labs)' : 'Founder & Technical Lead (ELROI Labs)' },
          { '@type': 'Occupation', name: isEs ? 'Desarrollador Full-Stack (Tangramx)' : 'Full-Stack Developer (Tangramx)' },
          {
            '@type': 'Occupation',
            name: isEs
              ? 'Instructor de IA aplicada a negocios (Instituto Tecnológico de La Paz)'
              : 'Instructor, Applied AI for Business (Instituto Tecnológico de La Paz)',
          },
        ],
        alumniOf: {
          '@type': 'CollegeOrUniversity',
          name: 'Instituto Tecnológico de La Paz',
          address: { '@type': 'PostalAddress', addressLocality: 'La Paz', addressCountry: 'MX' },
        },
        knowsAbout: [
          'Applied AI',
          'LLM agents',
          'Model Context Protocol (MCP)',
          'Tool calling',
          'Structured outputs',
          'JSON Schema',
          'Human-in-the-loop',
          'LLM evaluation',
          'OpenAI Vision',
          'OCR',
          'Python',
          'FastAPI',
          'SQLAlchemy',
          'Laravel',
          'PHP',
          'React',
          'TypeScript',
          'REST APIs',
          'Shopify',
          'Magento',
          'WhatsApp messaging API',
          'Microsoft Azure',
          'SQL',
        ],
        knowsLanguage: [
          { '@type': 'Language', name: 'Spanish', alternateName: 'es' },
          { '@type': 'Language', name: 'English', alternateName: 'en' },
        ],
        sameAs: socialProfiles.map((profile) => profile.href),
      },
    ],
  };
}
