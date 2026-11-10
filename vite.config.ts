import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { defineConfig } from 'vitest/config';

import {
	assertArticleFrontmatterBlock,
	parseArticleFrontmatter,
} from './src/lib/article-frontmatter.ts';

const extensions = ['.svelte', '.svx', '.md'];

/**
 * Runs before mdsvex. mdsvex silently renders a malformed frontmatter block as article text, which
 * would publish the `social` drafts, so the build stops here instead.
 */
const articleFrontmatterGuard = {
	name: 'article-frontmatter-guard',
	markup({ content, filename }: { content: string; filename?: string }) {
		if (filename && /\.(svx|md)$/.test(filename)) assertArticleFrontmatterBlock(content, filename);
	},
};

export default defineConfig({
	plugins: [
		sveltekit({
			extensions,
			preprocess: [
				vitePreprocess(),
				articleFrontmatterGuard,
				mdsvex({
					extensions: ['.svx', '.md'],
					frontmatter: { marker: '-', type: 'yaml', parse: parseArticleFrontmatter },
				}),
			],
			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter(),
		}),
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'scripts/**/*.{test,spec}.{js,ts}'],
	},
});
