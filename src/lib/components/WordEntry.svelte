<script>
	import { WORDLEALL } from '#lib/bigwords.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { extraLetterCounts } from '#lib/stores/gameStore.js';

	export let word = '';
	export let answer = '';
	let userInput = '';
	export { userInput as value };
	let previousExtras = '';
	/** @type {string} */
	let wordStatus;

	// Recalculate extra letters
	$: {
		let available = word.split('');
		let extras = [];

		// Remove old letters from extraLetters store
		extraLetterCounts.update((counts) => {
			for (const letter of previousExtras) {
				counts[letter] = Math.max(0, counts[letter] - 1);
			}
			return counts;
		});

		// Assign only on a real change: `userInput` is bound to the saved answers, and every
		// assignment writes them back, which would rerun this block forever.
		const cleaned = userInput.replace(/[^a-zA-Z]/g, '').toLocaleLowerCase();
		if (cleaned !== userInput) userInput = cleaned;
		for (const char of userInput) {
			const idx = available.indexOf(char);
			if (idx !== -1) {
				available.splice(idx, 1); // Use letter if available
			} else {
				extras.push(char);
				extraLetterCounts.update((counts) => {
					counts[char]++;
					return counts;
				});
			}
		}

		if (userInput.length === 0) {
			wordStatus = '';
		} else if (userInput.length < 5) {
			wordStatus = 'short';
		} else if (!WORDLEALL.includes(userInput)) {
			wordStatus = 'not recognized';
		} else {
			wordStatus = '';
		}
		if (extras.length > 1) {
			wordStatus = `missing letter from ${word}`;
		}
		previousExtras = extras.join('');
	}
</script>

<div
	class="flex items-center justify-center gap-1.5 text-base font-extrabold uppercase sm:gap-2 sm:text-lg xl:text-xl 2xl:text-2xl short:text-base"
>
	<!-- Fixed width so the inputs line up down each column -->
	<Label
		class="w-[5.75em] shrink-0 text-[length:inherit] whitespace-nowrap sm:w-[6.25em]"
		for={word}
	>
		{word} + {previousExtras || '__'} =
	</Label>

	<!-- Overlayed container for styling input -->
	<div class="relative w-[4.5em] shrink-0">
		<!-- Styled input text overlay -->
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			{#each userInput.split('') as char, i (i)}
				{#if userInput
					.slice(0, i + 1)
					.split('')
					.filter((c) => c === char).length <= word.split('').filter((c) => c === char).length}
					<span>{char}</span> <!-- Normal letter (within expected count) -->
				{:else}
					<span
						class:text-red-600={$extraLetterCounts[char] > 1}
						class:text-green-600={$extraLetterCounts[char] <= 1}
					>
						{char}
					</span>
				{/if}
			{/each}
		</div>

		<!-- Transparent Input Field; text stays at least 16px so iOS doesn't zoom on focus -->
		<input
			type="text"
			id={word}
			pattern="[a-zA-Z]{5}"
			bind:value={userInput}
			maxlength="5"
			class="h-9 w-full rounded border border-gray-600 bg-transparent text-center text-transparent uppercase caret-foreground 2xl:h-11 short:h-8"
			placeholder=""
			autocomplete="off"
		/>

		<!-- Below the input, inside the row gap, so messages don't shift the grid -->
		{#if answer}
			<p class="absolute top-full right-0 mt-0.5 text-sm text-sky-600 dark:text-sky-400">
				{answer}
			</p>
		{:else if wordStatus.length}
			<p
				class="absolute top-full right-0 mt-0.5 text-xs font-semibold whitespace-nowrap text-muted-foreground normal-case"
			>
				{wordStatus}
			</p>
		{/if}
	</div>
</div>
