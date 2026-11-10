import type { Component } from 'svelte';
import type { Post } from '#lib/types.js';

export type WindowId = 'about' | 'blog' | 'post' | 'projects' | 'links' | 'term' | 'alert';

export type IconId = 'about' | 'blog' | 'projects' | 'term' | 'links' | 'trash';

export type ThemeId =
	| 'ink'
	| 'paper-ink'
	| 'paper-coral'
	| 'paper-blue'
	| 'stone'
	| 'paper'
	| 'phosphor'
	| 'colour'
	| 'blueprint';

export type MenuId = 'ms' | 'file' | 'edit' | 'view' | 'special' | 'scenes';

export type ListOrder = 'DESC' | 'ASC' | 'NAME';

export type SceneName = 'jog' | 'plane' | 'balloon' | 'flock' | 'ufo';

export type PostSummary = {
	slug: string;
	title: string;
	description: string;
	/** MM-DD-YYYY, exactly as written in the frontmatter. */
	date: string;
};

export type Project = {
	title: string;
	description: string;
	technologies: string[];
	github?: string;
	demo?: string;
};

export type ProjectsData = {
	intro: string;
	projects: Project[];
};

export type SceneHost = {
	play(name: SceneName): boolean;
	sunset(): void;
};

/** Pixel overrides only; an absent field means "use the component's default geometry". */
export type Geometry = {
	left?: number;
	top?: number;
	width?: number;
	height?: number;
};

export type Article = {
	meta: NonNullable<Post>;
	content: Component;
};
