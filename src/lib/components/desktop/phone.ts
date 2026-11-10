import { MediaQuery } from 'svelte/reactivity';

/** Same breakpoint as the phone rules in app.css. */
const PHONE_QUERY = 'max-width: 720px';

let query: MediaQuery | undefined;

/**
 * True on phone-sized screens, where windows are full screen and cannot be dragged or resized.
 * Browser only: call it from event handlers and effects, never while rendering on the server.
 */
export function isPhone(): boolean {
	if (typeof window === 'undefined') return false;

	query ??= new MediaQuery(PHONE_QUERY);

	return query.current;
}
