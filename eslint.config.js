import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

const typescriptRules = tseslint.configs.recommended.rules;
const runtimeGlobals = { ...globals.browser, ...globals.node };

export default [
	{
		ignores: [
			'.DS_Store',
			'node_modules/**',
			'build/**',
			'dist/**',
			'.svelte-kit/**',
			'package/**',
			'.env',
			'.env.*',
			'!.env.example',
			'pnpm-lock.yaml',
			'package-lock.json',
			'yarn.lock',
			'bun.lockb',
		],
	},
	js.configs.recommended,
	{
		files: ['**/*.{js,ts}'],
		languageOptions: {
			globals: runtimeGlobals,
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: {
			...typescriptRules,
			...prettier.rules,
			'no-undef': 'off',
		},
	},
	{
		files: ['**/*.cjs'],
		languageOptions: {
			globals: runtimeGlobals,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'commonjs',
			},
		},
		rules: prettier.rules,
	},
	...svelte.configs['flat/recommended'],
	{
		files: ['**/*.svelte'],
		languageOptions: {
			globals: runtimeGlobals,
			parserOptions: {
				parser: tsParser,
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: {
			...typescriptRules,
			...prettier.rules,
			'no-undef': 'off',
		},
	},
	...svelte.configs['flat/prettier'],
];
