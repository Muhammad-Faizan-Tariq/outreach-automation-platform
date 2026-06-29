<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    label: string
    action?: string
  }
}>()
</script>

<template>
  <div class="bg-default border-2 border-blue-500 rounded-xl px-4 py-3 shadow-md min-w-44">
    <Handle
      type="target"
      :position="Position.Top"
      class="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
    />
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
        <UIcon name="i-lucide-tag" class="w-3.5 h-3.5 text-blue-600" />
      </div>
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
          Action
        </p>
        <p class="text-sm font-semibold text-highlighted leading-tight">
          {{ data.label }}
        </p>
      </div>
    </div>
  </div>
</template>
