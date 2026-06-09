<script setup lang="ts">
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const props = defineProps<{
  status: string
  colorMap: Record<string, BadgeColor>
  labelMap?: Record<string, string>
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'subtle' | 'outline' | 'soft'
}>()

function color(): BadgeColor {
  return (props.colorMap[props.status] ?? 'neutral') as BadgeColor
}

function label(): string {
  return props.labelMap?.[props.status] ?? props.status.replace(/_/g, ' ')
}
</script>

<template>
  <UBadge
    :color="color()"
    :variant="variant ?? 'subtle'"
    :size="size ?? 'sm'"
    class="capitalize"
  >
    {{ label() }}
  </UBadge>
</template>
