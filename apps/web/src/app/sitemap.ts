import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const PAGES: readonly { path: string; changeFrequency: 'always' | 'daily' | 'weekly' | 'monthly'; priority: number }[] = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/membership/', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/academy/', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/events/', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/book/', changeFrequency: 'always', priority: 0.9 },
  { path: '/franchise/', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contact/', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about/', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/rules/', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faq/', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cancellation/', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy/', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/terms/', changeFrequency: 'monthly', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://thepavilionclub.com';
  return PAGES.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
