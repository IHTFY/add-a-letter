<script>
	import { dev } from '$app/env';
	import { onMount } from 'svelte';

	// Shown between asking the new version to take over and the reload that loads it.
	let updating = $state(false);

	onMount(() => {
		if (dev || !('serviceWorker' in navigator)) return;

		const listeners = new AbortController();
		const options = { signal: listeners.signal };
		// Pages that started without a service worker are taken over by the first one without a
		// reload; any later change of worker means a new version, so reload to load its files.
		let controlled = Boolean(navigator.serviceWorker.controller);
		let reloading = false;
		/** @type {ServiceWorkerRegistration | undefined} */
		let registration;

		// Answers are saved, so updating never loses progress, but don't reload under someone
		// mid-word: wait until they leave the input or switch away from the app.
		function applyUpdate() {
			const waiting = registration?.waiting;
			if (!waiting || !navigator.serviceWorker.controller) return;
			const typing =
				document.visibilityState === 'visible' &&
				document.activeElement instanceof HTMLInputElement;
			if (typing) return;
			updating = true;
			waiting.postMessage({ type: 'SKIP_WAITING' });
		}

		function checkForUpdate() {
			// Fails while offline; the next open or return to the app tries again.
			registration?.update().catch(() => {});
		}

		navigator.serviceWorker.addEventListener(
			'controllerchange',
			() => {
				if (!controlled) {
					controlled = true;
					return;
				}
				if (reloading) return;
				reloading = true;
				location.reload();
			},
			options
		);

		navigator.serviceWorker
			.register('./service-worker.js')
			.then((reg) => {
				if (listeners.signal.aborted) return;
				registration = reg;
				reg.addEventListener(
					'updatefound',
					() => {
						const worker = reg.installing;
						worker?.addEventListener(
							'statechange',
							() => {
								if (worker.state === 'installed') applyUpdate();
							},
							options
						);
					},
					options
				);
				// A version downloaded on an earlier visit may already be waiting.
				applyUpdate();
				checkForUpdate();
			})
			.catch((error) =>
				console.error('Service worker not registered; offline play is off.', error)
			);

		document.addEventListener(
			'visibilitychange',
			() => {
				if (document.visibilityState === 'visible') checkForUpdate();
				else applyUpdate();
			},
			options
		);
		// Focus has moved on by the time this runs, so check where it went.
		document.addEventListener('focusout', () => setTimeout(applyUpdate), options);
		// Installed apps can stay open for days.
		const interval = setInterval(checkForUpdate, 60 * 60 * 1000);

		return () => {
			listeners.abort();
			clearInterval(interval);
		};
	});
</script>

{#if updating}
	<p
		role="status"
		class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg"
	>
		Updating to the latest version…
	</p>
{/if}
