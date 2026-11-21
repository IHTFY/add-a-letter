/**
 * Installed-app launch: the A+ from the launch screen takes the title's color and lands on the
 * start of the "Add A Letter" heading while the green launch screen fades away. The head script
 * in app.html decides whether a launch is playing; this only supplies the animation.
 */
export function playLaunchExit() {
	/** @type {{ launchExit?: (play: (overlay: HTMLElement) => Animation[]) => void }} */ (
		globalThis
	).launchExit?.((overlay) => {
		const icon = document.getElementById('launch-icon');
		const title = document.querySelector('main h1');
		if (!icon || !title) return [];
		const from = icon.getBoundingClientRect();
		const to = title.getBoundingClientRect();
		// The A+ fills about 45% of the icon box. Land it at the heading's height, on its first letter.
		const scale = to.height / (from.height * 0.45);
		const dx = to.left + (from.width * 0.45 * scale) / 2 - (from.left + from.width / 2);
		const dy = to.top + to.height / 2 - (from.top + from.height / 2);
		const easing = 'cubic-bezier(0.5, 0, 0.2, 1)';
		return [
			overlay.animate(
				{ backgroundColor: ['#16a34a', 'rgb(22 163 74 / 0)'] },
				{ duration: 600, easing: 'ease-in', fill: 'forwards' }
			),
			document
				.getElementById('launch-name')
				?.animate({ opacity: [1, 0] }, { duration: 150, fill: 'forwards' }),
			icon.animate(
				{
					transform: ['none', `translate(${dx}px, ${dy}px) scale(${scale})`],
					color: ['#fff', getComputedStyle(title).color],
					opacity: [1, 1, 0],
					offset: [0, 0.8, 1]
				},
				{ duration: 900, easing, fill: 'forwards' }
			)
		].filter((a) => a !== undefined);
	});
}
