<script>
	// @ts-nocheck
	// how do you set the type of an imported store? probably easier to workaround with typescript

	import { Button } from '#lib/components/ui/button/index.js';
	import { extraLetterCounts } from '#lib/stores/gameStore.js';
</script>

<div
	class="sticky top-0 z-10 mx-auto grid w-full max-w-xl grid-cols-13 gap-1 bg-background py-2 two-pane:static two-pane:grid-cols-9 two-pane:gap-1.5 two-pane:py-0"
>
	{#each 'abcdefghijklmnopqrstuvwxyz'.split('') as letter (letter)}
		<Button
			class="aspect-square h-auto w-full p-0 text-lg leading-none uppercase sm:text-2xl 2xl:text-3xl short:text-lg {$extraLetterCounts?.[
				letter
			] > 1
				? 'bg-red-500 outline-red-500 outline-dotted'
				: 'bg-green-500'}"
			disabled={$extraLetterCounts?.[letter] > 0}
		>
			{letter}
		</Button>
	{/each}
</div>
