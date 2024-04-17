export type Categories = 'non-technical' | 'technical'

export type Post = {
  title: string;
  description: string;
  content: string;
  slug: string;
  date: string;
  categories: Categories[];
}

export type MenuItem = {
  name: string;
  path: string;
}
