import { parse as parseYaml } from 'yaml';

/**
 * Build-time checks for article frontmatter, used by vite.config.ts.
 *
 * Frontmatter becomes the `metadata` export of each compiled article, which is shipped to browsers
 * and returned by /api/posts. The `social` drafts are editorial copy for manual posting (see
 * AGENTS.md) and must never be published, so a mistake in the frontmatter has to fail the build
 * instead of reaching the site. scripts/social-post.js reads the .svx files directly.
 */

/** Every field an article may declare. Anything else is treated as a typo and fails the build. */
const KNOWN_FIELDS = new Set([
	'title',
	'description',
	'date',
	'slug',
	'image',
	'imageAlt',
	'categories',
	'social',
]);

const REQUIRED_TEXT_FIELDS = ['title', 'description', 'date', 'slug'];
const DATE_FORMAT = /^\d{2}-\d{2}-\d{4}$/;
const SLUG_FORMAT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
const FENCE = /^---[ \t]*$/;
const SOCIAL_KEYS = ['mastodon', 'x', 'linkedin'];

/** A line that looks like part of the social drafts, wherever it turns up. */
const DRAFT_LINE = /(?:^|\s)(?:social|mastodon|linkedin):(?:\s|$)/;

function fail(filename: string, problem: string): never {
	throw new Error(`${filename}: ${problem}`);
}

/**
 * Throws unless the article source starts with a frontmatter block that mdsvex will read the same
 * way this check does.
 *
 * mdsvex only opens a block on a line that is exactly `---` (after optional blank lines), and it
 * closes the block at the first later line that merely starts with `---`. Anything it does not
 * take as frontmatter is rendered as article text, which would publish the `social` drafts.
 */
export function assertArticleFrontmatterBlock(source: string, filename: string): void {
	const text = source.startsWith(BYTE_ORDER_MARK) ? source.slice(1) : source;
	const lines = text.split(/\r?\n/);
	const open = lines.findIndex((line) => line !== '');

	if (open === -1 || lines[open] !== '---') {
		fail(
			filename,
			'the article must start with a frontmatter block opened by a line that is exactly "---" ' +
				'(no indentation, no trailing spaces, three dashes).',
		);
	}

	const close = lines.findIndex((line, index) => index > open && line.startsWith('---'));

	if (close === -1) {
		fail(filename, 'the frontmatter block is never closed by a "---" line.');
	}

	if (!FENCE.test(lines[close])) {
		fail(
			filename,
			`line ${close + 1} starts with "---" inside the frontmatter block; mdsvex would end the ` +
				'block there. The closing line must be exactly "---".',
		);
	}

	const draftLine = lines.findIndex((line, index) => index > close && DRAFT_LINE.test(line));

	if (draftLine !== -1) {
		fail(
			filename,
			`line ${draftLine + 1} looks like social copy outside the frontmatter block, where it ` +
				'would be published as article text.',
		);
	}
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== '';
}

/** Text that swallowed the social drafts, e.g. `social:` indented under a folded description. */
function assertNoDraftText(name: string, value: unknown): void {
	if (typeof value === 'string' && DRAFT_LINE.test(value)) {
		throw new Error(
			`Article frontmatter field "${name}" contains social copy. Check the indentation of the ` +
				'"social" block.',
		);
	}
}

function assertSocialShape(value: unknown): void {
	const isMapping = typeof value === 'object' && value !== null && !Array.isArray(value);
	const entries = isMapping ? Object.entries(value) : [];
	const names = entries.map(([name]) => name).sort();

	const wellFormed =
		isMapping &&
		names.join() === [...SOCIAL_KEYS].sort().join() &&
		entries.every(([, text]) => isNonEmptyString(text));

	if (!wellFormed) {
		throw new Error(
			'Article frontmatter field "social" must hold exactly the non-empty texts "mastodon", "x" ' +
				'and "linkedin".',
		);
	}
}

/** Parses article frontmatter into the public metadata, without the `social` drafts. */
export function parseArticleFrontmatter(frontmatter: string): Record<string, unknown> {
	// Aliases could copy the social block into a public field, so they are not allowed.
	const data: unknown = parseYaml(frontmatter, { maxAliasCount: 0 });

	if (typeof data !== 'object' || data === null || Array.isArray(data)) {
		throw new Error('Article frontmatter must be a YAML mapping of fields.');
	}

	const fields = data as Record<string, unknown>;

	for (const name of Object.keys(fields)) {
		if (!KNOWN_FIELDS.has(name)) {
			throw new Error(
				`Unknown article frontmatter field "${name}". Known fields: ${[...KNOWN_FIELDS].join(', ')}.`,
			);
		}
	}

	for (const name of REQUIRED_TEXT_FIELDS) {
		const value = fields[name];

		if (typeof value !== 'string' || value.trim() === '') {
			throw new Error(`Article frontmatter field "${name}" must be a non-empty string.`);
		}
	}

	if (!DATE_FORMAT.test(fields.date as string)) {
		throw new Error('Article frontmatter field "date" must be written as MM-DD-YYYY.');
	}

	if (!SLUG_FORMAT.test(fields.slug as string)) {
		throw new Error(
			'Article frontmatter field "slug" must be lowercase words separated by hyphens.',
		);
	}

	for (const name of ['image', 'imageAlt']) {
		if (name in fields && !isNonEmptyString(fields[name])) {
			throw new Error(`Article frontmatter field "${name}" must be a non-empty string.`);
		}
	}

	if ('categories' in fields) {
		const categories = fields.categories;

		if (!Array.isArray(categories) || !categories.every(isNonEmptyString)) {
			throw new Error('Article frontmatter field "categories" must be a list of texts.');
		}

		categories.forEach((category) => assertNoDraftText('categories', category));
	}

	for (const name of [...REQUIRED_TEXT_FIELDS, 'image', 'imageAlt']) {
		assertNoDraftText(name, fields[name]);
	}

	if ('social' in fields) assertSocialShape(fields.social);

	const metadata = { ...fields };

	delete metadata.social;

	return metadata;
}
