<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    label: string
    condition?: string
  }
}>()
</script>

<template>
  <div class="bg-default border-2 border-purple-500 rounded-xl px-4 py-3 shadow-md min-w-52">
    <Handle
      type="target"
      :position="Position.Top"
      class="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
    />
    <div class="flex items-center gap-2 mb-3">
      <div class="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
        <UIcon name="i-lucide-split" class="w-3.5 h-3.5 text-purple-600" />
      </div>
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wide text-purple-600">
          Condition
        </p>
        <p class="text-sm font-semibold text-highlighted leading-tight">
          {{ data.label }}
        </p>
      </div>
    </div>

    <!-- Yes / No labels -->
    <div class="flex justify-between text-[10px] font-semibold px-1">
      <span class="text-success-600">✓ Yes</span>
      <span class="text-error-500">✗ No</span>
    </div>

    <!-- Two output handles -->
    <Handle
      id="yes"
      type="source"
      :position="Position.Bottom"
      :style="{ left: '25%' }"
      class="!w-3 !h-3 !bg-success-500 !border-2 !border-white"
    />
    <Handle
      id="no"
      type="source"
      :position="Position.Bottom"
      :style="{ left: '75%' }"
      class="!w-3 !h-3 !bg-error-500 !border-2 !border-white"
    />
  </div>
</template>
