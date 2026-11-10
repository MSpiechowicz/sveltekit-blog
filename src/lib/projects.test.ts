import { describe, expect, it } from 'vitest';

import projectsData from '#lib/data/projects.json';
import type { Project, ProjectsData } from '#lib/desktop/types.js';

import { filterProjects } from './projects.js';

const data: ProjectsData = projectsData;

function project(title: string, description = '', technologies: string[] = []): Project {
	return { title, description, technologies };
}

const projects = [
	project('Blog', 'Personal site and articles', ['SvelteKit', 'TypeScript']),
	project('Indexer', 'Searches documentation', ['Rust', 'SQLite']),
	project('Meter', 'Shows token usage', ['Bun']),
];

function titles(list: Project[]): string[] {
	return list.map(({ title }) => title);
}

describe('filterProjects', () => {
	it('matches title, description and technologies without regard to case', () => {
		expect(titles(filterProjects(projects, 'rust'))).toEqual(['Indexer']);
		expect(titles(filterProjects(projects, 'SVELTEKIT'))).toEqual(['Blog']);
		expect(titles(filterProjects(projects, 'token'))).toEqual(['Meter']);
		expect(titles(filterProjects(projects, 'METER'))).toEqual(['Meter']);
	});

	it('ignores surrounding whitespace in the query', () => {
		expect(titles(filterProjects(projects, '  bun  '))).toEqual(['Meter']);
	});

	it('returns every project for an empty or whitespace query', () => {
		expect(titles(filterProjects(projects, ''))).toEqual(titles(projects));
		expect(titles(filterProjects(projects, '   '))).toEqual(titles(projects));
	});

	it('returns nothing when no project matches', () => {
		expect(filterProjects(projects, 'cobol')).toEqual([]);
	});

	it('leaves the source list untouched', () => {
		const before = structuredClone(projects);

		filterProjects(projects, 'rust');
		filterProjects(projects, '');

		expect(projects).toEqual(before);
	});
});

describe('project data', () => {
	it('gives every project a title and a description', () => {
		for (const entry of data.projects) {
			expect(entry.title.trim(), entry.title).not.toBe('');
			expect(entry.description.trim(), entry.title).not.toBe('');
		}
	});

	it('links only to well-formed https URLs', () => {
		const links = data.projects.flatMap((entry) => [entry.github, entry.demo]);

		for (const link of links.filter((value) => value !== undefined)) {
			expect(URL.canParse(link), link).toBe(true);
			expect(new URL(link).protocol, link).toBe('https:');
		}
	});
});
