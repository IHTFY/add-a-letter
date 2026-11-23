<script>
	// @ts-nocheck
	// how do you set the type of an imported store? probably easier to workaround with typescript

	import { extraLetterCounts } from '#lib/stores/gameStore.js';
	import { onMount } from 'svelte';

	/** @type {HTMLElement | undefined} */
	let board;

	// The board sticks to the top on narrow screens. The answer fields scroll clear of it by this height.
	onMount(() => {
		const root = document.documentElement;
		const observer = new ResizeObserver(() =>
			root.style.setProperty('--board-height', `${board.offsetHeight}px`)
		);
		observer.observe(board);
		return () => {
			observer.disconnect();
			root.style.removeProperty('--board-height');
		};
	});
</script>

<!-- Only shows which letters are used, so it has no controls to Tab through. -->
<ul
	bind:this={board}
	class="sticky top-0 z-10 mx-auto grid w-full max-w-xl grid-cols-13 gap-1 bg-background py-2 two-pane:static two-pane:grid-cols-9 two-pane:gap-1.5 two-pane:py-0"
>
	{#each 'abcdefghijklmnopqrstuvwxyz'.split('') as letter (letter)}
		{@const count = $extraLetterCounts?.[letter] ?? 0}
		<!-- A used letter is struck through once; one used twice is crossed out, so the shape tells them apart without the red. -->
		<li
			class="relative inline-flex aspect-square h-auto w-full items-center justify-center rounded-sm border border-input p-0 text-lg leading-none font-semibold uppercase sm:text-2xl 2xl:text-3xl short:text-lg {count >
			1
				? 'bg-mark/15 text-foreground/60'
				: count
					? 'bg-muted text-foreground/60'
					: 'bg-card text-foreground'}"
		>
			{letter}
			{#if count > 0}
				<span class="strike -rotate-45" aria-hidden="true"></span>
				<span class="sr-only">used</span>
			{/if}
			{#if count > 1}<span class="strike rotate-45" aria-hidden="true"></span>{/if}
		</li>
	{/each}
</ul>

<style>
	.strike {
		position: absolute;
		inset: 46% 12% auto;
		height: max(2px, 8%);
		border-radius: 9999px;
		background: hsl(var(--mark));
	}
</style>
