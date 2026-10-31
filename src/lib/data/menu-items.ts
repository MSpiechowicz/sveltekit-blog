import translation from '#lib/translations/en-GB.json';
import type { MenuItem } from '#lib/types.js';

function getMenuItems(): MenuItem[] {
	return [
		{ name: translation['navigation.home'], path: '' },
		{ name: translation['navigation.blog'], path: 'blog' },
	];
}

export default getMenuItems;
