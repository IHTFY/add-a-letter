<script>
	import { Button } from '$lib/components/ui/button';
	import {
		fiveLetterWords,
		fourLetterWords,
		newGame,
		showAnswers,
		startGame
	} from '$lib/stores/gameStore.js';
	import { onMount } from 'svelte';
	import AlphabetBoard from './AlphabetBoard.svelte';
	import WordEntry from './WordEntry.svelte';

	// On component mount, if there are no 4-letter words,
	// generate a puzzle. Otherwise, use what's in localStorage.
	onMount(() => {
		if ($fourLetterWords.length === 0) {
			startGame();
		}
	});

	function handleNewGame() {
		newGame();
	}

	function handleShowAnswers() {
		showAnswers.set(true);
	}
</script>

<!-- Page Title or Instructions -->
<h1 class="scroll-m-20 text-center text-4xl font-extrabold lg:text-5xl">Add A Letter</h1>

<p class="text-center leading-7 [&:not(:first-child)]:mt-6">
	Add a different letter of the alphabet to each of the 26 words below. Rearrange the letters, if
	necessary, to form a common word. Cross off each letter of the alphabet as you use it. Use each
	letter from A to Z exactly once.
</p>

<!-- "New Game" button to re-generate words -->
<Button on:click={handleNewGame} class="rounded bg-blue-600 px-4 py-2 text-white">New Game</Button>

<!-- Show answers button-->
<Button
	on:click={handleShowAnswers}
	disabled={$showAnswers}
	class="rounded bg-red-600 px-4 py-2 text-white">Show Answers</Button
>

<!-- Alphabet Board (non-clickable) -->
<AlphabetBoard />

<!-- Show the puzzle words in two columns -->
<div class="mt-6 grid grid-cols-2 gap-4">
	{#each $fourLetterWords as word, i}
		<WordEntry {word} answer={$showAnswers ? $fiveLetterWords[i] : ''} />
	{/each}
</div>
