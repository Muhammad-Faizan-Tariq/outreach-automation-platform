<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label: string } }>()
</script>

<template>
  <div class="bg-primary text-white rounded-xl px-4 py-3 shadow-lg min-w-44 border-2 border-primary">
    <div class="flex items-center gap-2">
      <UIcon name="i-lucide-zap" class="w-4 h-4 shrink-0" />
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wide opacity-75">
          Trigger
        </p>
        <p class="text-sm font-semibold leading-tight">
          {{ data.label }}
        </p>
      </div>
    </div>
    <Handle
      type="source"
      :position="Position.Bottom"
      class="!w-3 !h-3 !bg-white !border-2 !border-primary"
    />
  </div>
</template>
