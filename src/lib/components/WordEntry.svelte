<script>
	import { Label } from '$lib/components/ui/label';
	import { extraLetterCounts } from '$lib/stores/gameStore';

	export let word = '';
	export let answer = '';
	let userInput = '';
	let previousExtras = '';

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

		userInput = userInput.replace(/[^a-zA-Z]/g, '').toLocaleLowerCase();
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

		previousExtras = extras.join('');
	}
</script>

<div class="flex items-center justify-center gap-4 font-extrabold">
	<!-- Ensures consistent width for left and right sections -->
	<div class="relative flex w-[200px] items-center justify-between">
		<!-- Left side: Word + Extra Letters -->
		<Label class="min-w-[100px] text-right uppercase">
			{word} + {previousExtras || '__'} =
		</Label>

		<!-- Overlayed container for styling input -->
		<div class="relative w-24">
			<!-- Styled input text overlay -->
			<div
				class="pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center text-center uppercase"
				style="color: inherit;"
			>
				{#each userInput.split('') as char, i}
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

			<!-- Transparent Input Field -->
			<input
				type="text"
				pattern="[a-zA-Z]{5}"
				bind:value={userInput}
				maxlength="5"
				class="w-24 rounded border border-gray-600 bg-transparent p-1 text-center uppercase text-transparent caret-white"
				placeholder=""
			/>
		</div>

		<!-- Right side: Answer (optional) -->
		{#if answer}
			<span class="min-w-[100px] text-left uppercase">{answer}</span>
		{/if}
	</div>
</div>
