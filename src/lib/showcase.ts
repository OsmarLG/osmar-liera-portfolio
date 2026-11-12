import manifest from '../data/showcase.json';

export interface ShowcaseVideo {
  src: string;
  poster: string;
  width: number;
  height: number;
  duration: number;
  bytes: number;
}

export interface ShowcaseImage {
  src: string;
  width: number;
  height: number;
  bytes: number;
}

const videos: Record<string, ShowcaseVideo> = manifest.videos;
const images: Record<string, ShowcaseImage> = manifest.images;

const missing = (kind: string, id: string): Error =>
  new Error(`Showcase ${kind} "${id}" is not in src/data/showcase.json. Run: node scripts/media/build-showcase.mjs`);

/** A video built by scripts/media/build-showcase.mjs. Fails the build if it does not exist. */
export function showcaseVideo(id: string): ShowcaseVideo {
  const video = videos[id];
  if (!video) {
    throw missing('video', id);
  }
  return video;
}

/** An image built by scripts/media/build-showcase.mjs. Fails the build if it does not exist. */
export function showcaseImage(id: string): ShowcaseImage {
  const image = images[id];
  if (!image) {
    throw missing('image', id);
  }
  return image;
}
