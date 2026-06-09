<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon?: string
  iconColor?: string
  iconBg?: string
  delta?: string
  deltaType?: 'up' | 'down' | 'neutral'
  to?: string
}>()
</script>

<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'div'"
    :to="to"
    :class="to ? 'block hover:shadow-md transition-shadow cursor-pointer' : ''"
  >
    <UCard class="h-full">
      <div class="flex items-start justify-between gap-3">

        <!-- Icon -->
        <div
          v-if="icon"
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          :class="iconBg ?? 'bg-primary/10'"
        >
          <UIcon :name="icon" class="w-5 h-5" :class="iconColor ?? 'text-primary'" />
        </div>

        <!-- Delta -->
        <span
          v-if="delta"
          class="text-xs font-medium shrink-0 mt-0.5"
          :class="{
            'text-success-600': deltaType === 'up',
            'text-error-600': deltaType === 'down',
            'text-muted': !deltaType || deltaType === 'neutral',
          }"
        >
          {{ delta }}
        </span>
      </div>

      <div :class="icon ? 'mt-3' : ''">
        <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ value }}</p>
        <p class="text-xs text-muted mt-0.5">{{ label }}</p>
      </div>
    </UCard>
  </component>
</template>
