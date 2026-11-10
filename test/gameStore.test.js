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
