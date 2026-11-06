import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { getPosts, type Post } from '../../../lib/blog';
import { publicFile } from '../../../lib/media';

/**
 * Share image of each post: its cover as a 1200 × 630 JPEG, the format every
 * network and messenger (WhatsApp included) previews reliably.
 */
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: Post };
  const image = await sharp(publicFile(post.data.cover))
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#05090d' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/jpeg' } });
};
