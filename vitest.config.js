import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Unit tests only need the Svelte compiler, not SvelteKit's build setup. The browser condition
// makes Svelte load its client runtime, so components can be mounted in a test.
export default defineConfig({
	plugins: [svelte()],
	resolve: { conditions: ['browser'] }
});
