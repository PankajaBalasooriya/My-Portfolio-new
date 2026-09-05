import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/content';
import { site } from '../lib/site';
import { url } from '../lib/url';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: `${site.name} — Writing`,
    description: site.description,
    site: context.site ?? site.name,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: [...post.data.tags],
      link: url(`/blog/${post.id}`),
    })),
  });
}
