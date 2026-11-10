import type { PostSummary, Project } from './types.js';

/** A run of text in the hidden file; `slug` turns it into a link to that blog post. */
export type Segment = { text: string; slug?: string };

export type Line = Segment[];

type Info = { name: string; subtitle: string };

const LABEL_WIDTH = 18;
const TOP_TECHNOLOGIES = 5;
const NO_VALUE = '-';

const TERMINAL_TRICKS = [
	'  fortune · cowsay <text> · vim · matrix · coffee · sudo · hello · do a barrel roll · exit',
	'  jog · plane · balloon · flock · ufo',
];
const DESKTOP_TRICKS = '  click the sun five times · drag an icon onto the Trash · Konami code';

type DatedPost = { post: PostSummary; year: number; time: number };

function plain(text: string): Line {
	return [{ text }];
}

function label(name: string): string {
	return `${name} `.padEnd(LABEL_WIDTH, '.') + ' ';
}

function row(name: string, value: string): Line {
	return plain(label(name) + value);
}

/** Parses the frontmatter date format (MM-DD-YYYY); null for anything that is not a real day. */
function parseDate(date: string): { year: number; time: number } | null {
	const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);
	if (!match) return null;

	const month = Number(match[1]);
	const day = Number(match[2]);
	const year = Number(match[3]);
	const time = Date.UTC(year, month - 1, day);
	const check = new Date(time);

	if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1) return null;
	if (check.getUTCDate() !== day) return null;

	return { year, time };
}

function datedPosts(posts: PostSummary[]): DatedPost[] {
	const dated: DatedPost[] = [];

	for (const post of posts) {
		const parsed = parseDate(post.date);

		if (parsed) dated.push({ post, ...parsed });
	}

	return dated;
}

function longDate(time: number): string {
	return new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(time);
}

/** Posts per year as "2026: 12 · 2025: 7", newest year first; years without posts are not listed. */
function yearBreakdown(dated: DatedPost[]): string {
	const perYear = new Map<number, number>();

	for (const { year } of dated) {
		perYear.set(year, (perYear.get(year) ?? 0) + 1);
	}

	return [...perYear]
		.sort(([a], [b]) => b - a)
		.map(([year, count]) => `${year}: ${count}`)
		.join(' · ');
}

function postsValue(posts: PostSummary[]): string {
	const breakdown = yearBreakdown(datedPosts(posts));

	return breakdown ? `${posts.length}  (${breakdown})` : String(posts.length);
}

/** The earliest or latest dated post; when dates tie, the one listed first wins. */
function pickEntry(dated: DatedPost[], pick: 'first' | 'latest'): DatedPost | null {
	let chosen: DatedPost | null = null;

	for (const candidate of dated) {
		if (chosen === null) {
			chosen = candidate;
		} else if (pick === 'first' ? candidate.time < chosen.time : candidate.time > chosen.time) {
			chosen = candidate;
		}
	}

	return chosen;
}

function entryRow(name: string, entry: DatedPost | null): Line {
	if (entry === null) return row(name, NO_VALUE);

	const { post, time } = entry;
	const title: Segment = post.slug ? { text: post.title, slug: post.slug } : { text: post.title };

	return [{ text: label(name) }, title, { text: `, ${longDate(time)}` }];
}

function projectsValue(projects: Project[]): string {
	const withSource = projects.filter((project) => project.github).length;
	const withDemo = projects.filter((project) => project.demo).length;

	return `${projects.length}  (${withSource} with source, ${withDemo} with a live demo)`;
}

/** Code-unit order, case-insensitive first, so the result never depends on the locale. */
function compareNames(a: string, b: string): number {
	const lowerA = a.toLowerCase();
	const lowerB = b.toLowerCase();

	if (lowerA !== lowerB) return lowerA < lowerB ? -1 : 1;
	if (a === b) return 0;

	return a < b ? -1 : 1;
}

/** The most used technologies, most used first; equal counts are ordered alphabetically. */
function topTechnologies(projects: Project[]): string {
	const counts = new Map<string, number>();

	for (const project of projects) {
		for (const technology of project.technologies) {
			counts.set(technology, (counts.get(technology) ?? 0) + 1);
		}
	}

	const ranked = [...counts].sort(([nameA, countA], [nameB, countB]) => {
		if (countA !== countB) return countB - countA;

		return compareNames(nameA, nameB);
	});

	if (ranked.length === 0) return NO_VALUE;

	return ranked
		.slice(0, TOP_TECHNOLOGIES)
		.map(([name, count]) => `${name} ×${count}`)
		.join(' · ');
}

/**
 * The lines of the hidden file, computed from the real posts and projects. A line is a list of
 * segments so that post titles can be links.
 */
export function hiddenFileLines(posts: PostSummary[], projects: Project[], info: Info): Line[] {
	const dated = datedPosts(posts);

	return [
		plain('> π'),
		plain('> BACKDOOR ACCEPTED'),
		plain('> OPENING HIDDEN FILE …'),
		plain(''),
		row('SUBJECT', info.name),
		row('ROLE', info.subtitle),
		row('POSTS ON DISK', postsValue(posts)),
		entryRow('FIRST ENTRY', pickEntry(dated, 'first')),
		entryRow('LATEST ENTRY', pickEntry(dated, 'latest')),
		row('PROJECTS', projectsValue(projects)),
		row('MOST USED', topTechnologies(projects)),
		plain(''),
		plain('UNLISTED TERMINAL COMMANDS'),
		...TERMINAL_TRICKS.map(plain),
		plain(''),
		plain('UNLISTED DESKTOP TRICKS'),
		plain(DESKTOP_TRICKS),
		plain(''),
		plain('> END OF FILE. PRESS ESC TO LOG OUT.'),
	];
}
