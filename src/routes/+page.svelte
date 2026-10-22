<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.css';

	import { loadForBuyer } from '#lib/ads.js';
	import AppUpdater from '#lib/components/AppUpdater.svelte';
	import Game from '#lib/components/Game.svelte';

	onMount(loadForBuyer);
</script>

<!-- Browser bar colors match the page background in each mode -->
<ModeWatcher themeColors={{ light: '#f2f2f2', dark: '#020817' }} />

<Game />
<AppUpdater />
