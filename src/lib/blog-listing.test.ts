import { describe, expect, it } from 'vitest';

import { nextShown, selectPosts, takeBatch } from './blog-listing';
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

	it('orders by title without regard to case and keeps equal titles in source order', () => {
		const posts = [
			post('banana', '01-01-2025', 'first'),
			post('Cherry', '01-02-2025'),
			post('Apple', '01-03-2025'),
			post('Banana', '01-04-2025', 'second'),
			post('Undated apple'),
		];

		const names = selectPosts(posts, '', 'NAME').map((post) => post?.title);

		expect(names).toEqual(['Apple', 'banana', 'Banana', 'Cherry', 'Undated apple']);
		expect(posts.map((post) => post?.title)[0]).toBe('banana');
	});

	it('searches the whole collection whatever the order', () => {
		const posts = Array.from({ length: 25 }, (_, index) =>
			post(
				`Post ${index}`,
				`01-${String(index + 1).padStart(2, '0')}-2025`,
				index === 0 ? 'Hello World' : '',
			),
		);

		expect(selectPosts(posts, 'hello world', 'DESC').map((post) => post?.title)).toEqual([
			'Post 0',
		]);
		expect(selectPosts(posts, 'hello world', 'NAME').map((post) => post?.title)).toEqual([
			'Post 0',
		]);
	});
});

describe('takeBatch and nextShown', () => {
	const list = Array.from({ length: 23 }, (_, index) => index);

	it('lists the first rows and never more than exist', () => {
		expect(takeBatch(list, 10)).toEqual(list.slice(0, 10));
		expect(takeBatch(list, 99)).toEqual(list);
		expect(takeBatch(list, 0)).toEqual([]);
		expect(takeBatch(list, -3)).toEqual([]);
		expect(takeBatch([], 10)).toEqual([]);
	});

	it('grows by one batch at a time until the whole list is shown', () => {
		const steps: number[] = [];
		for (let shown = 0; steps.at(-1) !== list.length; shown = steps.at(-1)!) {
			steps.push(nextShown(list.length, shown));
		}

		expect(steps).toEqual([10, 20, 23]);
	});

	it('handles an empty list, an exact multiple and a custom size', () => {
		expect(nextShown(0, 0)).toBe(0);
		expect(nextShown(20, 10)).toBe(20);
		expect(nextShown(20, 20)).toBe(20);
		expect(nextShown(7, 0, 3)).toBe(3);
	});
});
