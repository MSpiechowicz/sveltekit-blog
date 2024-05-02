import translation from '$lib/translations/en-GB.json';
import type { Post } from '$lib/types';

export async function GET({ fetch }) {
	const response = await fetch('api/posts');
	const posts: Post[] = await response.json();

	const headers = { 'Content-Type': 'application/xml' };

	const xml = `
  <rss
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    version="2.0">
    <channel>
      <title>${translation.title}</title>
      <description>${translation.description}</description>
      <link>${translation.url}</link>
      <atom:link href="${translation.url}/rss.xml" rel="self" type="application/rss+xml"/>
      ${posts
				.map(
					(post) => `
          <item>
            <title><![CDATA[${post?.title}]]></title>
            <description><![CDATA[${post?.description}]]></description>
            <content:encoded><![CDATA[${post?.content}]]></content:encoded>
            <link>${translation.url}/blog/${post?.slug}</link>
            <guid isPermaLink="true">${translation.url}/blog/${post?.slug}</guid>
            <pubDate>${new Date(post?.date || Date.now()).toUTCString()}</pubDate>
          </item>
        `,
				)
				.join('')}
    </channel>
  </rss>
	`.trim();

	return new Response(xml, { headers });
}
