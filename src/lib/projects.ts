import type { Project } from '#lib/desktop/types.js';

/** Projects whose title, description or technologies contain the query (case-insensitive). */
export function filterProjects(projects: Project[], query: string): Project[] {
	const needle = query.trim().toLowerCase();
	if (!needle) return [...projects];

	return projects.filter((project) => {
		const haystack = [project.title, project.description, ...project.technologies];

		return haystack.some((text) => text.toLowerCase().includes(needle));
	});
}
