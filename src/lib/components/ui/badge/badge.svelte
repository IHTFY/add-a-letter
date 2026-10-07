<script>
	import { badgeVariants } from './index.js';
	import { cn } from '#lib/utils.js';

	/** @type {import('svelte/elements').HTMLAnchorAttributes & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }} */
	let {
		class: className = undefined,
		href = undefined,
		variant = 'default',
		children,
		...restProps
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
