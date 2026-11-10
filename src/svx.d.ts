// Articles are mdsvex files: a Svelte component plus the frontmatter as `metadata`.
declare module '*.svx' {
	export const metadata: Record<string, unknown>;

	const component: import('svelte').Component;

	export default component;
}
