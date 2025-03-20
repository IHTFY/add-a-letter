<script>
	// @ts-nocheck
	// how do you set the type of an imported store? probably easier to workaround with typescript

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { extraLetterCounts } from '$lib/stores/gameStore';
</script>

<div class="mt-4 grid grid-cols-[repeat(13,auto)] justify-center gap-2">
	{#each 'abcdefghijklmnopqrstuvwxyz'.split('') as letter}
		<Button
			class="h-10 w-10 uppercase {$extraLetterCounts?.[letter] > 1
				? 'bg-red-500 outline-dotted outline-red-500'
				: 'bg-green-500'}  p-0 text-3xl"
			disabled={$extraLetterCounts?.[letter] > 0}
		>
			{letter}
		</Button>
	{/each}
</div>
