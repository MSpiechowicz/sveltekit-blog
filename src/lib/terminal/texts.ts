/** Fixed texts of the desktop terminal, kept apart from the command logic. */

export const PROMPT = 'maciej$';

export const HELP_TEXT = [
	'ls              list posts',
	'cat <n|slug>    read a post, e.g. cat 6',
	'open <name>     about, blog, projects, links',
	'whoami · date · invert · clear',
	'Ctrl/Cmd+C  clear the line       Ctrl/Cmd+L  clear the screen',
	'There is more than this list shows. Try: ls -la',
].join('\n');

export const SECRETS_TEXT = [
	'Things nobody told you about:',
	'  fortune · cowsay <text> · vim · matrix · coffee · sudo · hello · do a barrel roll · exit',
	'  jog · plane · balloon · flock · ufo   (wallpaper scenes)',
	'On the desktop: click the sun five times, drag an icon onto the Trash,',
	'enter the Konami code (↑ ↑ ↓ ↓ ← → ← → B A),',
	'or look closely at the bottom right corner.',
].join('\n');

export const OPEN_USAGE = 'open: try about, blog, projects or links';

export const SUDO_TEXT = 'maciej is not in the sudoers file. This incident will be reported.';
export const RM_RECURSIVE_TEXT = 'rm: nice try. The blog stays.';
export const RM_PLAIN_TEXT = 'rm: drag an icon onto the Trash instead.';
export const COFFEE_TEXT = "418 I'm a teapot.";
export const ANSWER_TEXT = 'That is the answer. The question is still loading.';
export const MATRIX_TEXT = 'Wake up, Maciej…';

export const VIM_ENTER_TEXT = 'You are now inside vim. Type :q to get out.';
export const VIM_INSERT_TEXT = '-- INSERT --   (type :q to get out)';
export const VIM_ESCAPE_BEFORE = 'You got out of vim. ';
export const VIM_ESCAPE_LINK = 'My LazyVim configuration';
export const VIM_ESCAPE_AFTER = ' makes staying in easier.';

export const HELLO_TEXT = 'Hello World!';

export const DEFAULT_COW_TEXT = 'Moo. Read the blog.';

export function cowsay(text: string): string {
	const border = '-'.repeat(text.length + 2);

	return [
		` ${border}`,
		`< ${text} >`,
		` ${border}`,
		'        \\   ^__^',
		'         \\  (oo)\\_______',
		'            (__)\\       )\\/\\',
		'                ||----w |',
		'                ||     ||',
	].join('\n');
}
