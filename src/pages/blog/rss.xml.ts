import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/profile';
import { categoryLabels, getPosts, postPath } from '../../lib/blog';

export const GET: APIRoute = async (context) => {
  const posts = await getPosts();
  return rss({
    title: 'Blog de Osmar Liera',
    description: 'Emprender, marketing, tiendas en línea, automatización e IA para negocios, desde La Paz, Baja California Sur, México.',
    site: context.site ?? SITE_URL,
    trailingSlash: true,
    customData: '<language>es-MX</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postPath(post),
      categories: [categoryLabels[post.data.category], ...(post.data.tags ?? [])],
      author: 'Osmar Liera',
    })),
  });
};
