import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const blogCategories = ['emprender', 'aprendizajes', 'opinion', 'guias'] as const;

/**
 * Blog posts: src/content/blog/<slug>.mdx, media in public/blog/<slug>/.
 * Files starting with "_" (the content template) are validated but never routed.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(blogCategories),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    author: z.string().default('osmar'),
    cover: z.string().regex(/^\/blog\/[^/]+\/.+/, 'cover debe estar en /blog/<slug>/'),
    coverAlt: z.string(),
    tags: z.array(z.string()).max(5).optional(),
    service: z.string().optional(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});

export const collections = { blog };
