/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { resolve } from '$app/paths';
import { self } from '$app/service-worker';

// One cache per deployment, so a new version never mixes with files from an old one.
const CACHE = `cache-${version}`;

// GitHub Pages deployment metadata isn't part of the app.
const appAssets = assets.filter(
	({ path }) => !path.split('/').some((part) => part.startsWith('.') || part === 'CNAME')
);

// Manifest paths are relative to the app's root; the root itself is the prerendered page.
const SHELL = resolve('/');
const ASSETS = [...immutable, ...appAssets, ...prerendered].map(({ path }) => SHELL + path);
const PRECACHED = new Set(ASSETS);

self.addEventListener('install', (event) => {
	// Fetch past the HTTP cache so a new version never precaches stale files.
	// The new worker then waits until the page asks it to take over (see `message`).
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })));
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Delete every older version's files, then take over open pages.
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
		await self.clients.claim();
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		if (url.origin === self.location.origin) {
			// The app's own files always come from this version's cache, never the network.
			if (PRECACHED.has(url.pathname)) {
				const cached = await cache.match(url.pathname);
				if (cached) return cached;
			}

			// Page loads, including the installed app's start URL with a query, get the cached page.
			if (event.request.mode === 'navigate') {
				const shell = await cache.match(SHELL);
				if (shell) return shell;
			}
		}

		// Anything else goes to the network, falling back to the cache when offline.
		try {
			return await fetch(event.request);
		} catch (error) {
			const cached = await cache.match(event.request);
			if (cached) return cached;
			throw error;
		}
	}

	event.respondWith(respond());
});
