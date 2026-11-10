<script lang="ts">
	import { resolve } from '$app/paths';

	import logo from '#lib/assets/logo.png';
	import { getDesktop } from '#lib/desktop/desktop.svelte.js';

	import AppWindow from './app-window.svelte';
	import { t } from './text.js';

	const TYPING_INTERVAL_MS = 32;

	const desk = getDesktop();
	const fullSubtitle = t('subTitle');

	// The server renders the whole subtitle; the browser retypes it once the splash is over.
	let subtitle = $state(fullSubtitle);

	function typeSubtitle(): () => void {
		let length = 0;
		let timer: ReturnType<typeof setTimeout> | undefined;

		function step() {
			length += 1;
			subtitle = fullSubtitle.slice(0, length);

			if (length < fullSubtitle.length) timer = setTimeout(step, TYPING_INTERVAL_MS);
		}

		subtitle = '';
		timer = setTimeout(step, TYPING_INTERVAL_MS);

		return () => {
			clearTimeout(timer);
			subtitle = fullSubtitle;
		};
	}

	$effect(() => {
		if (!desk.bootDone || desk.reducedMotion) return;

		return typeSubtitle();
	});
</script>

<AppWindow
	id="about"
	title={t('desktop.window.about')}
	x="6vw"
	y="36px"
	w="560px">
	<div class="about">
		<img
			class="logo"
			src={logo}
			alt={t('desktop.about.logoAlt')}
			width="170"
			height="76" />
		<h1>
			{t('desktop.about.greeting')}
			<b>{t('desktop.about.name')}</b>
		</h1>
		<h2 class="type">{subtitle}</h2>
		<div class="rule"></div>
		<p>{t('description')}</p>
		<a
			class="btn"
			href={resolve('/blog')}
			data-opens="blog">{t('desktop.about.recentPosts')}</a>
	</div>
</AppWindow>

<style>
	.logo {
		display: block;
		width: 170px;
		height: auto;
	}

	:global(:root[data-theme='phosphor']) .logo {
		filter: invert(1) brightness(0.5) sepia(1) saturate(9) hue-rotate(72deg) brightness(1.5);
	}

	:global(:root[data-theme='blueprint']) .logo {
		filter: invert(1);
	}

	h1 {
		margin: 14px 0 4px;
		font-size: clamp(1.7rem, 4.5vw, 2.4rem);
		font-weight: 500;
		line-height: 1.1;
	}

	h1 b {
		font-weight: 900;
	}

	h2 {
		min-height: 1.5em;
		margin: 0 0 10px;
		font-size: 1.1rem;
		font-weight: 700;
	}

	.type::after {
		content: '▌';
		animation: blink 1s steps(1) infinite;
	}

	p {
		max-width: 56ch;
		margin: 0 0 14px;
	}
</style>
