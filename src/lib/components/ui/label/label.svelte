<script>
	import { Label as LabelPrimitive } from 'bits-ui';
	import { cn } from '#lib/utils.js';

	/** @type {import('bits-ui').LabelRootProps} */
	let { class: className = undefined, ref = $bindable(null), ...restProps } = $props();
</script>

<LabelPrimitive.Root
	bind:ref
	class={cn(
		'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
		className
	)}
	{...restProps}
/>
