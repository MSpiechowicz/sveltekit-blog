<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import { t } from '#lib/components/desktop/text.js';
</script>

<!-- A dialog in the same window chrome as the desktop windows (classes live in app.css). -->
<div
	class="win dlg front error"
	role="alertdialog"
	aria-label={t('desktop.error.title')}
	style:--x="calc(50vw - 180px)"
	style:--y="22vh"
	style:--w0="360px"
	style:z-index="500">
	<div class="tb">
		<b class="sp"></b>
		<i></i>
		<span>{t('desktop.error.title')}</span>
		<i></i>
		<b class="sp"></b>
	</div>
	<div class="pane">
		<div class="wc">
			<h1>{page.status}</h1>
			<p>{page.error?.message}</p>
			<a
				class="btn"
				href={resolve('/')}>{t('desktop.error.back')}</a>
		</div>
	</div>
</div>

<style>
	h1 {
		margin: 0;
		font-size: 3rem;
		font-weight: 900;
		line-height: 1;
	}
</style>
