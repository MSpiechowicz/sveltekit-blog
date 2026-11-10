import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { THEMES, isThemeId } from './themes';

// The inline script in app.html restores the saved theme before first paint, so it keeps its own list.
function themesInHeadScript(): string[] {
	const html = readFileSync(fileURLToPath(new URL('../../app.html', import.meta.url)), 'utf8');
	const list = /var themes = \[([^\]]*)\]/.exec(html)?.[1] ?? '';

	return [...list.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

describe('theme list in the head script', () => {
	it('allows exactly the themes of the Special menu, in the same order', () => {
		const ids = themesInHeadScript();

		expect(ids.length).toBeGreaterThan(0);
		expect(ids).toEqual(THEMES.map((theme) => theme.id));
	});

	it('only restores ids that the app accepts', () => {
		expect(themesInHeadScript().every(isThemeId)).toBe(true);
	});
});
