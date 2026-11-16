import type { Component } from 'svelte';

export type Categories = 'non-technical' | 'technical';

export type Post =
	| {
			title?: string;
			description?: string;
			image?: string;
			imageAlt?: string;
			content?: string;
			slug?: string;
			date?: string;
			/** MM-DD-YYYY of the last meaningful edit, when the article was revised. */
			updated?: string;
			categories?: Categories[];
	  }
	| undefined;

export type Data =
	| {
			content?: Component;
			meta: Post;
	  }
	| undefined;
