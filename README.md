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
| `src/components/showcase/` | `VideoReel`, `ReelRow`, `ServiceCard`, `CaseMedia`: piezas reales con caja de proporción fija |
| `src/scripts/showcase.ts` | Reproducción de los videos: solo en pantalla y, en la fila, solo el del centro |
| `src/scripts/site.ts` | Menú, scroll-spy, pestañas WAI-ARIA y visor de capturas |
| `src/scripts/motion.ts` | GSAP + ScrollTrigger + Lenis; solo se carga sin `prefers-reduced-motion` |
| `src/assets/` | Foto y capturas (Astro genera AVIF/WebP con dimensiones) |
| `public/cv/` | PDFs vigentes del CV |
| `public/og/` | Imágenes Open Graph por idioma |

## Contenido

La fuente de verdad son los CVs vigentes (`cv-ai-*`, `cv-sr-*`, `cv-fullstack-es`). Antes de agregar una tecnología, cifra o logro, debe estar respaldado por un CV o por un proyecto real. Al actualizar un CV, copia el PDF nuevo a `public/cv/` con el mismo nombre.

Para agregar una red social, edita solo `src/i18n/social.ts`.

## Piezas de la página principal (reels, carruseles, capturas)

```bash
node scripts/media/build-showcase.mjs          # genera lo que falta o cambió
node scripts/media/build-showcase.mjs --force  # regenera todo
node scripts/media/build-showcase.mjs --check  # solo revisa los límites de peso
```

Lee los originales de `SHOWCASE_SRC` (por defecto `C:/laragon/www/oscrm/operaciones`) sin modificarlos y escribe copias para web en `public/showcase/` más el manifiesto `src/data/showcase.json`, que usan los componentes de `src/components/showcase/`. Requiere `ffmpeg` y `ffprobe`. Límites: video 720×1280 H.264 sin audio de hasta 2.5 MB, póster WebP de hasta 60 KB, imagen WebP de hasta 250 KB. Para agregar una pieza, añádela a `REELS` o `IMAGES` en el script, córrelo y refiérela por su `id` en `src/i18n/es.ts`. Solo material propio o de demostración, sin datos privados.

## Imágenes Open Graph

```bash
node scripts/generate-og.mjs
```

Usa Chrome en modo headless (ruta configurable con `CHROME_PATH`) y escribe `public/og/og-es.jpg` y `public/og/og-en.jpg`.

## Despliegue

Netlify con `netlify.toml`: `npm run build`, publica `dist/`, Node 22. Las cabeceras de seguridad y caché están en `public/_headers`.
