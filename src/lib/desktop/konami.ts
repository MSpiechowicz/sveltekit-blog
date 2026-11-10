const SEQUENCE = [
	'arrowup',
	'arrowup',
	'arrowdown',
	'arrowdown',
	'arrowleft',
	'arrowright',
	'arrowleft',
	'arrowright',
	'b',
	'a',
];

/** Holding Shift to type a capital letter must not break a sequence in progress. */
const MODIFIER_KEYS = ['shift', 'control', 'alt', 'altgraph', 'meta', 'capslock'];

/**
 * Returns a matcher for the Konami code (up up down down left right left right B A). Feed it the
 * `key` of every key press; it answers true on the press that completes the sequence. A wrong key
 * starts over, except that an arrow up always begins a fresh attempt.
 */
export function createKonami(): (key: string) => boolean {
	let matched = 0;

	return (key) => {
		const pressed = key.toLowerCase();

		if (MODIFIER_KEYS.includes(pressed)) return false;

		if (pressed === SEQUENCE[matched]) {
			matched += 1;
		} else {
			matched = pressed === SEQUENCE[0] ? 1 : 0;
		}

		if (matched < SEQUENCE.length) return false;

		matched = 0;

		return true;
	};
}
