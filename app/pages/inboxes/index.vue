<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Inbox } from '~/composables/useInboxes'

const route = useRoute()
const toast = useToast()
const { inboxes, loading, connectInbox, fetchInboxes } = useInboxes()

onMounted(async () => {
  await fetchInboxes()

  if (route.query.connected === 'true') {
    toast.add({
      title: 'Inbox connected',
      description: 'Your Gmail inbox has been connected successfully.',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  }
  else if (route.query.error) {
    toast.add({
      title: 'Connection failed',
      description: String(route.query.error).replace(/_/g, ' '),
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
})

const stats = computed(() => [
  {
    label: 'Total',
    value: inboxes.value.length,
    color: 'text-highlighted',
  },
  {
    label: 'Active',
    value: inboxes.value.filter(i => i.status === 'active').length,
    color: 'text-success-500',
  },
  {
    label: 'Warming',
    value: inboxes.value.filter(i => i.status === 'warming_up').length,
    color: 'text-warning-500',
  },
  {
    label: 'Paused',
    value: inboxes.value.filter(i =>
      ['paused', 'suspended', 'auth_expired', 'retired'].includes(i.status)
    ).length,
    color: 'text-muted',
  },
])

const columns: TableColumn<Inbox>[] = [
  { accessorKey: 'email', header: 'Email Address' },
  { accessorKey: 'domain', header: 'Domain' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'health', header: 'Health' },
  { id: 'usage', header: 'Daily Usage' },
  { id: 'connected', header: 'Connected' },
]

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const STATUS_COLOR: Record<string, BadgeColor> = {
  active: 'success',
  warming_up: 'warning',
  paused: 'neutral',
  suspended: 'error',
  auth_expired: 'error',
  retired: 'neutral',
}

function statusColor(status: string): BadgeColor {
  return (STATUS_COLOR[status] ?? 'neutral') as BadgeColor
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

function healthTextColor(score: number | null) {
  if (score === null) return 'text-muted'
  if (score >= 80) return 'text-success-500'
  if (score >= 60) return 'text-warning-500'
  return 'text-error-500'
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

function usagePct(sent: number, limit: number): number {
  if (limit === 0) return 0
  return Math.min(100, Math.round((sent / limit) * 100))
}
</script>

<template>
  <div class="min-h-screen bg-muted">
    <div class="max-w-7xl mx-auto px-6 py-8">

      <!-- Page header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-highlighted">
            Email Inboxes
          </h1>
          <p class="mt-1 text-sm text-muted">
            Manage your connected Gmail accounts
          </p>
        </div>
        <UButton
          icon="i-lucide-plus"
          :loading="loading"
          @click="connectInbox"
        >
          Connect inbox
        </UButton>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <UCard
          v-for="stat in stats"
          :key="stat.label"
          class="text-center"
        >
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {{ stat.label }}
          </p>
          <p class="text-3xl font-semibold" :class="stat.color">
            {{ stat.value }}
          </p>
        </UCard>
      </div>

      <!-- Empty state -->
      <template v-if="!loading && inboxes.length === 0">
        <UCard class="flex flex-col items-center justify-center py-24">
          <div class="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-5">
            <UIcon name="i-lucide-mail" class="w-8 h-8 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-highlighted mb-2">
            No inboxes connected yet
          </h3>
          <p class="text-sm text-muted text-center max-w-xs mb-7">
            Connect a Gmail account to start sending cold emails from your own inbox.
          </p>
          <UButton icon="i-lucide-plus" size="lg" @click="connectInbox">
            Connect your first inbox
          </UButton>
        </UCard>
      </template>

      <!-- Inboxes table -->
      <template v-else>
        <UCard :ui="{ body: 'p-0' }">
          <UTable :data="inboxes" :columns="columns" :loading="loading">

            <!-- Email + display name -->
            <template #email-cell="{ row }">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <UIcon name="i-simple-icons-gmail" class="w-4 h-4 text-red-500" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-highlighted truncate">
                    {{ row.original.email }}
                  </p>
                  <p class="text-xs text-muted truncate">
                    {{ row.original.display_name }}
                  </p>
                </div>
              </div>
            </template>

            <!-- Domain -->
            <template #domain-cell="{ row }">
              <span class="text-sm text-default">{{ row.original.domain }}</span>
            </template>

            <!-- Status badge -->
            <template #status-cell="{ row }">
              <UBadge :color="statusColor(row.original.status)" variant="subtle" class="capitalize">
                {{ statusLabel(row.original.status) }}
              </UBadge>
            </template>

            <!-- Health score -->
            <template #health-cell="{ row }">
              <span
                class="text-sm font-semibold tabular-nums"
                :class="healthTextColor(row.original.deliverability_score)"
              >
                {{ row.original.deliverability_score != null
                  ? row.original.deliverability_score.toFixed(0)
                  : '—' }}
              </span>
            </template>

            <!-- Daily usage progress -->
            <template #usage-cell="{ row }">
              <div class="w-32">
                <div class="flex justify-between text-xs text-muted mb-1">
                  <span class="tabular-nums">
                    {{ row.original.current_day_sent }} / {{ row.original.daily_send_limit }}
                  </span>
                  <span>{{ usagePct(row.original.current_day_sent, row.original.daily_send_limit) }}%</span>
                </div>
                <div class="h-1.5 bg-elevated rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary rounded-full transition-all duration-300"
                    :style="{
                      width: `${usagePct(row.original.current_day_sent, row.original.daily_send_limit)}%`,
                    }"
                  />
                </div>
              </div>
            </template>

            <!-- Connected (relative date) -->
            <template #connected-cell="{ row }">
              <span class="text-sm text-muted">{{ relativeTime(row.original.created_at) }}</span>
            </template>

          </UTable>
        </UCard>
      </template>

    </div>
  </div>
</template>
