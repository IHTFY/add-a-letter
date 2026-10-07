<script>
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { buttonVariants } from './index.js';
	import { cn } from '#lib/utils.js';

	/** @type {import('svelte/elements').HTMLButtonAttributes & { ref?: HTMLElement | null, variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link', size?: 'default' | 'sm' | 'lg' | 'icon' }} */
	let {
		class: className = undefined,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		children,
		...restProps
	} = $props();
</script>

<ButtonPrimitive.Root
	bind:ref
	class={cn(buttonVariants({ variant, size }), className)}
	type="button"
	{...restProps}
>
	{@render children?.()}
</ButtonPrimitive.Root>
