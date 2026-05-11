import type { APIRoute } from 'astro'
import { getSortedPosts, getAllCategories, getAllTags } from '@/utils/content'
import { site } from '@/config.json'
import { getCollection } from 'astro:content'

export const GET: APIRoute = async () => {
  const posts = await getSortedPosts()
  const categories = await getAllCategories()
  const tags = await getAllTags()
  const specs = await getCollection('spec')

  const baseUrl = site.url.replace(/\/$/, '')
  const now = new Date().toISOString()

  const urls = [
    { loc: `${baseUrl}/`, lastmod: now, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/archives`, lastmod: now, changefreq: 'weekly', priority: '0.8' },
    { loc: `${baseUrl}/tags`, lastmod: now, changefreq: 'weekly', priority: '0.8' },
    ...posts.map((post) => ({
      loc: `${baseUrl}/posts/${post.slug}`,
      lastmod: post.data.lastMod?.toISOString() || post.data.date.toISOString(),
      changefreq: 'monthly',
      priority: '0.7',
    })),
    ...categories.map((category) => ({
      loc: `${baseUrl}/categories/${encodeURIComponent(category)}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.6',
    })),
    ...tags.map((tag) => ({
      loc: `${baseUrl}/tags/${encodeURIComponent(tag)}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.6',
    })),
    ...specs.map((spec) => ({
      loc: `${baseUrl}/${spec.slug}`,
      lastmod: now,
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
