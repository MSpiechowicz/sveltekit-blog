import type { Post } from '$lib/types';
import { json } from '@sveltejs/kit';
import { render } from 'svelte/server';

function getSlug(path: string) {
	return path
		.split('/')
		.at(-1)
		?.replace(/\.svx$/, '');
}

function getSanitizedHtml(html: string) {
	return (
		html
			.replace(/<!--\[-->/g, '')
			.replace(/<!--\]-->/g, '')
			// SvelteKit does not properly provide the <br> tag
			.replace(/<br>/g, '<br/>')
	);
}

async function getPosts() {
	let posts: Post[] = [];

	const paths = import.meta.glob('/src/lib/blog/*.svx', { eager: true });

	for (const path in paths) {
		const file = paths[path];

		const slug = getSlug(path);

		if (file && typeof file === 'object' && 'metadata' in file && 'default' in file && slug) {
			const metadata = file.metadata as Omit<Post, 'slug'>;

			// @ts-expect-error SvelteKit doesn't support the `render` function
			const { html } = render(file.default, { props: {} });

			const post = { ...metadata, content: getSanitizedHtml(html), slug } satisfies Post;

			posts.push(post);
		}
	}

	posts = posts.sort(
		(first, second) => new Date(second.date).getTime() - new Date(first.date).getTime()
	);

	return posts;
}

export async function GET() {
	const posts = await getPosts();
	return json(posts);
}
