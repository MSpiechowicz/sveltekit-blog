export type Categories = 'non-technical' | 'technical';

export type Post =
	| {
			title?: string;
			description?: string;
			content?: string;
			slug?: string;
			date?: string;
			categories?: Categories[];
	  }
	| undefined;

export type Data =
	| {
			meta: {
				title?: string;
				date?: string;
			} | undefined;
	  }
	| undefined;

export type MenuItem = {
	name: string;
	path: string;
};

export type FooterItem = {
	href: string;
	letter: string;
};
