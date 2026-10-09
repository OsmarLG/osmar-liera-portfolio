# Osmar Liera — Portfolio

Portafolio bilingüe de Osmar Liera, Applied AI Engineer · Backend / Full-Stack. Sitio estático hecho con [Astro](https://astro.build): todo el contenido llega en el HTML (sin depender de JavaScript), con islas mínimas de JS para menú, pestañas, visor de capturas y animaciones.

- Español (predeterminado): `/` y `/cv/`
- Inglés: `/en/` y `/en/cv/`

## Desarrollo

Requiere Node.js 22.12 o superior.

```bash
npm ci
npm run dev       # servidor de desarrollo
npm run build     # astro check + build estático en dist/
npm run preview   # sirve dist/
```

## Estructura

| Ruta | Qué contiene |
| --- | --- |
| `src/i18n/es.ts`, `src/i18n/en.ts` | Todo el texto del sitio y del CV en HTML, por idioma |
| `src/i18n/profile.ts` | Datos de contacto compartidos |
| `src/i18n/social.ts` | Redes sociales y ELROI Labs (hero, contacto, footer y JSON-LD `sameAs`) |
| `src/components/home/` | Secciones de la página principal |
| `src/components/cv/CvPage.astro` | Página del CV en HTML |
| `src/scripts/site.ts` | Menú, scroll-spy, pestañas WAI-ARIA y visor de capturas |
| `src/scripts/motion.ts` | GSAP + ScrollTrigger + Lenis; solo se carga sin `prefers-reduced-motion` |
| `src/assets/` | Foto y capturas (Astro genera AVIF/WebP con dimensiones) |
| `public/cv/` | PDFs vigentes del CV |
| `public/og/` | Imágenes Open Graph por idioma |

## Contenido

La fuente de verdad son los CVs vigentes (`cv-ai-*`, `cv-sr-*`, `cv-fullstack-es`). Antes de agregar una tecnología, cifra o logro, debe estar respaldado por un CV o por un proyecto real. Al actualizar un CV, copia el PDF nuevo a `public/cv/` con el mismo nombre.

Para agregar una red social, edita solo `src/i18n/social.ts`.

## Imágenes Open Graph

```bash
node scripts/generate-og.mjs
```

Usa Chrome en modo headless (ruta configurable con `CHROME_PATH`) y escribe `public/og/og-es.jpg` y `public/og/og-en.jpg`.

## Despliegue

Netlify con `netlify.toml`: `npm run build`, publica `dist/`, Node 22. Las cabeceras de seguridad y caché están en `public/_headers`.
