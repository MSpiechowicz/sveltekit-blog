export type ProfileLink = {
	/** Stable key, also used to look up the description text. */
	id: 'linkedin' | 'github' | 'mastodon' | 'facebook';
	name: string;
	href: string;
};

/** Public profiles shown in the Links window and listed as "same as" for search engines. */
export const profileLinks: ProfileLink[] = [
	{ id: 'linkedin', name: 'LinkedIn', href: 'https://www.linkedin.com/in/mspiechowicz/' },
	{ id: 'github', name: 'GitHub', href: 'https://github.com/MSpiechowicz' },
	{ id: 'mastodon', name: 'Mastodon', href: 'https://mastodon.social/@mspiechowicz' },
	{ id: 'facebook', name: 'Facebook', href: 'https://www.facebook.com/maciej.spiechowicz' },
];

/** The address as a visitor reads it: no scheme, no "www." and no trailing slash. */
export function displayAddress(href: string): string {
	return href
		.replace(/^https?:\/\//, '')
		.replace(/^www\./, '')
		.replace(/\/$/, '');
}
