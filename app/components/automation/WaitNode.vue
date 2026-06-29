<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    label: string
    delay?: number
    unit?: 'hours' | 'days'
  }
}>()
</script>

<template>
  <div class="bg-default border-2 border-orange-400 rounded-xl px-4 py-3 shadow-md min-w-44">
    <Handle
      type="target"
      :position="Position.Top"
      class="!w-3 !h-3 !bg-orange-400 !border-2 !border-white"
    />
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-lg bg-orange-400/10 flex items-center justify-center shrink-0">
        <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-orange-500" />
      </div>
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wide text-orange-500">
          Wait
        </p>
        <p class="text-sm font-semibold text-highlighted leading-tight">
          {{ data.delay ? `${data.delay} ${data.unit ?? 'days'}` : data.label }}
        </p>
      </div>
    </div>
    <Handle
      type="source"
      :position="Position.Bottom"
      class="!w-3 !h-3 !bg-orange-400 !border-2 !border-white"
    />
  </div>
</template>
