import { generateWords } from '#lib/generator.js';
import { writable } from 'svelte/store';

/**
 * Create a writable store that automatically
 * syncs to localStorage under the given key.
 * @param {string} key The localStorage key
 * @param {any} initialValue The initial value
 * @param {(value: unknown) => boolean} [isValid] Ignores saved data in an unexpected shape
 */
function createPersistedStore(key, initialValue, isValid = () => true) {
	// Create a regular writable store
	const store = writable(initialValue);

	// If we're in the browser, sync with localStorage
	if (typeof window !== 'undefined') {
		// 1) On load, pull existing data from localStorage
		const json = localStorage.getItem(key);
		if (json) {
			const saved = JSON.parse(json);
			if (isValid(saved)) store.set(saved);
		}

		// 2) Anytime the store changes, save it to localStorage
		store.subscribe((value) => {
			localStorage.setItem(key, JSON.stringify(value));
		});
	}

	return store;
}

/**
 * Four-letter words & five-letter words
 * are stored and persisted.
 */
export const fourLetterWords = createPersistedStore('fourLetterWords', []);
export const fiveLetterWords = createPersistedStore('fiveLetterWords', []);

/**
 * What the player has typed for each word, saved so a reload or app update keeps their progress.
 */
export const answers = createPersistedStore(
	'answers',
	[],
	(value) =>
		Array.isArray(value) &&
		value.every((answer) => typeof answer === 'string' && /^[a-z]{0,5}$/.test(answer))
);

/**
 * Track used letters if you want to mark them off.
 */
// initial value is an object with all letters set to zero {a:0, b:0, c:0, ...}
export const extraLetterCounts = writable(
	Object.fromEntries('abcdefghijklmnopqrstuvwxyz'.split('').map((letter) => [letter, 0]))
);

export const showAnswers = createPersistedStore('showAnswers', false);

export function startGame() {
	// If the store is empty, generate a new puzzle
	generateWords();
}

export function newGame() {
	// Overwrite existing puzzle with a fresh one
	generateWords();
	showAnswers.set(false);
	answers.set([]);
	// Reset all letter counts to zero
	extraLetterCounts.set(
		Object.fromEntries('abcdefghijklmnopqrstuvwxyz'.split('').map((letter) => [letter, 0]))
	);
	// HACK clear all user input
	// [...document.querySelectorAll('input')].forEach((node) => {
	// 	node.value = '';
	// 	node.previousElementSibling?.replaceChildren();
	// });
	window.location.reload();
}
