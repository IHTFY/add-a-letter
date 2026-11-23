<script lang="ts">
	import '#lib/storageGuard.js';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.css';

	import { loadForBuyer } from '#lib/ads.js';
	import AppUpdater from '#lib/components/AppUpdater.svelte';
	import Game from '#lib/components/Game.svelte';

	onMount(loadForBuyer);
</script>

<!-- Browser bar colors match the page background in each mode -->
<ModeWatcher themeColors={{ light: '#f8edda', dark: '#191715' }} />

<Game />
<AppUpdater />
