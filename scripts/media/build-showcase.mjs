#!/usr/bin/env node
/**
 * Showcase media pipeline: turns the original pieces (reels, carousels, screenshots)
 * into web-ready copies under public/showcase/ and writes src/data/showcase.json,
 * the manifest the home components read (paths, sizes, bytes).
 *
 *   node scripts/media/build-showcase.mjs            # builds only what is missing or stale
 *   node scripts/media/build-showcase.mjs --force    # rebuilds everything
 *   node scripts/media/build-showcase.mjs --check    # only verifies budgets, builds nothing
 *
 * Sources are read from SHOWCASE_SRC (default C:/laragon/www/oscrm/operaciones) and are
 * NEVER modified: every output is a new file. Requires ffmpeg and ffprobe on PATH; images
 * use sharp (already a dependency of the site).
 *
 * Budgets (the script fails if one is exceeded):
 *   - video:  720x1280 H.264 (yuv420p, +faststart, no audio), <= 2.5 MB
 *   - poster: WebP 540x960, <= 60 KB
 *   - image:  WebP, <= 250 KB
 *
 * To add a piece: add an entry to REELS or IMAGES below and run the script. An output is
 * rebuilt when it is missing or older than its source, so re-running is cheap.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = process.env.SHOWCASE_SRC ?? 'C:/laragon/www/oscrm/operaciones';
const OUT = join(root, 'public', 'showcase');
const MANIFEST = join(root, 'src', 'data', 'showcase.json');

const force = process.argv.includes('--force');
const checkOnly = process.argv.includes('--check');

const VIDEO = { width: 720, height: 1280, maxBytes: 2.5 * 1024 * 1024, crf: [27, 29, 31, 33, 35, 37] };
const POSTER = { width: 540, height: 960, maxBytes: 60 * 1024 };
const IMAGE_MAX_BYTES = 250 * 1024;

const soy = 'estudio-video/renders/soyosmarlg';
const elroi = 'material/elroi-labs/entregables/jpg';
const disenos = 'marca-personal/disenos';
const capturas = 'material/portafolio/capturas';

/** Reels: `posterAt` is the second whose frame becomes the poster (after the intro animation). */
const REELS = [
  { id: 'reel-ofertas-buen-fin', src: `${soy}/reel-ofertas-buen-fin.mp4`, posterAt: 1.5 },
  { id: 'reel-medir-buen-fin', src: `${soy}/reel-medir-buen-fin.mp4`, posterAt: 1.5 },
  { id: 'reel-pagina-o-instagram', src: `${soy}/reel-pagina-o-instagram.mp4`, posterAt: 1.5 },
  { id: 'reel-tienda-no-vende', src: `${soy}/reel-tienda-no-vende.mp4`, posterAt: 1.5 },
  { id: 'reel-recordatorios-whatsapp', src: `${soy}/reel-recordatorios-whatsapp.mp4`, posterAt: 1.5 },
  { id: 'reel-ia-3-usos', src: `${soy}/reel-ia-3-usos.mp4`, posterAt: 1.5 },
  { id: 'reel-ideas-ia-5-min', src: `${soy}/reel-ideas-ia-5-min.mp4`, posterAt: 1.5 },
  { id: 'reel-fotos-producto-celular', src: `${soy}/reel-fotos-producto-celular.mp4`, posterAt: 1.5 },
  { id: 'reel-diagnosticos-enero', src: `${soy}/reel-diagnosticos-enero.mp4`, posterAt: 1.5 },
  { id: 'elroi-en-30-segundos', src: `${elroi}/reel-elroi-30s.mp4`, posterAt: 3.5 },
  { id: 'elroi-bot-whatsapp', src: `${elroi}/reel-bot-whatsapp.mp4`, posterAt: 8 },
];

/**
 * Images: resized to `width` (never enlarged). `crop` keeps a top-anchored box of that
 * aspect ratio (width / height) before resizing, for tall phone screenshots.
 */
const IMAGES = [
  { id: 'carrusel-servicios', src: `${disenos}/2026-10-09-carrusel-servicios/2026-10-09-carrusel-servicios-01.jpg`, width: 720 },
  { id: 'carrusel-errores', src: `${disenos}/2026-10-14-carrusel-errores/2026-10-14-carrusel-errores-01.jpg`, width: 720 },
  { id: 'carrusel-metricas', src: `${disenos}/2026-10-19-carrusel-metricas/2026-10-19-carrusel-metricas-01.jpg`, width: 720 },
  { id: 'carrusel-giros', src: `${disenos}/2026-10-28-carrusel-giros/2026-10-28-carrusel-giros-01.jpg`, width: 720 },
  { id: 'web-labs-movil', src: `${capturas}/paginas/labs-movil.png`, width: 720, crop: 9 / 16 },
  { id: 'sistema-cotizador-movil', src: `${capturas}/paginas/cotizador-movil.png`, width: 720, crop: 9 / 16 },
  { id: 'crm-pipeline', src: `${capturas}/crm-pipeline.jpg`, width: 1366 },
  { id: 'crm-tareas', src: `${capturas}/crm-tareas.jpg`, width: 1366 },
];

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const run = (bin, args) => execFileSync(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });

