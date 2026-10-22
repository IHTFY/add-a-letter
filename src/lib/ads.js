// The ad on the finished-puzzle screen comes from the shared IHTFY loader, which
// ihtfy.com serves for all the games (its source is in the IHTFY/com.ihtfy
// repo). Nothing ad-related loads before the first finished puzzle: the loader
// arrives then, and AdSense after it at browser idle. A visitor who may have
// bought ad-free gets the loader at startup instead (loadForBuyer), so it can
// hide the ad box before the puzzle is finished.
const LOADER = import.meta.env.VITE_ADS_LOADER || 'https://ihtfy.com/ads/v1.js';

// The shared 300×250 display unit.
export const AD_SLOT = '6470163205';

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

/** Loads the loader now if this browser holds an ad-free token; the loader checks it. */
export function loadForBuyer() {
	let stored = null;
	try {
		stored = localStorage.getItem('ihtfy-ad-free');
	} catch {
		// Storage off: the cookie may still hold the token.
	}
	if (stored || /(?:^|;\s*)ihtfy-ad-free=/.test(document.cookie)) load().catch(() => {});
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
