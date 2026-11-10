import type { ThemeId } from './types.js';

/** In the order the Special menu lists them: alphabetical by name. */
export const THEMES: { id: ThemeId; label: string }[] = [
	{ id: 'blueprint', label: 'Blueprint' },
	{ id: 'colour', label: 'Colour' },
	{ id: 'ink', label: 'Ink' },
	{ id: 'paper-blue', label: 'Paper + Blue' },
	{ id: 'paper-coral', label: 'Paper + Coral' },
	{ id: 'paper-ink', label: 'Paper + Ink' },
	{ id: 'paper', label: 'Paper + Yellow' },
	{ id: 'phosphor', label: 'Phosphor' },
	{ id: 'stone', label: 'Stone + Yellow' },
];

export const DEFAULT_THEME: ThemeId = 'paper-ink';

export function isThemeId(value: unknown): value is ThemeId {
	return typeof value === 'string' && THEMES.some((theme) => theme.id === value);
}
