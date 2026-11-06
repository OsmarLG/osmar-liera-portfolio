import Callout from './Callout.astro';
import Figure from './Figure.astro';
import Reveal from './Reveal.astro';
import Video from './Video.astro';
import WhatsAppCta from './WhatsAppCta.astro';
import YouTube from './YouTube.astro';

/** Components every post can use without importing them (passed to <Content components>). */
export const mdxComponents = { Callout, Figure, Reveal, Video, WhatsAppCta, YouTube };
