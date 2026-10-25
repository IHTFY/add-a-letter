// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** @type {any[]} */
let added;

async function loadAds() {
	vi.resetModules();
	return import('../src/lib/ads.js');
}

beforeEach(() => {
	added = [];
	// Record script tags instead of fetching them.
	vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
		added.push(el);
		return el;
	});
	/** @type {any} */ (window).ihtfyAds = { show: vi.fn() };
});

afterEach(() => {
	vi.restoreAllMocks();
	delete (/** @type {any} */ (window).ihtfyAds);
	localStorage.clear();
	document.cookie = 'ihtfy-ad-free=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
});

describe('showAd', () => {
	it('adds the loader once and asks it for the ad when it arrives', async () => {
		const { showAd } = await loadAds();
		const box = document.createElement('div');
		document.body.append(box);
		showAd(box, 'a');
		showAd(box, 'b');
		expect(added).toHaveLength(1);
		added[0].dispatchEvent(new Event('load'));
		await new Promise((resolve) => setTimeout(resolve));
		expect(window.ihtfyAds.show).toHaveBeenCalledWith(box, 'a');
		box.remove();
	});
});

describe('loadForBuyer', () => {
	it('loads nothing for a visitor without an ad-free token', async () => {
		const { loadForBuyer } = await loadAds();
		loadForBuyer();
		expect(added).toHaveLength(0);
	});

	it('loads the loader at startup when localStorage holds a token', async () => {
		localStorage.setItem('ihtfy-ad-free', 'token');
		const { loadForBuyer, showAd } = await loadAds();
		loadForBuyer();
		expect(added).toHaveLength(1);
		expect(added[0].src).toBe('https://ihtfy.com/ads/v1.js');
		showAd(document.createElement('div'), 'a');
		expect(added).toHaveLength(1);
	});

	it('loads the loader at startup when only the cookie holds a token', async () => {
		document.cookie = 'ihtfy-ad-free=token';
		const { loadForBuyer } = await loadAds();
		loadForBuyer();
		expect(added).toHaveLength(1);
	});

	it('starts quietly when storage and cookies both throw', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('denied');
		});
		Object.defineProperty(document, 'cookie', {
			configurable: true,
			get() {
				throw new Error('denied');
			}
		});
		try {
			const { loadForBuyer } = await loadAds();
			expect(() => loadForBuyer()).not.toThrow();
			expect(added).toHaveLength(0);
		} finally {
			// @ts-expect-error removes the own property added above
			delete document.cookie;
		}
	});
});

describe('adForScreen', () => {
	it('gives the results screen a box', async () => {
		const { adForScreen, AD_SLOT } = await loadAds();
		expect(adForScreen('results', { buyer: false })).toEqual({ slot: AD_SLOT });
	});

	it('never gives the play screen or any other screen a box', async () => {
		const { adForScreen } = await loadAds();
		for (const screen of ['play', 'home', 'menu', 'levels', 'stats', 'help', 'settings']) {
			expect(adForScreen(screen, { buyer: false })).toBeNull();
		}
	});

	it('never gives a buyer a box', async () => {
		const { adForScreen } = await loadAds();
		expect(adForScreen('results', { buyer: true })).toBeNull();
		expect(adForScreen('play', { buyer: true })).toBeNull();
	});
});

describe('mayBeAdFree', () => {
	it('is true with a token in localStorage or the cookie, false without', async () => {
		const { mayBeAdFree } = await loadAds();
		expect(mayBeAdFree()).toBe(false);
		localStorage.setItem('ihtfy-ad-free', 'token');
		expect(mayBeAdFree()).toBe(true);
		localStorage.clear();
		document.cookie = 'ihtfy-ad-free=token';
		expect(mayBeAdFree()).toBe(true);
	});
});

describe('fitAdSize', () => {
	it('takes the largest size whose aside fits, and none when nothing does', async () => {
		const { fitAdSize, AD_ASIDE_EXTRA } = await loadAds();
		expect(fitAdSize(AD_ASIDE_EXTRA + 250)).toBe('300x250');
		expect(fitAdSize(AD_ASIDE_EXTRA + 249)).toBe('320x100');
		expect(fitAdSize(AD_ASIDE_EXTRA + 99)).toBe('320x50');
		expect(fitAdSize(AD_ASIDE_EXTRA + 49)).toBeNull();
	});
});
