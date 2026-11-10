<script lang="ts">
	import { getDesktop } from '#lib/desktop/desktop.svelte.js';

	import AppWindow from './app-window.svelte';

	const desk = getDesktop();

	const alert = $derived(desk.alertState);

	const COPYRIGHT_SIGN = '©';

	// One entry per line of the message; the copyright sign is its own part so it can be aligned.
	const lines = $derived(
		(alert?.message ?? '')
			.split('\n')
			.map((line) => line.split(/(©)/).filter((part) => part !== '')),
	);

	let okButton = $state<HTMLButtonElement>();

	// Keyboard users land on the button as soon as the dialog appears.
	$effect(() => {
		if (desk.isOpen('alert') && alert && okButton) okButton.focus();
	});
</script>

<AppWindow
	id="alert"
	title={alert?.title ?? ''}
	x="calc(50vw - 180px)"
	y="22vh"
	w="360px"
	role="alertdialog"
	dialog>
	<p>
		{#each lines as line, index (index)}
			<span class="line">
				{#each line as part, partIndex (partIndex)}
					{#if part === COPYRIGHT_SIGN}
						<span class="sign">{part}</span>
					{:else}
						{part}
					{/if}
				{/each}
			</span>
		{/each}
	</p>
	<button
		type="button"
		class="btn"
		bind:this={okButton}
		onclick={() => desk.dismissAlert(true)}>
		{alert?.label}
	</button>
</AppWindow>

<style>
	.line {
		display: block;
	}

	/*
	 * In this typeface the copyright sign is a little shorter than the digits and capitals and floats
	 * above the baseline. It is enlarged to their height and lowered onto the baseline, so its middle
	 * lines up with the middle of the text beside it.
	 */
	.sign {
		display: inline-block;
		font-size: 1.09em;
		line-height: 1;
		vertical-align: -0.09em;
	}
</style>
