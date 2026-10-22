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
	document.cookie = 'ihtfy-ad-free=; Max-Age=0';
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
});
