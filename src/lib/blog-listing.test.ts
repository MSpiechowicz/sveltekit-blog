import { describe, expect, it } from 'vitest';

import { paginatePosts, selectPosts } from './blog-listing';
import type { Post } from './types';

type BlogPost = Exclude<Post, undefined>;

function post(title: string, date?: string, description = ''): BlogPost {
	return { title, date, description };
}

describe('selectPosts', () => {
	it('filters title and description text literally without mutating the source collection', () => {
		const posts = [
			post('C++ notes', '01-02-2025'),
			post('Release notes', '01-01-2025', 'Includes the literal query .* for matching.'),
		];
		const originalTitles = posts.map(({ title }) => title);

		expect(selectPosts(posts, ' c++ ', 'DESC').map((post) => post?.title)).toEqual(['C++ notes']);
		expect(selectPosts(posts, '.*', 'DESC').map((post) => post?.title)).toEqual(['Release notes']);
		expect(posts.map(({ title }) => title)).toEqual(originalTitles);
	});

	it('sorts chronologically across year boundaries with stable ties and invalid dates last', () => {
		const posts = [
			post('Tie first', '01-01-2025'),
			post('Invalid', '02-30-2025'),
			post('Oldest', '12-31-2024'),
			post('Newest', '01-02-2025'),
			post('Tie second', '01-01-2025'),
			post('Missing date'),
		];

		expect(selectPosts(posts, '', 'ASC').map((post) => post?.title)).toEqual([
			'Oldest',
			'Tie first',
			'Tie second',
			'Newest',
			'Invalid',
			'Missing date',
		]);
		expect(selectPosts(posts, '', 'DESC').map((post) => post?.title)).toEqual([
			'Newest',
			'Tie first',
			'Tie second',
			'Oldest',
			'Invalid',
			'Missing date',
		]);
	});
});

describe('paginatePosts', () => {
	it('paginates the complete selected collection without duplicates or omissions', () => {
		const posts = Array.from({ length: 13 }, (_, index) =>
			post(
				`Post ${index + 1}`,
				`01-${String(index + 1).padStart(2, '0')}-2025`,
				'Collection match',
			),
		);
		const selected = selectPosts(posts, ' collection ', 'DESC');
		const pages = [1, 2, 3].map((page) => paginatePosts(selected, page));

		expect(pages.map(({ posts }) => posts.length)).toEqual([5, 5, 3]);
		expect(pages.flatMap(({ posts }) => posts.map((post) => post?.title))).toEqual(
			selected.map((post) => post?.title),
		);
	});

	it('handles exact, partial, empty, and out-of-range pages', () => {
		const posts = Array.from({ length: 6 }, (_, index) => post(`Post ${index + 1}`, '01-01-2025'));
		const fivePosts = paginatePosts(posts.slice(0, 5), 4);
		const sixPosts = paginatePosts(posts, 2);
		const noPosts = paginatePosts([], 8);

		expect(fivePosts).toMatchObject({ page: 1, pageCount: 1 });
		expect(fivePosts.posts).toHaveLength(5);
		expect(sixPosts).toMatchObject({ page: 2, pageCount: 2 });
		expect(sixPosts.posts).toHaveLength(1);
		expect(noPosts).toMatchObject({ page: 1, pageCount: 1, posts: [] });
	});
});
