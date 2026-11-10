import { articleMarkdown, getRawArticles } from '#lib/server/markdown.js';
import { getPostSummaries } from '#lib/server/posts.js';
import { SITE_URL, buildLlmsFullTxt } from '#lib/seo.js';

export function GET() {
	const bodies = new Map(
		[...getRawArticles()].map(([slug, source]) => [slug, articleMarkdown(source, SITE_URL)]),
	);

	return new Response(buildLlmsFullTxt(getPostSummaries(), bodies), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
