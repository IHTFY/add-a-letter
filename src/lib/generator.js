import { COMMON4, FREQ4, FREQ5, SCRABBLE4, WORDLES } from '$lib/bigwords.js';
import { fiveLetterWords, fourLetterWords } from '$lib/stores/gameStore.js';

/**
 * Shuffle an array
 * @param {any[]} a The array to shuffle
 * @param {boolean} inplace If true, the array will be shuffled in place
 * @returns {any[]} The shuffled array
 */
const shuffle = (a, inplace = false) => {
	let arr = inplace ? a : [...a];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};

/**
 * Cut array like a deck of cards
 * @param {any[]} a The array to cut
 * @param {number} n The index to cut at, defaults to a random index
 * @returns {any[]} The cut array
 */
const cut = (a, n = Math.floor(Math.random() * a.length)) => [...a.slice(n), ...a.slice(0, n)];

/**
 * Get all unique n-length permutations of a string's subsets
 * @param {string} str The string to permute
 * @param {number} n The length of the permutations
 * @returns {string[]} An array of all permutations
 */
const permute = (str, n) => {
	if (n === 1) return [...str];
	const perms = new Set();
	for (let i = 0; i < str.length; i++) {
		const rest = str.slice(0, i) + str.slice(i + 1);
		const restPerms = permute(rest, n - 1);
		for (const perm of restPerms) {
			const newPerm = str[i] + perm;
			perms.add(newPerm);
		}
	}
	return [...perms];
};

/**
 * Filter out words that are not in the dictionary
 * @param {string[]} words The words to filter
 * @param {string[]} dict The dictionary to filter against
 * @returns {string[]} The words that are in the dictionary
 */
const filterWords = (words, dict) => words.filter((word) => dict.includes(word));

/**
 * Get a word containing a given letter
 * @param {string} letter The letter to include
 * @param {string[]} dict The dictionary to search
 * @returns {string} A word containing the letter
 */
const getWordWithLetter = (letter, dict) => dict.find((word) => word.includes(letter)) || '';

/**
 * Get frequency of a word
 * @param {string} word The word to get frequency of
 * @returns {number} The frequency of the word
 */
const getFrequency = (word) => {
	const len = word.length;
	if (len === 4) {
		return Number(FREQ4.find((x) => x[0] === word)?.slice(1)[0]) || 0;
	} else if (len === 5) {
		return Number(FREQ5.find((x) => x[0] === word)?.slice(1)[0]) || 0;
	} else {
		console.error('Unsupported word length');
		return 0;
	}
};

/**
 * Sort by frequency
 * @param {string[]} words The words to sort
 */
const sortByFrequency = (words) => {
	return words.sort((a, b) => getFrequency(b) - getFrequency(a));
};

/**
 * Generate the 4-letter and 5-letter words for the game.
 */
export function generateWords() {
	let fourLetterList = [];
	/**
	 * @type {string[]}
	 */
	let fiveLetterList = [];

	for (let i = 0; i < 26; i++) {
		let letter = String.fromCharCode(97 + i); // 'a' to 'z'
		/**
		 * @type {string[]}
		 */
		let validPerms = [];
		let word;

		while (validPerms.length < 1) {
			// Pick a Wordle word that includes this letter
			word = getWordWithLetter(letter, cut(WORDLES.filter((x) => x.includes(letter))));
			if (!word) break;

			// Generate permutations for the other letters
			let otherLetters = word.replace(letter, '');
			let perms = permute(otherLetters, otherLetters.length);
			validPerms = sortByFrequency(filterWords(perms, letter === 'q' ? SCRABBLE4 : COMMON4)); // need more q words
		}

		if (word) {
			// 4-letter word: pick a high frequency permutation
			let bestPermutation = validPerms.length
				? validPerms[Math.floor(validPerms.length * Math.random() ** 2)]
				: '';
			fourLetterList.push(bestPermutation);

			// 5-letter word: the original Wordle word
			fiveLetterList.push(word);
		}
	}

	// Shuffle the lists but keep them in sync
	let zipped = fourLetterList.map((x, i) => [x, fiveLetterList[i]]);
	shuffle(zipped, true);
	fourLetterList = zipped.map((x) => x[0]);
	fiveLetterList = zipped.map((x) => x[1]);

	// Update the persistent stores
	fourLetterWords.set(fourLetterList);
	fiveLetterWords.set(fiveLetterList);
}
