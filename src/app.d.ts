// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Component } from 'svelte';
import type { PostSummary, ProjectsData } from '#lib/desktop/types.js';
import type { Post } from '#lib/types.js';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			posts: PostSummary[];
			projects: ProjectsData;
			/** Present only on article routes. */
			content?: Component;
			meta?: Post;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
