import type { MenuItem } from '$lib/types';

function getMenuItems(): MenuItem[] {
	return [
		{ name: 'Home', path: '/' },
		{ name: 'Blog', path: '/blog' }
	];
}

export default getMenuItems;
