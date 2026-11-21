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

	it('rebuilds the whole puzzle when only the solution list is damaged', async () => {
		const first = await loadStore();
		first.startGame();
		localStorage.setItem('fiveLetterWords', '[1, "abcde"]');
		localStorage.setItem('answers', '["tree"]');
		const store = await loadStore();
		store.startGame();
		const four = get(store.fourLetterWords);
		const five = get(store.fiveLetterWords);
		expect(five).toHaveLength(26);
		four.forEach((/** @type {string} */ clue, /** @type {number} */ i) => {
			const rest = [...five[i]];
			for (const letter of clue) rest.splice(rest.indexOf(letter), 1);
			expect(rest).toHaveLength(1);
		});
		expect(get(store.answers)).toEqual([]);
	});

	it('keeps a complete saved puzzle and its answers', async () => {
		const first = await loadStore();
		first.startGame();
		first.answers.set(['abc']);
		const clues = localStorage.getItem('fourLetterWords');
		const store = await loadStore();
		store.startGame();
		expect(localStorage.getItem('fourLetterWords')).toBe(clues);
		expect(get(store.answers)).toEqual(['abc']);
	});

	it('starts a new puzzle when the clue list is complete but the solutions are too few', async () => {
		const first = await loadStore();
		first.startGame();
		const five = JSON.parse(localStorage.getItem('fiveLetterWords') ?? '[]');
		localStorage.setItem('fiveLetterWords', JSON.stringify(five.slice(0, 5)));
		const store = await loadStore();
		store.startGame();
		expect(get(store.fiveLetterWords)).toHaveLength(26);
		expect(get(store.fourLetterWords)).toHaveLength(26);
	});

	it('keeps the new puzzle on screen when the old save cannot be replaced', async () => {
		const data = new Map();
		let full = false;
		vi.stubGlobal('localStorage', {
			getItem: (/** @type {string} */ key) => data.get(key) ?? null,
			setItem: (/** @type {string} */ key, /** @type {string} */ value) => {
				if (full) throw new DOMException('Quota', 'QuotaExceededError');
				data.set(key, value);
			}
		});
		const store = await loadStore();
		store.startGame();
		store.answers.set(['abc']);
		const oldClues = data.get('fourLetterWords');
		full = true;
		const reload = vi.fn();
		vi.stubGlobal('location', { reload });
		store.newGame();
		expect(reload).not.toHaveBeenCalled();
		expect(get(store.answers)).toEqual([]);
		expect(JSON.stringify(get(store.fourLetterWords))).not.toBe(oldClues);
		expect(data.get('fourLetterWords')).toBe(oldClues);
	});

	it('reloads after a new game that saved', async () => {
		const store = await loadStore();
		store.startGame();
		const reload = vi.fn();
		vi.stubGlobal('location', { reload });
		store.newGame();
		expect(reload).toHaveBeenCalled();
	});

	/** @param {string} key @param {string} value */
	function otherTabSaves(key, value) {
		localStorage.setItem(key, value);
		window.dispatchEvent(
			new StorageEvent('storage', { key, newValue: value, storageArea: localStorage })
		);
	}

	it('reloads when another tab starts a new puzzle, and saves nothing over it first', async () => {
		localStorage.setItem('fourLetterWords', '["tree","bird"]');
		localStorage.setItem('fiveLetterWords', '["trees","birds"]');
		localStorage.setItem('answers', '["trees",""]');
		const store = await loadStore();
		const reload = vi.fn();
		vi.stubGlobal('location', { reload });

		// The other tab starts a new game: it saves the new puzzle, then empty answers.
		otherTabSaves('fourLetterWords', '["moon","lamp"]');
		otherTabSaves('fiveLetterWords', '["moons","lamps"]');
		otherTabSaves('answers', '["",""]');
		expect(reload).toHaveBeenCalled();

		// Typing in the moments before the reload must not put the old puzzle or answers back.
		store.answers.set(['trees', '']);
		store.fourLetterWords.set(['tree', 'bird']);
		expect(localStorage.getItem('fourLetterWords')).toBe('["moon","lamp"]');
		expect(localStorage.getItem('answers')).toBe('["",""]');
	});

	it('takes answers another tab saved without saving them back', async () => {
		localStorage.setItem('answers', '["a"]');
		const store = await loadStore();
		otherTabSaves('answers', '["abc"]');
		expect(get(store.answers)).toEqual(['abc']);
		expect(localStorage.getItem('answers')).toBe('["abc"]');

		// This tab saves its own changes as usual afterwards.
		store.answers.set(['abcd']);
		expect(localStorage.getItem('answers')).toBe('["abcd"]');
	});

	it('ignores a late storage event for a value that has since been replaced', async () => {
		localStorage.setItem('answers', '["tre"]');
		const store = await loadStore();
		// This tab saves "trees"; an older event from the other tab, which saved "tre", arrives late.
		store.answers.set(['trees']);
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: 'answers',
				newValue: '["tre"]',
				storageArea: localStorage
			})
		);
		expect(get(store.answers)).toEqual(['trees']);
		store.answers.set(['trees', 'a']);
		expect(localStorage.getItem('answers')).toBe('["trees","a"]');
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
