<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    label: string
    template?: string
    channel?: 'whatsapp' | 'email'
  }
}>()
</script>

<template>
  <div class="bg-default border-2 border-green-500 rounded-xl px-4 py-3 shadow-md min-w-52">
    <Handle
      type="target"
      :position="Position.Top"
      class="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
    />
    <div class="flex items-center gap-2 mb-1.5">
      <div class="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
        <UIcon name="i-lucide-message-circle" class="w-3.5 h-3.5 text-green-600" />
      </div>
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wide text-green-600">
          Send Message
        </p>
        <p class="text-sm font-semibold text-highlighted leading-tight">
          {{ data.label }}
        </p>
      </div>
    </div>
    <p v-if="data.template" class="text-xs text-muted bg-elevated rounded-lg px-2 py-1 truncate">
      {{ data.template }}
    </p>
    <p v-else class="text-xs text-muted italic">
      No template selected
    </p>
    <Handle
      type="source"
      :position="Position.Bottom"
      class="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
    />
  </div>
</template>
