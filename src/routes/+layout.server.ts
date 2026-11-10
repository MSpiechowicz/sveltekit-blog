import projects from '#lib/data/projects.json';
import type { ProjectsData } from '#lib/desktop/types.js';
import { getPostSummaries } from '#lib/server/posts.js';

export function load() {
	return {
		posts: getPostSummaries(),
		projects: projects satisfies ProjectsData,
	};
}
