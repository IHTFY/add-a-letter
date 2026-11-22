// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESULTS_DELAY } from '../src/lib/ads.js';

const wordFile = readFileSync('src/lib/wordleall.txt', 'utf8');

/** Script tags the page tried to add, which is how a loader request shows. @type {any[]} */
let added;
/** @type {any} */
let component;
/** @type {typeof import('svelte').unmount} */
let unmount;
/** @type {typeof import('svelte').flushSync} */
let flushSync;

beforeEach(() => {
	added = [];
	vi.useFakeTimers();
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => ({ ok: true, text: async () => wordFile }))
	);
	vi.stubGlobal('scrollTo', vi.fn());
	vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
		added.push(el);
		return el;
	});
	localStorage.clear();
});

afterEach(async () => {
	if (component) await unmount?.(component);
	component = null;
	document.body.innerHTML = '';
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
	localStorage.clear();
});

async function mountGame() {
	// Svelte comes from the same fresh module graph as the component, so they share one runtime.
	vi.resetModules();
	const svelte = await import('svelte');
	({ unmount, flushSync } = svelte);
	const { default: Game } = await import('../src/lib/components/Game.svelte');
	component = svelte.mount(Game, { target: document.body });
	flushSync();
}

/** @param {string} text */
function button(text) {
	return [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
}

/** The puzzle view (the first `main`), which the results screen hides while it shows. */
function puzzle() {
	return /** @type {HTMLElement} */ (document.querySelector('main'));
}

async function showAnswers() {
	button('Show Answers')?.click();
	flushSync();
	await vi.advanceTimersByTimeAsync(RESULTS_DELAY + 100);
	flushSync();
}

// The first test compiles the component and the word list, which is slow on a loaded machine.
describe('results screen', { timeout: 60000 }, () => {
	it('shows the results and the ad box to a player without the purchase', async () => {
		await mountGame();
		await showAnswers();
		expect(document.body.textContent).toContain('Answers shown');
		expect(button('Review the words')).toBeTruthy();
		expect(document.querySelector('[data-ad-slot]')).toBeTruthy();
		expect(document.body.textContent).toContain('Advertisements');
		expect(added).toHaveLength(1);
	});

	it.each([
		['a token', 'any-token'],
		['a stale token', 'expired']
	])('shows the results but no ad to a player with %s', async (_, token) => {
		localStorage.setItem('ihtfy-ad-free', token);
		await mountGame();
		await showAnswers();
		expect(document.body.textContent).toContain('Answers shown');
		expect(button('Review the words')).toBeTruthy();
		expect(document.querySelector('[data-ad-slot]')).toBeNull();
		expect(document.body.textContent).not.toContain('Advertisements');
		expect(added).toHaveLength(0);
	});

	it('shows buyers the results from the ad-free cookie too', async () => {
		document.cookie = 'ihtfy-ad-free=token';
		try {
			await mountGame();
			await showAnswers();
			expect(button('Review the words')).toBeTruthy();
			expect(added).toHaveLength(0);
		} finally {
			document.cookie = 'ihtfy-ad-free=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		}
	});

	it.each([
		['without the purchase', null],
		['with the purchase', 'token']
	])('comes back to the puzzle for good after Review the words %s', async (_, token) => {
		if (token) localStorage.setItem('ihtfy-ad-free', token);
		await mountGame();
		await showAnswers();
		const review = button('Review the words');
		expect(review).toBeTruthy();
		expect(puzzle().hidden).toBe(true);
		review?.click();
		flushSync();
		expect(puzzle().hidden).toBe(false);
		await vi.advanceTimersByTimeAsync(RESULTS_DELAY * 3);
		flushSync();
		expect(button('Review the words')).toBeUndefined();
		expect(puzzle().hidden).toBe(false);
		expect(puzzle().querySelectorAll('input')).toHaveLength(26);
	});
});
