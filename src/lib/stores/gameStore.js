import { generateWords } from '#lib/generator.js';
import { get, writable } from 'svelte/store';

// Set when a saved value could not be read. Nothing is saved after that, so the game started
// from defaults cannot overwrite what is still in storage, until the player starts a new game.
let readFailed = false;
/** @type {Array<() => void>} */
const savers = [];

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
		let json = null;
		try {
			json = localStorage.getItem(key);
		} catch {
			// Blocked storage: start from the initial value and leave what is saved alone.
			readFailed = true;
		}
		try {
			if (json) {
				const saved = JSON.parse(json);
				if (isValid(saved)) store.set(saved);
			}
		} catch {
			// A damaged value: start from the initial value.
		}

		// 2) Anytime the store changes, save it to localStorage
		const save = () => {
			if (readFailed) return;
			try {
				localStorage.setItem(key, JSON.stringify(get(store)));
			} catch {
				// Blocked or full storage: keep playing without saving.
			}
		};
		store.subscribe(save);
		savers.push(save);

		// 3) Another tab saved this value, for example a new puzzle: take it, so this tab's old
		// puzzle or answers are never saved over it.
		window.addEventListener('storage', (event) => {
			if (event.storageArea !== localStorage || event.key !== key || event.newValue === null)
				return;
			if (event.newValue === JSON.stringify(get(store))) return;
			try {
				const saved = JSON.parse(event.newValue);
				if (isValid(saved)) store.set(saved);
			} catch {
				// A damaged value: keep this tab's.
			}
		});
	}

	return store;
}

/**
 * Four-letter words & five-letter words
 * are stored and persisted.
 */
const isWordList = (/** @type {number} */ length) => (/** @type {unknown} */ value) =>
	Array.isArray(value) &&
	value.every((word) => typeof word === 'string' && new RegExp(`^[a-z]{${length}}$`).test(word));
export const fourLetterWords = createPersistedStore('fourLetterWords', [], isWordList(4));
export const fiveLetterWords = createPersistedStore('fiveLetterWords', [], isWordList(5));

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

export const showAnswers = createPersistedStore(
	'showAnswers',
	false,
	(value) => typeof value === 'boolean'
);

export function startGame() {
	// If the store is empty, generate a new puzzle
	generateWords();
}

export function newGame() {
	// Starting over on purpose may replace what could not be read.
	readFailed = false;
	// Overwrite existing puzzle with a fresh one
	generateWords();
	showAnswers.set(false);
	answers.set([]);
	// Reset all letter counts to zero
	extraLetterCounts.set(
		Object.fromEntries('abcdefghijklmnopqrstuvwxyz'.split('').map((letter) => [letter, 0]))
	);
	// A reset that changes nothing in memory (a damaged value read as the default) still replaces it.
	savers.forEach((save) => save());
	// HACK clear all user input
	// [...document.querySelectorAll('input')].forEach((node) => {
	// 	node.value = '';
	// 	node.previousElementSibling?.replaceChildren();
	// });
	window.location.reload();
}
