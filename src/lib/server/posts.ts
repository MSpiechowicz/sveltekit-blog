import type { PostSummary } from '#lib/desktop/types.js';

type Metadata = Partial<Record<'slug' | 'title' | 'description' | 'date', unknown>>;

const modules = import.meta.glob<Metadata | undefined>('/src/lib/blog/*.svx', {
	eager: true,
	import: 'metadata',
});

function text(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

// Same MM-DD-YYYY parsing as blog-listing.ts: undefined for missing or impossible dates.
function dateValue(date: string): number | undefined {
	if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) return undefined;

	const [month, day, year] = date.split('-').map(Number);
	const value = new Date(0);
	value.setUTCFullYear(year, month - 1, day);

	if (
		value.getUTCFullYear() !== year ||
		value.getUTCMonth() !== month - 1 ||
		value.getUTCDate() !== day
	) {
		return undefined;
	}

	return value.getTime();
}

function slugFromPath(path: string): string {
	return path.slice(path.lastIndexOf('/') + 1).replace(/\.svx$/, '');
}

/** Newest first; undated or invalid entries stay last. Only the fields the desktop lists. */
export function getPostSummaries(): PostSummary[] {
	return Object.entries(modules)
		.map(([path, metadata]) => ({
			slug: text(metadata?.slug) || slugFromPath(path),
			title: text(metadata?.title),
			description: text(metadata?.description),
			date: text(metadata?.date),
		}))
		.map((summary) => ({ summary, time: dateValue(summary.date) }))
		.sort((a, b) => {
			if (a.time === undefined) return b.time === undefined ? 0 : 1;
			if (b.time === undefined) return -1;

			return b.time - a.time;
		})
		.map(({ summary }) => summary);
}
