<script>
	import { AD_SLOT, adFits, fitAdSize, showAd } from '#lib/ads.js';

	/** Names the finished puzzle, so coming back to it asks for no new ad. */
	export let adKey = '';
	/**
	 * The content this ad sits under. The box takes the largest size that fits on the screen
	 * below it, measured once, and none if no size fits.
	 * @type {HTMLElement | undefined}
	 */
	export let above = undefined;

	/** Undefined until measured; null when no size fits. @type {string | null | undefined} */
	let size;
	/** Whether the box still fits on the screen, which turning the phone can change. */
	let fits = true;
	/** @type {HTMLElement | undefined} */
	let box;

	/** The height from the end of the content to the bottom of the screen. */
	function space() {
		if (!above) return 0;
		// The grid gap between the content and the aside takes room too.
		const gap = parseFloat(getComputedStyle(above.parentElement ?? above).rowGap) || 0;
		return innerHeight - above.getBoundingClientRect().bottom - scrollY - gap;
	}

	$: if (above && size === undefined) size = fitAdSize(space());
	// The ad keeps the size it was asked for. When the screen turns and the box no longer fits,
	// it is hidden instead of asking for a second ad at another size.
	function refit() {
		if (size) fits = adFits(size, space());
	}
	$: [width, height] = size?.split('x') ?? [];
	$: if (box) showAd(box, adKey);
</script>

<svelte:window on:resize={refit} />

<!-- The Privacy link comes first, then the label, and the box last, so the box keeps over 50px from
every link (the loader adds "Remove ads" beside Privacy). The box keeps its size whether or not an ad fills it. -->
{#if size}
	<aside hidden={!fits} class="grid justify-items-center text-xs text-muted-foreground">
		<a
			href="https://ihtfy.com/privacy/"
			target="_blank"
			rel="noopener"
			class="inline-block px-2 py-1 leading-[17px] hover:text-foreground hover:underline">Privacy</a
		>
		<!-- 32 + 17 + 4 puts the box 53px below the link. -->
		<p class="mt-8 mb-1 leading-[17px]">Advertisements</p>
		<div
			bind:this={box}
			style:width="{width}px"
			style:height="{height}px"
			data-ad-slot={AD_SLOT}
			data-ad-size={size}
		></div>
	</aside>
{/if}
