type DateStyle = Intl.DateTimeFormatOptions['dateStyle'];

export function formatDate(
	date: string | undefined,
	dateStyle: DateStyle = 'medium',
	locales = 'en',
) {
	if (!date) return date;

	const dateToFormat = new Date(date.replaceAll('-', '/'));
	const dateFormatter = new Intl.DateTimeFormat(locales, { dateStyle });

	return dateFormatter.format(dateToFormat);
}
