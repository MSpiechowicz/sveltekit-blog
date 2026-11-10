import projects from '#lib/data/projects.json';
import type { ProjectsData } from '#lib/desktop/types.js';
import { getPostSummaries } from '#lib/server/posts.js';
import { buildLlmsTxt } from '#lib/seo.js';

export function GET() {
	const { projects: list }: ProjectsData = projects;

	return new Response(buildLlmsTxt(getPostSummaries(), list), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
