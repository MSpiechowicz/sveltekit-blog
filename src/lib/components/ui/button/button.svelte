<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { type Props, buttonVariants } from './index.js';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		children,
		...restProps
	}: Props = $props();
</script>

<ButtonPrimitive.Root
	bind:ref
	class={cn(buttonVariants({ variant, size }), className)}
	{...restProps}>
	{@render children?.()}
</ButtonPrimitive.Root>
