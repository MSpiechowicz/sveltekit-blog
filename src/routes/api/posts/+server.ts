import type { Post } from '$lib/types';
import { json } from '@sveltejs/kit';
import { render } from 'svelte/server';

function getSanitizedHtml(html: string): string {
	return (
		html
			.replace(/<!--\[-->/g, '')
			.replace(/<!--\]-->/g, '')
			// SvelteKit does not properly provide the <br> tag
			.replace(/<br>/g, '<br/>')
	);
}

async function getPosts(): Promise<Post[]> {
	let posts: Post[] = [];

	const paths = import.meta.glob('/src/lib/blog/*.svx', { eager: true });

	for (const path in paths) {
		const file = paths[path];

		if (file && typeof file === 'object' && 'metadata' in file && 'default' in file) {
			const metadata = file.metadata as Omit<Post, 'content'>;

			// @ts-expect-error SvelteKit doesn't support the `render` function
			const { html } = render(file.default, { props: {} });

			const post = { ...metadata, content: getSanitizedHtml(html) } satisfies Post;

			posts.push(post);
		}
	}

	posts = posts.sort(
		(first, second) =>
			new Date(second?.date || Date.now()).getTime() -
			new Date(first?.date || Date.now()).getTime(),
	);

	return posts;
}

export async function GET() {
	const posts = await getPosts();
	return json(posts);
}
