export type Categories = 'non-technical' | 'technical';

export type Post =
	| {
			title?: string;
			description?: string;
			image?: string;
			imageAlt?: string;
			content?: string;
			slug?: string;
			date?: string;
			categories?: Categories[];
	  }
	| undefined;

export type Data =
	| {
			content?: ConstructorOfATypedSvelteComponent;
			meta: Post;
	  }
	| undefined;

export type PostsData = {
	posts: Post[];
};

export type UrlData = {
	url: string;
};

export type MenuItem = {
	name: string;
	path: string;
};

export type FooterItem = {
	href: string;
	letter: string;
};
