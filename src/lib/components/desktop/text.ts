import translation from '#lib/translations/en-GB.json';

/** Looks up a UI string; an unknown key renders as itself so a missing translation is visible. */
export function t(key: string): string {
	return (translation as Record<string, string>)[key] ?? key;
}

/** Replaces {name} placeholders in a translated template. */
export function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, name: string) => {
		const value = values[name];

		return value === undefined ? match : String(value);
	});
}
