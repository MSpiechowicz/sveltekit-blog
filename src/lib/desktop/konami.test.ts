import { describe, expect, it } from 'vitest';

import { createKonami } from './konami';

const CODE = [
	'ArrowUp',
	'ArrowUp',
	'ArrowDown',
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'ArrowLeft',
	'ArrowRight',
	'b',
	'a',
];

function press(matcher: (key: string) => boolean, keys: string[]): boolean[] {
	return keys.map((key) => matcher(key));
}

describe('createKonami', () => {
	it('completes on the last key of the code and not before', () => {
		const results = press(createKonami(), CODE);

		expect(results.slice(0, -1).every((done) => !done)).toBe(true);
		expect(results.at(-1)).toBe(true);
	});

	it('accepts the letters in either case', () => {
		const results = press(createKonami(), [...CODE.slice(0, 8), 'B', 'A']);

		expect(results.at(-1)).toBe(true);
	});

	it('ignores a Shift press between the arrows and a capital letter', () => {
		const results = press(createKonami(), [...CODE.slice(0, 8), 'Shift', 'B', 'A']);

		expect(results.at(-1)).toBe(true);
	});

	it('starts over after a wrong key', () => {
		const matcher = createKonami();

		press(matcher, CODE.slice(0, 6));
		matcher('x');

		expect(press(matcher, CODE.slice(6)).some(Boolean)).toBe(false);
		expect(press(matcher, CODE).at(-1)).toBe(true);
	});

	it('lets an arrow up begin a new attempt in the middle of a failed one', () => {
		const results = press(createKonami(), ['ArrowUp', 'ArrowUp', 'ArrowDown', 'x', ...CODE]);

		expect(results.at(-1)).toBe(true);
		expect(results.slice(0, -1).some(Boolean)).toBe(false);
	});

	it('restarts on a stray arrow up that follows a partial sequence', () => {
		const results = press(createKonami(), [
			'ArrowUp',
			'ArrowUp',
			'ArrowDown',
			'ArrowUp',
			...CODE.slice(1),
		]);

		expect(results.at(-1)).toBe(true);
	});

	it('completes again when the code is repeated', () => {
		const matcher = createKonami();

		expect(press(matcher, CODE).at(-1)).toBe(true);
		expect(press(matcher, CODE).at(-1)).toBe(true);
	});

	it('does not complete on a trailing key after the code', () => {
		const matcher = createKonami();

		press(matcher, CODE);

		expect(matcher('a')).toBe(false);
	});
});
