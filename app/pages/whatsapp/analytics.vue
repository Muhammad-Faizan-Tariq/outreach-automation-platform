<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

const { summary, campaignStats, walletBalance, channels, loading, error, fetchAnalytics, fetchWallet, fetchChannels } = useWaAnalytics()

onMounted(async () => {
  await Promise.all([fetchAnalytics(), fetchWallet(), fetchChannels()])
})

const columns: ColumnDef<any>[] = [
  { accessorKey: 'name', header: 'Campaign' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'total_sent', header: 'Sent' },
  { accessorKey: 'total_delivered', header: 'Delivered' },
  { accessorKey: 'total_read', header: 'Read' },
  { accessorKey: 'delivery_rate', header: 'Delivery %' },
  { accessorKey: 'read_rate', header: 'Read %' },
  { accessorKey: 'started_at', header: 'Started' },
]

type StatusColor = 'success' | 'warning' | 'neutral' | 'error' | 'info'
function statusColor(s: string): StatusColor {
  const map: Record<string, StatusColor> = { running: 'success', paused: 'warning', completed: 'info', failed: 'error', draft: 'neutral' }
  return map[s] ?? 'neutral'
}

const isFirstLoad = computed(() => loading.value && !summary.value)
</script>

<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">WA Analytics</h1>
        <p class="text-sm text-muted mt-0.5">Overall WhatsApp campaign performance</p>
      </div>
      <div v-if="walletBalance !== null" class="flex items-center gap-2 bg-default border border-default rounded-xl px-4 py-2">
        <UIcon name="i-lucide-wallet" class="w-4 h-4 text-muted" />
        <span class="text-sm font-semibold text-highlighted">{{ walletBalance }}</span>
        <span class="text-xs text-muted">wallet balance</span>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 px-4 py-3 bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800 rounded-xl text-sm text-error-600 dark:text-error-400">
      {{ error }}
    </div>

    <!-- Summary skeleton -->
    <div v-if="isFirstLoad" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <USkeleton v-for="i in 4" :key="i" class="h-24 rounded-xl" />
    </div>

    <!-- Summary cards -->
    <div v-else-if="summary" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-default border border-default rounded-xl px-5 py-4">
        <p class="text-xs text-muted uppercase tracking-wide">Total Sent</p>
        <p class="text-3xl font-bold text-highlighted mt-1">{{ summary.total_sent.toLocaleString() }}</p>
      </div>
      <div class="bg-default border border-default rounded-xl px-5 py-4">
        <p class="text-xs text-muted uppercase tracking-wide">Delivered</p>
        <p class="text-3xl font-bold text-success-600 mt-1">{{ summary.total_delivered.toLocaleString() }}</p>
        <p class="text-sm text-success-600 mt-0.5">{{ summary.delivery_rate }}% rate</p>
      </div>
      <div class="bg-default border border-default rounded-xl px-5 py-4">
        <p class="text-xs text-muted uppercase tracking-wide">Read</p>
        <p class="text-3xl font-bold text-primary mt-1">{{ summary.total_read.toLocaleString() }}</p>
        <p class="text-sm text-primary mt-0.5">{{ summary.read_rate }}% rate</p>
      </div>
      <div class="bg-default border border-default rounded-xl px-5 py-4">
        <p class="text-xs text-muted uppercase tracking-wide">Failed</p>
        <p class="text-3xl font-bold text-error-600 mt-1">{{ summary.total_failed.toLocaleString() }}</p>
      </div>
    </div>

    <!-- Channels -->
    <div v-if="channels.length > 0" class="mb-8">
      <h2 class="text-base font-semibold text-highlighted mb-3">Connected Channels</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="ch in channels" :key="ch.id ?? ch.waba_id" class="bg-default border border-default rounded-xl px-4 py-3 space-y-1">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-smartphone" class="w-4 h-4 text-success-600" />
            <span class="text-sm font-semibold text-highlighted">{{ ch.display_phone_number ?? ch.phone_number ?? ch.id }}</span>
          </div>
          <p class="text-xs text-muted">{{ ch.verified_name ?? ch.name ?? '—' }}</p>
          <p v-if="ch.quality_rating" class="text-xs">Quality: <span class="font-medium capitalize">{{ ch.quality_rating.toLowerCase() }}</span></p>
        </div>
      </div>
    </div>

    <!-- Campaign breakdown -->
    <h2 class="text-base font-semibold text-highlighted mb-3">Campaign Breakdown</h2>

    <div v-if="isFirstLoad" class="space-y-2">
      <USkeleton v-for="i in 6" :key="i" class="h-12 rounded-xl" />
    </div>

    <UCard v-else class="overflow-hidden p-0">
      <UTable :data="campaignStats" :columns="columns">

        <template #name-cell="{ row }">
          <NuxtLink :to="`/whatsapp/campaigns/${row.original.id}`" class="text-sm font-medium text-primary hover:underline">
            {{ row.original.name }}
          </NuxtLink>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">{{ row.original.status }}</UBadge>
        </template>

        <template #total_sent-cell="{ row }">
          <span class="text-sm text-default">{{ row.original.total_sent.toLocaleString() }}</span>
        </template>

        <template #total_delivered-cell="{ row }">
          <span class="text-sm text-default">{{ row.original.total_delivered.toLocaleString() }}</span>
        </template>

        <template #total_read-cell="{ row }">
          <span class="text-sm text-default">{{ row.original.total_read.toLocaleString() }}</span>
        </template>

        <template #delivery_rate-cell="{ row }">
          <div class="flex items-center gap-2">
            <div class="w-16 h-1.5 bg-elevated rounded-full overflow-hidden">
              <div class="h-full bg-success-500 rounded-full" :style="{ width: row.original.delivery_rate + '%' }" />
            </div>
            <span class="text-sm text-success-600 font-medium">{{ row.original.delivery_rate }}%</span>
          </div>
        </template>

        <template #read_rate-cell="{ row }">
          <div class="flex items-center gap-2">
            <div class="w-16 h-1.5 bg-elevated rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full" :style="{ width: row.original.read_rate + '%' }" />
            </div>
            <span class="text-sm text-primary font-medium">{{ row.original.read_rate }}%</span>
          </div>
        </template>

        <template #started_at-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.started_at ? new Date(row.original.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }}</span>
        </template>

        <template #empty>
          <div class="text-center py-12 text-muted">
            <UIcon name="i-lucide-bar-chart-3" class="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p class="text-sm">No campaign data yet.</p>
          </div>
        </template>

      </UTable>
    </UCard>

  </div>
</template>
