// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare global {
	interface Window {
		/** The shared ad loader, once https://ihtfy.com/ads/v1.js has loaded. */
		ihtfyAds: { show(box: HTMLElement, key: string): void };
	}
}

export {};
