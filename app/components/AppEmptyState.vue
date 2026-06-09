<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 text-center">
    <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
      <UIcon :name="icon" class="w-7 h-7 text-primary" />
    </div>
    <h3 class="text-base font-semibold text-highlighted mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-muted max-w-xs mb-5">{{ description }}</p>
    <div v-if="$slots.actions">
      <slot name="actions" />
    </div>
  </div>
</template>
