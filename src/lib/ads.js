// The ad on the results screen comes from the shared IHTFY loader, which
// ihtfy.com serves for all the games (its source is in the IHTFY/com.ihtfy
// repo). Nothing ad-related loads before the first finished puzzle: the loader
// arrives then, and AdSense after it at browser idle. A visitor who may have
// bought ad-free gets the loader at startup instead (loadForBuyer), so it can
// hide the ad box before the puzzle is finished.
const LOADER = import.meta.env.VITE_ADS_LOADER || 'https://ihtfy.com/ads/v1.js';

// The shared display unit.
export const AD_SLOT = '6470163205';

// The sizes the results screen's ad may take, largest first: the first one that fits
// below the screen's content is used.
export const SCREEN_AD_SIZES = ['300x250', '320x100', '320x50'];

// What the ad aside (AdSlot.svelte) takes beyond its box: the 25 px Privacy row and the
// 53 px between that row and the box, which keeps the box over 50 px from every link.
// The browser check in the PR measured this against the real layout.
export const AD_ASIDE_EXTRA = 78;

/**
 * The largest screen ad size whose aside fits in `space` px, or null when none does.
 * @param {number} space the height from the end of the content to the bottom of the screen
 */
export function fitAdSize(space) {
	return SCREEN_AD_SIZES.find((s) => AD_ASIDE_EXTRA + Number(s.split('x')[1]) <= space) ?? null;
}

/**
 * Whether a screen may hold an ad box. Only the results screen does. The play screen never
 * does, since it holds the inputs and the keyboard, and this game has no menu, level, stats,
 * or settings screens. A visitor who may have bought ad-free gets none.
 * @param {string} screen
 * @param {{ buyer: boolean }} state
 */
export function adForScreen(screen, { buyer }) {
	return screen === 'results' && !buyer ? { slot: AD_SLOT } : null;
}

/** Wait after the last tap before the results screen replaces the puzzle, so no ad appears under a finger (ms). */
export const RESULTS_DELAY = 1200;

/** @type {Promise<void> | null} */
let loader = null;

const load = () =>
	(loader ??= new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.async = true;
		script.src = LOADER;
		script.addEventListener('load', () => resolve());
		script.addEventListener('error', () => {
			script.remove();
			loader = null;
			reject(new Error('The ad loader did not load'));
		});
		document.head.appendChild(script);
	}));

/** Whether this browser holds an ad-free token (the loader checks that it is a valid one). */
export function mayBeAdFree() {
	let stored = null;
	try {
		stored = localStorage.getItem('ihtfy-ad-free');
	} catch {
		// Storage off: the cookie may still hold the token.
	}
	let cookie = '';
	try {
		cookie = document.cookie;
	} catch {
		// Cookies off too (a sandboxed frame): the page must still start.
	}
	return !!stored || /(?:^|;\s*)ihtfy-ad-free=/.test(cookie);
}

/** Loads the loader now if this browser holds an ad-free token, so it can hide the ad box early. */
export function loadForBuyer() {
	if (mayBeAdFree()) load().catch(() => {});
}

/**
 * Fills `box` with an ad for the finished puzzle named `key`; offline or on failure it stays empty.
 * @param {HTMLElement} box
 * @param {string} key
 */
export function showAd(box, key) {
	if (!navigator.onLine) return;
	load().then(
		() => box.isConnected && window.ihtfyAds.show(box, key),
		() => {}
	);
}

/**
 * Whether `answers` solve the puzzle `words`: every answer is a dictionary word made of its
 * word plus one extra letter, and the extra letters are the 26 letters of the alphabet, each
 * once. Everything is read from these arguments, never from the letter counts the word lines
 * keep, which update a moment after the answers do.
 * @param {string[]} words
 * @param {string[]} answers
 * @param {string[] | undefined} dictionaryWords
 */
export function isSolved(words, answers, dictionaryWords) {
	if (words.length !== 26 || !dictionaryWords) return false;
	const extras = new Set();
	for (let i = 0; i < words.length; i++) {
		const answer = answers[i] ?? '';
		const rest = words[i].split('');
		const extra = [];
		for (const char of answer) {
			const at = rest.indexOf(char);
			if (at === -1) extra.push(char);
			else rest.splice(at, 1);
		}
		if (extra.length !== 1 || rest.length > 0 || !dictionaryWords.includes(answer)) return false;
		extras.add(extra[0]);
	}
	return extras.size === 26;
}
