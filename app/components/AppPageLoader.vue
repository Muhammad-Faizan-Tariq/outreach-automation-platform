<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-105 gap-5">
    <div class="relative">
      <div class="w-16 h-16 rounded-full border-4 border-primary/20" />
      <div class="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
    <div class="text-center">
      <p class="text-sm font-medium text-highlighted">{{ label ?? 'Loading…' }}</p>
      <p class="text-xs text-muted mt-1">Please wait</p>
    </div>
  </div>
</template>
