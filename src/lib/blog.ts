import { getCollection, type CollectionEntry } from 'astro:content';
import { blogCategories } from '../content.config';

export type Post = CollectionEntry<'blog'>;
export type BlogCategory = (typeof blogCategories)[number];

export { blogCategories };

export const categoryLabels: Record<BlogCategory, string> = {
  emprender: 'Emprender',
  aprendizajes: 'Aprendizajes',
  opinion: 'Opinión',
  guias: 'Guías',
};

export const categoryDescriptions: Record<BlogCategory, string> = {
  emprender: 'Lo que voy aprendiendo al emprender en La Paz, Baja California Sur, México.',
  aprendizajes: 'Lecciones de vender, construir y entregar proyectos de principio a fin.',
  opinion: 'Lo que pienso de la tecnología, la IA y el marketing para negocios.',
  guias: 'Guías prácticas para mejorar las ventas, las redes y los procesos de tu negocio.',
};

export const blogPath = '/blog/';
export const postPath = (post: Post): string => `/blog/${post.id}/`;
export const categoryPath = (category: BlogCategory): string => `/blog/categoria/${category}/`;

/** Files starting with "_" (the content template) never get a route. */
const isRoutable = (post: Post): boolean => !post.id.startsWith('_');

/**
 * Published posts, newest first. In production builds drafts and posts dated
 * in the future are left out; `astro dev` shows everything except the template.
 */
export async function getPosts(): Promise<Post[]> {
  const now = Date.now();
  const posts = await getCollection('blog', (post) => {
    if (!isRoutable(post)) {
      return false;
    }
    if (import.meta.env.PROD) {
      return !post.data.draft && post.data.date.getTime() <= now;
    }
    return true;
  });
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Categories that have at least one published post, in the schema order. */
export function usedCategories(posts: Post[]): BlogCategory[] {
  return blogCategories.filter((category) => posts.some((post) => post.data.category === category));
}

/** Same category first (newest first), then the newest of the rest. */
export function relatedPosts(post: Post, posts: Post[], limit = 3): Post[] {
  const others = posts.filter((other) => other.id !== post.id);
  const sameCategory = others.filter((other) => other.data.category === post.data.category);
  const rest = others.filter((other) => other.data.category !== post.data.category);
  return [...sameCategory, ...rest].slice(0, limit);
}

/** Words of the body (frontmatter, MDX tags and Markdown symbols ignored). */
export function wordCount(body: string | undefined): number {
  const text = (body ?? '')
    .replace(/^---[\s\S]*?---/, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`[\]()-]/g, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

/** Minutes to read at ~200 words per minute. */
export const readingMinutes = (body: string | undefined): number => Math.max(1, Math.round(wordCount(body) / 200));

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Frontmatter dates are parsed as UTC midnight, so they are formatted in UTC. */
export const formatDate = (date: Date): string => dateFormatter.format(date);

export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
