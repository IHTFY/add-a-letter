import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig(async ({ command }) => ({
	plugins: [
		tailwindcss(),
		await sveltekit({
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: undefined,
				precompress: false,
				strict: true
			}),
			// Registered by AppUpdater.svelte so updates can wait until the player isn't typing.
			serviceWorker: { register: false },
			paths: {
				base:
					command === 'serve' ? '' : /** @type {'' | `/${string}`} */ (process.env.BASE_PATH ?? '')
			}
		})
	]
}));
