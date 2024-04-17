import config from '$lib/config';
import type { Post } from '$lib/types';

export async function GET({ fetch }) {
	const response = await fetch('api/posts');
	const posts: Post[] = await response.json();

	const headers = { 'Content-Type': 'application/xml' };

	const xml = `
  <rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
    <channel>
      <title>${config.title}</title>
      <description>${config.description}</description>
      <link>${config.url}</link>
      <atom:link href="${config.url}/rss.xml" rel="self" type="application/rss+xml"/>
      ${posts
				.map(
					(post) => `
          <item>
            <title><![CDATA[${post.title}]]></title>
            <description><![CDATA[${post.description}]]></description>
            <content:encoded><![CDATA[${post.content}]]></content:encoded>
            <link>${config.url}/blog/${post.slug}</link>
            <guid isPermaLink="true">${config.url}/blog/${post.slug}</guid>
            <pubDate>${new Date(post.date).toUTCString()}</pubDate>
          </item>
        `
				)
				.join('')}
    </channel>
  </rss>
	`.trim();

	return new Response(xml, { headers });
}
