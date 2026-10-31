import adapter from '@sveltejs/adapter-auto';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { defineConfig } from 'vitest/config';

const extensions = ['.svelte', '.svx', '.md'];

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			extensions,
			preprocess: [
				vitePreprocess(),
				mdsvex({
					extensions: ['.svx', '.md'],
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
