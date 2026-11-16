// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

async function loadStore() {
	vi.resetModules();
	return import('../src/lib/stores/gameStore.js');
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	localStorage.clear();
});

describe('saved game state', () => {
	it('starts with empty defaults when storage throws', async () => {
		const boom = () => {
			throw new DOMException('The operation is insecure.', 'SecurityError');
		};
		vi.stubGlobal('localStorage', { getItem: boom, setItem: boom });
		const store = await loadStore();
		expect(get(store.fourLetterWords)).toEqual([]);
		expect(() => store.answers.set(['abc'])).not.toThrow();
		expect(get(store.answers)).toEqual(['abc']);
	});

	it('leaves saved values alone when a read fails', async () => {
		const saved = {
			fourLetterWords: '["tree","bird"]',
			fiveLetterWords: '["trees"]',
			answers: '["trees"]',
			showAnswers: 'true'
		};
		const data = new Map(Object.entries(saved));
		vi.stubGlobal('localStorage', {
			getItem: () => {
				throw new DOMException('Denied', 'SecurityError');
			},
			setItem: (/** @type {string} */ key, /** @type {string} */ value) => data.set(key, value)
		});
		const store = await loadStore();
		// What the page does at startup and while playing must not replace saved values either.
		store.startGame();
		store.answers.set([]);
		store.showAnswers.set(false);
		expect(Object.fromEntries(data)).toEqual(saved);
	});

	it('a new game replaces a saved value even when it changes nothing in memory', async () => {
		const data = new Map([['showAnswers', 'false']]);
		let failReads = true;
		vi.stubGlobal('localStorage', {
			getItem: (/** @type {string} */ key) => {
				if (failReads) throw new DOMException('Denied', 'SecurityError');
				return data.get(key) ?? null;
			},
			setItem: (/** @type {string} */ key, /** @type {string} */ value) => data.set(key, value)
		});
		const store = await loadStore();
		data.set('showAnswers', 'true'); // the saved value the failed read could not see
		failReads = false;
		vi.stubGlobal('location', { reload: vi.fn() });
		store.newGame();
		expect(data.get('showAnswers')).toBe('false');
	});

	it('ignores a cut-off saved value', async () => {
		localStorage.setItem('answers', '["abc"');
		const store = await loadStore();
		expect(get(store.answers)).toEqual([]);
	});

	it('ignores saved word lists in the wrong shape', async () => {
		localStorage.setItem('fourLetterWords', 'null');
		localStorage.setItem('fiveLetterWords', '[1, "abcde"]');
		const store = await loadStore();
		expect(get(store.fourLetterWords)).toEqual([]);
		expect(get(store.fiveLetterWords)).toEqual([]);
	});

	it('still loads a valid saved puzzle', async () => {
		localStorage.setItem('fourLetterWords', '["tree","bird"]');
		const store = await loadStore();
		expect(get(store.fourLetterWords)).toEqual(['tree', 'bird']);
	});

	it('picks up a new puzzle another tab started instead of writing the old one over it', async () => {
		localStorage.setItem('fourLetterWords', '["tree","bird"]');
		localStorage.setItem('fiveLetterWords', '["trees","birds"]');
		localStorage.setItem('answers', '["trees",""]');
		const store = await loadStore();

		// The other tab starts a new game: it saves the new puzzle, then empty answers.
		/** @param {string} key @param {string} value */
		function otherTabSaves(key, value) {
			localStorage.setItem(key, value);
			window.dispatchEvent(
				new StorageEvent('storage', { key, newValue: value, storageArea: localStorage })
			);
		}
		otherTabSaves('fourLetterWords', '["moon","lamp"]');
		otherTabSaves('fiveLetterWords', '["moons","lamps"]');
		otherTabSaves('answers', '["",""]');
		expect(get(store.fourLetterWords)).toEqual(['moon', 'lamp']);
		expect(get(store.answers)).toEqual(['', '']);

		// Typing here now saves answers for the new puzzle, and the puzzle itself is untouched.
		store.answers.set(['moons', '']);
		expect(localStorage.getItem('answers')).toBe('["moons",""]');
		expect(localStorage.getItem('fourLetterWords')).toBe('["moon","lamp"]');
	});

	it('ignores storage changes that are not a valid saved value or not its own', async () => {
		localStorage.setItem('answers', '["abc"]');
		const store = await loadStore();
		/** @param {string} key @param {string | null} value @param {Storage} [area] */
		function change(key, value, area = localStorage) {
			window.dispatchEvent(
				new StorageEvent('storage', { key, newValue: value, storageArea: area })
			);
		}
		change('answers', '["ABC1"]');
		change('answers', '["abc"');
		change('answers', null);
		change('answers', '["zzz"]', sessionStorage);
		change('theme', '["zzz"]');
		expect(get(store.answers)).toEqual(['abc']);
	});
});