function source(path) {
  const file = join(SRC, path);
  if (!existsSync(file)) {
    throw new Error(`Source not found: ${file} (set SHOWCASE_SRC to the folder that holds the originals)`);
  }
  return file;
}

/** True when the output is missing or older than its source (or --force). */
function stale(out, src) {
  return force || !existsSync(out) || statSync(out).mtimeMs < statSync(src).mtimeMs;
}

function buildVideo(src, out) {
  for (const crf of VIDEO.crf) {
    run('ffmpeg', [
      '-v', 'error', '-y', '-i', src,
      '-an',
      '-vf', `scale=${VIDEO.width}:${VIDEO.height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${VIDEO.width}:${VIDEO.height},fps=30`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf),
      '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      out,
    ]);
    if (statSync(out).size <= VIDEO.maxBytes) {
      return crf;
    }
  }
  throw new Error(`${out} is over ${mb(VIDEO.maxBytes)} even at CRF ${VIDEO.crf.at(-1)}`);
}

async function buildPoster(src, out, at) {
  const frame = run('ffmpeg', ['-v', 'error', '-ss', String(at), '-i', src, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-']);
  for (const quality of [78, 70, 62, 54, 46, 38]) {
    await sharp(frame).resize(POSTER.width, POSTER.height, { fit: 'cover' }).webp({ quality, effort: 6 }).toFile(out);
    if (statSync(out).size <= POSTER.maxBytes) {
      return;
    }
  }
  throw new Error(`${out} is over ${kb(POSTER.maxBytes)}`);
}

async function buildImage(item, src, out) {
  const meta = await sharp(src).metadata();
  let pipeline = sharp(src);
  if (item.crop) {
    const height = Math.min(meta.height, Math.round(meta.width / item.crop));
    pipeline = pipeline.extract({ left: 0, top: 0, width: meta.width, height });
  }
  pipeline = pipeline.resize({ width: item.width, withoutEnlargement: true });
  for (const quality of [84, 78, 72, 66, 60, 52]) {
    await pipeline.clone().webp({ quality, effort: 6 }).toFile(out);
    if (statSync(out).size <= IMAGE_MAX_BYTES) {
      return;
    }
  }
  throw new Error(`${out} is over ${kb(IMAGE_MAX_BYTES)}`);
}

function duration(file) {
  const text = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString();
  return Math.round(Number(text.trim()) * 10) / 10;
}

const manifest = { videos: {}, images: {} };
const expected = new Set();
let total = 0;

if (!checkOnly) {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(dirname(MANIFEST), { recursive: true });
}

for (const reel of REELS) {
  const video = join(OUT, `${reel.id}.mp4`);
  const poster = join(OUT, `${reel.id}.webp`);
  expected.add(`${reel.id}.mp4`).add(`${reel.id}.webp`);
  if (!checkOnly) {
    const src = source(reel.src);
    if (stale(video, src)) {
      const crf = buildVideo(src, video);
      console.log(`video   ${reel.id}.mp4  ${mb(statSync(video).size)}  (crf ${crf})`);
    }
    if (stale(poster, src)) {
      await buildPoster(src, poster, reel.posterAt);
      console.log(`poster  ${reel.id}.webp  ${kb(statSync(poster).size)}`);
    }
  }
  const bytes = statSync(video).size;
  const posterBytes = statSync(poster).size;
  if (bytes > VIDEO.maxBytes || posterBytes > POSTER.maxBytes) {
    throw new Error(`${reel.id} is over budget (${mb(bytes)}, poster ${kb(posterBytes)})`);
  }
  total += bytes + posterBytes;
  manifest.videos[reel.id] = {
    src: `/showcase/${reel.id}.mp4`,
    poster: `/showcase/${reel.id}.webp`,
    width: VIDEO.width,
    height: VIDEO.height,
    duration: duration(video),
    bytes,
  };
}

for (const image of IMAGES) {
  const out = join(OUT, `${image.id}.webp`);
  expected.add(`${image.id}.webp`);
  if (!checkOnly) {
    const src = source(image.src);
    if (stale(out, src)) {
      await buildImage(image, src, out);
      console.log(`image   ${image.id}.webp  ${kb(statSync(out).size)}`);
    }
  }
  const bytes = statSync(out).size;
  if (bytes > IMAGE_MAX_BYTES) {
    throw new Error(`${image.id}.webp is over budget (${kb(bytes)})`);
  }
  const { width, height } = await sharp(out).metadata();
  total += bytes;
  manifest.images[image.id] = { src: `/showcase/${image.id}.webp`, width, height, bytes };
}

if (!checkOnly) {
  // Drop outputs of pieces that were removed from the lists, so nothing stale ships.
  for (const file of readdirSync(OUT)) {
    if (!expected.has(file)) {
      rmSync(join(OUT, file));
      console.log(`removed ${file}`);
    }
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(`showcase: ${REELS.length} videos, ${IMAGES.length} images, ${mb(total)} in public/showcase/`);
