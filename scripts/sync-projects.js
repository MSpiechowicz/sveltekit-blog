#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const OUTPUT_PATH = fileURLToPath(new URL('../src/lib/data/projects.json', import.meta.url));

class SyncError extends Error {
	constructor(message) {
		super(message);
		this.name = 'SyncError';
	}
}

function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireText(value, label) {
	if (typeof value !== 'string' || value.trim().length === 0) {
		throw new SyncError(`${label} must be a non-empty string.`);
	}

	return value;
}

function optionalHttpsUrl(value, label) {
	if (value === undefined) return undefined;

	requireText(value, label);

	let url;
	try {
		url = new URL(value);
	} catch {
		throw new SyncError(`${label} must be an https:// URL, got ${JSON.stringify(value)}.`);
	}

	if (url.protocol !== 'https:') {
		throw new SyncError(`${label} must be an https:// URL, got ${JSON.stringify(value)}.`);
	}

	return value;
}

function parseProject(project, index) {
	const label = `projects[${index}]`;

	if (!isPlainObject(project)) throw new SyncError(`${label} must be an object.`);

	const title = requireText(project.title, `${label}.title`);
	const description = requireText(project.description, `${label}.description`);

	if (!Array.isArray(project.technologies)) {
		throw new SyncError(`${label}.technologies must be an array of strings.`);
	}

	const technologies = project.technologies.map((technology, position) =>
		requireText(technology, `${label}.technologies[${position}]`),
	);

	const result = { title, description, technologies };

	const github = optionalHttpsUrl(project.github, `${label}.github`);
	if (github !== undefined) result.github = github;

	const demo = optionalHttpsUrl(project.demo, `${label}.demo`);
	if (demo !== undefined) result.demo = demo;

	return result;
}

export function parseProjects(cv) {
	if (!isPlainObject(cv) || !Array.isArray(cv.sections)) {
		throw new SyncError('The CV file must contain a "sections" array.');
	}

	const section = cv.sections.find((entry) => isPlainObject(entry) && entry.anchor === 'projects');
	if (!section) throw new SyncError('No section with anchor "projects" found in the CV file.');

	const intro = requireText(section.description, 'The projects section description');

	if (!Array.isArray(section.projects) || section.projects.length === 0) {
		throw new SyncError('The projects section must contain a non-empty "projects" array.');
	}

	return { intro, projects: section.projects.map(parseProject) };
}

async function main(argv) {
	const [inputPath, ...extra] = argv;

	if (!inputPath || extra.length > 0) {
		throw new SyncError('Usage: node scripts/sync-projects.js <path/to/cv.json>');
	}

	let source;
	try {
		source = readFileSync(resolve(inputPath), 'utf8');
	} catch (error) {
		throw new SyncError(`Cannot read ${inputPath}: ${error.message}`);
	}

	let cv;
	try {
		cv = JSON.parse(source);
	} catch (error) {
		throw new SyncError(`${inputPath} is not valid JSON: ${error.message}`);
	}

	const data = parseProjects(cv);

	// Format with the repository's Prettier config so `prettier --check` accepts the result.
	const config = await resolveConfig(OUTPUT_PATH);
	const json = await format(`${JSON.stringify(data, null, '\t')}\n`, {
		...config,
		filepath: OUTPUT_PATH,
	});
	writeFileSync(OUTPUT_PATH, json);

	console.log(`Wrote ${data.projects.length} projects to src/lib/data/projects.json`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		await main(process.argv.slice(2));
	} catch (error) {
		if (!(error instanceof SyncError)) throw error;

		console.error(`sync-projects: ${error.message}`);
		process.exit(1);
	}
}
