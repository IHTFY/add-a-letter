<script>
	import { AD_SLOT, showAd } from '#lib/ads.js';

	/** Names the finished puzzle, so coming back to it asks for no new ad. */
	export let adKey = '';
	/** @type {HTMLElement | undefined} */
	let box;

	$: if (box) showAd(box, adKey);
</script>

<!-- Below the words, at least 150px from the last input; the box keeps its size whether or not an ad fills it. -->
<aside class="mx-auto flex flex-col items-center gap-1.5 px-2 pt-[150px] pb-6 text-xs">
	<p class="text-muted-foreground">Advertisements</p>
	<div bind:this={box} class="h-[250px] min-h-[250px] w-[300px]" data-ad-slot={AD_SLOT}></div>
	<a
		href="https://ihtfy.com/privacy"
		target="_blank"
		rel="noopener"
		class="text-muted-foreground hover:text-foreground hover:underline">Privacy</a
	>
</aside>
