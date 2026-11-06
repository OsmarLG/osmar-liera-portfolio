import { SITE_URL, person } from '../i18n/profile';
import { socialProfiles } from '../i18n/social';
import { blogPath, categoryLabels, categoryPath, isoDate, postPath, type BlogCategory, type Post } from './blog';
import { PERSON_ID, WEBSITE_ID } from './structured-data';

const BLOG_ID = `${SITE_URL}${blogPath}#blog`;
const abs = (path: string): string => new URL(path, SITE_URL).href;

/** Compact Person node so every blog page carries the author without the full CV graph. */
const personNode = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: person.fullName,
  alternateName: person.shortName,
  url: `${SITE_URL}/`,
  image: person.image,
  jobTitle: 'Consultor en marketing y tecnología',
  address: {
    '@type': 'PostalAddress',
    addressLocality: person.city,
    addressRegion: person.region,
    addressCountry: person.country,
  },
  sameAs: socialProfiles.map((profile) => profile.href),
};

const websiteNode = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: 'Osmar Liera',
  inLanguage: ['es-MX', 'en'],
  publisher: { '@id': PERSON_ID },
};

const blogNode = {
  '@type': 'Blog',
  '@id': BLOG_ID,
  url: abs(blogPath),
  name: 'Blog de Osmar Liera',
  inLanguage: 'es-MX',
  author: { '@id': PERSON_ID },
  publisher: { '@id': PERSON_ID },
  isPartOf: { '@id': WEBSITE_ID },
};

const crumbs = (items: { name: string; path: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: abs(item.path),
  })),
});

/** /blog/ and /blog/categoria/<category>/: Blog + CollectionPage + ItemList + BreadcrumbList. */
export function buildBlogListData(posts: Post[], page: { path: string; name: string; description: string; category?: BlogCategory }) {
  const trail = [
    { name: 'Inicio', path: '/' },
    { name: 'Blog', path: blogPath },
    ...(page.category ? [{ name: categoryLabels[page.category], path: categoryPath(page.category) }] : []),
  ];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      websiteNode,
      personNode,
      { ...blogNode, blogPost: posts.map((post) => ({ '@id': `${abs(postPath(post))}#article` })) },
      {
        '@type': 'CollectionPage',
        '@id': `${abs(page.path)}#page`,
        url: abs(page.path),
        name: page.name,
        description: page.description,
        inLanguage: 'es-MX',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': BLOG_ID },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: posts.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: abs(postPath(post)),
            name: post.data.title,
          })),
        },
        breadcrumb: crumbs(trail),
      },
    ],
  };
}

/** Article page: BlogPosting + BreadcrumbList (+ FAQPage when the post has an faq). */
export function buildPostData(post: Post, ogImageUrl: string, wordCount: number) {
  const url = abs(postPath(post));
  const { title, description, category, date, updated, cover, tags, faq } = post.data;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      websiteNode,
      personNode,
      blogNode,
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        url,
        mainEntityOfPage: url,
        headline: title,
        description,
        image: [abs(cover), ogImageUrl],
        datePublished: isoDate(date),
        dateModified: isoDate(updated ?? date),
        inLanguage: 'es-MX',
        articleSection: categoryLabels[category],
        keywords: tags?.join(', '),
        wordCount,
        author: { '@id': PERSON_ID },
        publisher: { '@id': PERSON_ID },
        isPartOf: { '@id': BLOG_ID },
      },
      crumbs([
        { name: 'Inicio', path: '/' },
        { name: 'Blog', path: blogPath },
        { name: categoryLabels[category], path: categoryPath(category) },
        { name: title, path: postPath(post) },
      ]),
      ...(faq && faq.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${url}#faq`,
              mainEntity: faq.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            },
          ]
        : []),
    ],
  };
}
