import type { ListOrder } from '#lib/desktop/types.js';

type Listable = { title?: string; description?: string; date?: string } | undefined;

export const BATCH_SIZE = 10;

function dateValue(date: string | undefined): number | undefined {
	if (!date || !/^\d{2}-\d{2}-\d{4}$/.test(date)) return undefined;
	const [month, day, year] = date.split('-').map(Number);
	const value = new Date(0);
	value.setUTCFullYear(year, month - 1, day);
	if (
		value.getUTCFullYear() !== year ||
		value.getUTCMonth() !== month - 1 ||
		value.getUTCDate() !== day
	)
		return undefined;
	return value.getTime();
}

function compareByDate(a: Listable, b: Listable, order: 'ASC' | 'DESC'): number {
	const first = dateValue(a?.date);
	const second = dateValue(b?.date);

	// Undated or invalid metadata stays last in either direction; ties stay stable.
	if (first === undefined) return second === undefined ? 0 : 1;
	if (second === undefined) return -1;

	return order === 'ASC' ? first - second : second - first;
}

function compareByName(a: Listable, b: Listable): number {
	return (a?.title ?? '').localeCompare(b?.title ?? '');
}

/** Filters by title and description (case-insensitive substring), then orders the matches. */
export function selectPosts<T extends Listable>(posts: T[], query: string, order: ListOrder): T[] {
	const search = query.trim().toLowerCase();

	return posts
		.filter(
			(post) =>
				!search ||
				(post?.title ?? '').toLowerCase().includes(search) ||
				(post?.description ?? '').toLowerCase().includes(search),
		)
		.sort((a, b) => (order === 'NAME' ? compareByName(a, b) : compareByDate(a, b, order)));
}

/** The first `shown` rows of the list; `shown` is clamped to the list and never negative. */
export function takeBatch<T>(list: T[], shown: number): T[] {
	return list.slice(0, Math.max(0, shown));
}

/** How many rows to show after the next batch is requested: one more batch, never past the end. */
export function nextShown(total: number, shown: number, size = BATCH_SIZE): number {
	return Math.min(total, Math.max(0, shown) + size);
}
