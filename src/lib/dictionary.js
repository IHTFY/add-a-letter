import wordleallUrl from '#lib/wordleall.txt?url';
import { get, writable } from 'svelte/store';

/**
 * The full 5-letter dictionary. It is large, so it loads when the first 5-letter entry needs
 * checking. `failed` is set when that load fails (for example offline) so entries can say so.
 * @type {import('svelte/store').Writable<{ words: string[] | undefined, failed: boolean }>}
 */
export const dictionary = writable({ words: undefined, failed: false });

let loading = false;

/** Load the dictionary unless it is loaded or loading. A failed load can be tried again. */
export async function loadDictionary() {
	if (loading || get(dictionary).words) return;
	loading = true;
	try {
		// A fetch can be retried after a failure; a failed `import()` stays failed in some browsers.
		const response = await fetch(wordleallUrl);
		if (!response.ok) throw new Error(`Dictionary request failed: ${response.status}`);
		const words = (await response.text()).split('\n').filter(Boolean);
		dictionary.set({ words, failed: false });
	} catch {
		dictionary.set({ words: undefined, failed: true });
	} finally {
		loading = false;
	}
}

if (typeof window !== 'undefined') {
	window.addEventListener('online', () => {
		if (get(dictionary).failed) loadDictionary();
	});
}
