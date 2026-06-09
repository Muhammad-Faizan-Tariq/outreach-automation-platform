<script setup lang="ts">
const props = defineProps<{
  data: number[]
  color?: string
  maxHeight?: number
}>()

const max = computed(() => Math.max(...props.data, 1))

function barHeight(val: number): number {
  return Math.round((val / max.value) * (props.maxHeight ?? 24))
}
</script>

<template>
  <div class="flex items-end gap-0.5 h-6">
    <div
      v-for="(val, i) in data"
      :key="i"
      class="w-1.5 rounded-sm transition-all"
      :class="color ?? 'bg-primary'"
      :style="{ height: `${barHeight(val)}px`, opacity: val === 0 ? 0.2 : 1 }"
    />
  </div>
</template>
