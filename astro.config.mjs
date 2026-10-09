// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * @param {string} pkg
 * @param {string} file
 */
const fontsource = (pkg, file) => `./node_modules/@fontsource-variable/${pkg}/files/${file}`;

/** Latin subset (covers Spanish and English). */
const latin = [
  'U+0000-00FF',
  'U+0131',
  'U+0152-0153',
  'U+02BB-02BC',
  'U+02C6',
  'U+02DA',
  'U+02DC',
  'U+0304',
  'U+0308',
  'U+0329',
  'U+2000-206F',
  'U+20AC',
  'U+2122',
  'U+2191',
  'U+2193',
  'U+2212',
  'U+2215',
  'U+FEFF',
  'U+FFFD',
];

export default defineConfig({
  site: 'https://osmarlg.elroi.cloud',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  devToolbar: {
    enabled: false,
  },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      lastmod: new Date(),
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es-MX',
          en: 'en',
        },
      },
    }),
  ],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-display',
      fallbacks: ['Arial Narrow', 'sans-serif'],
      options: {
        variants: [
          {
            src: [fontsource('bricolage-grotesque', 'bricolage-grotesque-latin-opsz-normal.woff2')],
            weight: '200 800',
            style: 'normal',
            unicodeRange: /** @type {[string, ...string[]]} */ (latin),
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Instrument Sans',
      cssVariable: '--font-body',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: [fontsource('instrument-sans', 'instrument-sans-latin-wght-normal.woff2')],
            weight: '400 700',
            style: 'normal',
            unicodeRange: /** @type {[string, ...string[]]} */ (latin),
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      fallbacks: ['monospace'],
      options: {
        variants: [
          {
            src: [fontsource('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')],
            weight: '100 800',
            style: 'normal',
            unicodeRange: /** @type {[string, ...string[]]} */ (latin),
          },
        ],
      },
    },
  ],
});
