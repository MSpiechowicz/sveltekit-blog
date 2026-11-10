import { buildRobotsTxt } from '#lib/seo.js';

export function GET() {
	return new Response(buildRobotsTxt(), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
