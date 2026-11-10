<script
	module
	lang="ts">
	export type GlyphName = 'doc' | 'folder' | 'projects' | 'term' | 'link' | 'trash';
</script>

<script lang="ts">
	let { name }: { name: GlyphName } = $props();
</script>

<!--
	Line-art glyphs for the desktop icons and list rows. Size and colours come from the parent
	through CSS custom properties: --glyph-size, --glyph-fill, --glyph-stroke, --glyph-stroke-width.
-->
<svg
	class="glyph"
	viewBox="0 0 32 32"
	aria-hidden="true">
	{#if name === 'doc'}
		<path d="M7 3h13l6 6v20H7z" />
		<path
			d="M20 3v6h6M11 14h11M11 18h11M11 22h7"
			fill="none" />
	{:else if name === 'folder'}
		<path d="M3 8h10l3 3h13v16H3z" />
		<path
			d="M3 13h26"
			fill="none" />
	{:else if name === 'projects'}
		<path d="M8 4h8l3 3h10v13H8z" />
		<path d="M3 10h10l3 3h13v15H3z" />
		<path
			d="M3 15h26"
			fill="none" />
	{:else if name === 'term'}
		<rect
			x="3"
			y="5"
			width="26"
			height="20"
			rx="2" />
		<path
			d="M8 11l5 4-5 4M15 20h8M11 29h10M16 25v4"
			fill="none" />
	{:else if name === 'link'}
		<path d="M4 6h24v22H4z" />
		<path
			d="M11 22L21 12M13 12h8v8"
			fill="none" />
	{:else if name === 'trash'}
		<path d="M7 11h18v17H7z" />
		<path d="M4 7h24v4H4z" />
		<path
			d="M12 7V4h8v3M12 15v9M16 15v9M20 15v9"
			fill="none" />
	{/if}
</svg>

<style>
	.glyph {
		flex: none;
		width: var(--glyph-size, 20px);
		height: var(--glyph-size, 20px);
		fill: var(--glyph-fill, var(--w));
		stroke: var(--glyph-stroke, var(--k));
		stroke-width: var(--glyph-stroke-width, 2);
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
