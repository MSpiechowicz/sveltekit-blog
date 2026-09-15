import type { Post } from './types';

export type DateOrder = 'ASC' | 'DESC';
export const POSTS_PER_PAGE = 5;

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

export function selectPosts(posts: Post[], query: string, order: DateOrder): Post[] {
	const search = query.trim().toLowerCase();
	return posts
		.filter(
			(post) =>
				!search ||
				(post?.title ?? '').toLowerCase().includes(search) ||
				(post?.description ?? '').toLowerCase().includes(search),
		)
		.map((post) => ({ post, date: dateValue(post?.date) }))
		.sort((a, b) => {
			// Undated or invalid metadata stays last in either direction; ties stay stable.
			if (a.date === undefined) return b.date === undefined ? 0 : 1;
			if (b.date === undefined) return -1;
			return order === 'ASC' ? a.date - b.date : b.date - a.date;
		})
		.map(({ post }) => post);
}

export function paginatePosts(posts: Post[], requestedPage: number) {
	const pageCount = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
	const page = Math.max(1, Math.min(requestedPage, pageCount));
	return {
		page,
		pageCount,
		posts: posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE),
	};
}
