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
});
