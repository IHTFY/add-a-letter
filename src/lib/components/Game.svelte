<script>
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		answers,
		fiveLetterWords,
		fourLetterWords,
		newGame,
		showAnswers,
		startGame
	} from '#lib/stores/gameStore.js';
	import { toggleMode } from 'mode-watcher';
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

	// One saved answer per puzzle word, including for puzzles saved before answers were.
	$: if ($answers.length !== $fourLetterWords.length) {
		$answers = Array.from({ length: $fourLetterWords.length }, (_, i) => $answers[i] ?? '');
	}

	function handleNewGame() {
		newGame();
	}

	function handleShowAnswers() {
		showAnswers.set(true);
	}
</script>

<!-- Stacked on narrow screens, where the sidebar's children join the page grid so the
board can stick to the top. Sidebar beside the words on wide and sideways screens. -->
<main
	class="mx-auto grid max-w-[110rem] gap-3 px-2 py-3 sm:gap-4 sm:px-6 xl:px-10 xl:py-8 two-pane:min-h-dvh two-pane:grid-cols-[clamp(18rem,22vw,26rem)_minmax(0,1fr)] two-pane:content-center two-pane:items-start two-pane:gap-x-[clamp(2rem,3vw,3rem)] short:grid-cols-[15rem_minmax(0,1fr)] short:gap-x-5 short:px-4 short:py-0"
>
	<aside
		class="contents two-pane:sticky two-pane:top-0 two-pane:flex two-pane:max-h-dvh two-pane:flex-col two-pane:gap-4 two-pane:overflow-y-auto short:gap-2 short:py-3"
	>
		<header class="flex items-center justify-between gap-2">
			<h1 class="text-3xl font-extrabold sm:text-4xl 2xl:text-5xl short:text-2xl">Add A Letter</h1>
			<Button onclick={toggleMode} variant="outline" size="icon" class="shrink-0 short:size-8">
				<Sun
					class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
				/>
				<Moon
					class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</header>

		<p
			class="text-sm leading-6 sm:text-base sm:leading-7 lg:text-sm lg:leading-6 2xl:text-base 2xl:leading-7 short:text-xs short:leading-snug"
		>
			Add a different letter of the alphabet to each of the 26 words below. Rearrange the letters,
			if necessary, to form a common word. Cross off each letter of the alphabet as you use it. Use
			each letter from A to Z exactly once.
		</p>

		<div class="flex gap-2 *:flex-1 sm:*:flex-none two-pane:*:flex-1">
			<Button onclick={handleNewGame} class="bg-blue-600 text-white short:h-8">New Game</Button>
			<Button
				onclick={handleShowAnswers}
				disabled={$showAnswers}
				class="bg-red-600 text-white short:h-8">Show Answers</Button
			>
		</div>

		<AlphabetBoard />

		<footer
			class="order-last text-center text-xs text-muted-foreground two-pane:mt-auto two-pane:text-left"
		>
			<a
				href="https://ihtfy.com/support/"
				target="_blank"
				rel="noopener"
				class="hover:text-foreground hover:underline">Support ♥</a
			>
		</footer>
	</aside>

	<div
		class="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] sm:gap-x-6 2xl:grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] 2xl:gap-y-7 short:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] short:gap-x-3 short:gap-y-5 short:py-3"
	>
		{#each $fourLetterWords as word, i (i)}
			<WordEntry {word} bind:value={$answers[i]} answer={$showAnswers ? $fiveLetterWords[i] : ''} />
		{/each}
	</div>
</main>
