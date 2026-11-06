import { join } from 'node:path';
import sharp from 'sharp';

/** Builds and `astro dev` run from the project root (bundled chunks move, so no import.meta.url). */
const publicDir = join(process.cwd(), 'public');
const cache = new Map<string, { width: number; height: number } | null>();

/** Absolute file path of a file served from public/ (e.g. "/blog/x/portada.webp"). */
export const publicFile = (path: string): string => join(publicDir, ...path.replace(/^\//, '').split('/'));

/**
 * Intrinsic size of an image in public/, read at build time so every <img>/<video>
 * gets width/height and reserves its space (no layout shift). Null if unreadable.
 */
export async function publicImageSize(path: string): Promise<{ width: number; height: number } | null> {
  if (cache.has(path)) {
    return cache.get(path) ?? null;
  }
  let size: { width: number; height: number } | null = null;
  try {
    const { width, height } = await sharp(publicFile(path)).metadata();
    size = width && height ? { width, height } : null;
  } catch {
    size = null;
  }
  cache.set(path, size);
  return size;
}
