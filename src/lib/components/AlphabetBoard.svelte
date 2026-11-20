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
		<li
			class="inline-flex aspect-square h-auto w-full items-center justify-center rounded-md p-0 text-lg leading-none font-medium text-primary-foreground uppercase sm:text-2xl 2xl:text-3xl short:text-lg {$extraLetterCounts?.[
				letter
			] > 1
				? 'bg-red-500 outline-red-500 outline-dotted'
				: 'bg-green-500'} {$extraLetterCounts?.[letter] > 0 ? 'opacity-50' : ''}"
		>
			{letter}
			{#if $extraLetterCounts?.[letter] > 0}<span class="sr-only">used</span>{/if}
		</li>
	{/each}
</ul>
