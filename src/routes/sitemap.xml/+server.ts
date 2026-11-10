import { getPostSummaries } from '#lib/server/posts.js';
import { buildSitemapXml } from '#lib/seo.js';

export function GET() {
	return new Response(buildSitemapXml(getPostSummaries()), {
		headers: { 'Content-Type': 'application/xml' },
	});
}
