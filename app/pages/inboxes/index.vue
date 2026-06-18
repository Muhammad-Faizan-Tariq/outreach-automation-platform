<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { EmailAccountSummary } from '~/composables/useInboxes'

const route = useRoute()
const toast = useToast()
const { inboxes, total, loading, listInboxes, pauseInbox, resumeInbox, retireInbox, watchInbox, startGoogleOAuth } = useInboxes()
const { public: cfg } = useRuntimeConfig()

// ── filters + pagination ──────────────────────────────────────────────
const search = ref('')
const statusFilter = ref('all')
const page = ref(1)
const pageSize = 50

async function load() {
  await listInboxes({
    page: page.value,
    page_size: pageSize,
    status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
    search: search.value.trim() || undefined,
  })
}

onMounted(async () => {
  // Handle OAuth callback params
  if (route.query.connected) {
    toast.add({
      title: 'Inbox connected',
      description: `${route.query.connected} is now active.`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  }
  if (route.query.error) {
    toast.add({
      title: 'Connection failed',
      description: String(route.query.error),
      color: 'error',
      icon: 'i-lucide-x-circle',
    })
  }
  await load()
})

const isFirstLoad = computed(() => loading.value && inboxes.value.length === 0)

watch(page, load)
watch(statusFilter, () => { page.value = 1; load() })

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, cfg.searchDebounce)
})
onUnmounted(() => { if (searchTimer) clearTimeout(searchTimer) })

// ── connect OAuth ─────────────────────────────────────────────────────
const connecting = ref(false)

async function connectInbox() {
  connecting.value = true
  try {
    const url = await startGoogleOAuth()
    window.location.href = url
  }
  catch (e: any) {
    toast.add({ title: 'Failed to start connection', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
    connecting.value = false
  }
}

// ── row actions ───────────────────────────────────────────────────────
async function doAction(action: () => Promise<unknown>, successMsg: string) {
  try {
    await action()
    toast.add({ title: successMsg, color: 'neutral', icon: 'i-lucide-check' })
    await load()
  }
  catch (e: any) {
    toast.add({ title: 'Action failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
}

function rowActions(inbox: EmailAccountSummary): DropdownMenuItem[][] {
  const items: DropdownMenuItem[] = [
    { label: 'View details', icon: 'i-lucide-external-link', to: `/inboxes/${inbox.id}` },
  ]
  if (inbox.status === 'active' || inbox.status === 'warming_up') {
    items.push({ label: 'Pause', icon: 'i-lucide-pause', onSelect: () => doAction(() => pauseInbox(inbox.id), 'Inbox paused') })
  }
  if (inbox.status === 'paused' || inbox.status === 'suspended') {
    items.push({ label: 'Resume', icon: 'i-lucide-play', onSelect: () => doAction(() => resumeInbox(inbox.id), 'Inbox resumed') })
  }
  if (inbox.status !== 'retired') {
    items.push({ label: 'Re-register watch', icon: 'i-lucide-rss', onSelect: () => doAction(() => watchInbox(inbox.id), 'Watch registered') })
    items.push({ label: 'Retire', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => doAction(() => retireInbox(inbox.id), 'Inbox retired') })
  }
  return [items]
}

// ── stats ─────────────────────────────────────────────────────────────
const stats = computed(() => [
  { label: 'Total', value: total.value, color: 'text-highlighted', icon: 'i-lucide-mail' },
  { label: 'Active', value: inboxes.value.filter(i => i.status === 'active').length, color: 'text-success-600', icon: 'i-lucide-check-circle' },
  { label: 'Warming', value: inboxes.value.filter(i => i.status === 'warming_up').length, color: 'text-warning-600', icon: 'i-lucide-thermometer' },
  { label: 'Paused / Issues', value: inboxes.value.filter(i => ['paused', 'suspended', 'auth_expired', 'retired'].includes(i.status)).length, color: 'text-muted', icon: 'i-lucide-pause-circle' },
])

// ── table ─────────────────────────────────────────────────────────────
const columns: TableColumn<EmailAccountSummary>[] = [
  { accessorKey: 'email', header: 'Email Address' },
  { accessorKey: 'domain', header: 'Domain' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'health', header: 'Health' },
  { id: 'usage', header: 'Daily Usage' },
  { id: 'totalSent', header: 'Total Sent' },
  { id: 'connected', header: 'Connected' },
  { id: 'actions', header: '' },
]

// ── helpers ───────────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const STATUS_COLOR: Record<string, BadgeColor> = {
  active: 'success',
  warming_up: 'warning',
  paused: 'neutral',
  suspended: 'error',
  auth_expired: 'error',
  retired: 'neutral',
}

function statusColor(s: string): BadgeColor { return (STATUS_COLOR[s] ?? 'neutral') as BadgeColor }
function statusLabel(s: string): string { return s.replace(/_/g, ' ') }

function healthTextColor(score: number | null): string {
  if (score === null) return 'text-muted'
  if (score >= 80) return 'text-success-600'
  if (score >= 60) return 'text-warning-600'
  return 'text-error-600'
}

function usagePct(sent: number, limit: number): number {
  if (!limit) return 0
  return Math.min(100, Math.round((sent / limit) * 100))
}

function relDate(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Warming up', value: 'warming_up' },
  { label: 'Paused', value: 'paused' },
  { label: 'Auth expired', value: 'auth_expired' },
  { label: 'Retired', value: 'retired' },
]
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Email Inboxes</h1>
        <p class="mt-0.5 text-sm text-muted">{{ total }} connected Gmail accounts</p>
      </div>
      <UButton icon="i-lucide-plus" :loading="connecting" @click="connectInbox">
        Connect inbox
      </UButton>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <template v-if="isFirstLoad">
        <USkeleton v-for="i in 4" :key="i" class="h-16 rounded-xl" />
      </template>
      <template v-else>
        <UCard v-for="stat in stats" :key="stat.label">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-elevated flex items-center justify-center shrink-0">
              <UIcon :name="stat.icon" class="w-4.5 h-4.5" :class="stat.color" />
            </div>
            <div>
              <p class="text-xl font-semibold tabular-nums" :class="stat.color">{{ stat.value }}</p>
              <p class="text-xs text-muted">{{ stat.label }}</p>
            </div>
          </div>
        </UCard>
      </template>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search by email or domain…" class="max-w-xs" />
      <div class="flex gap-1 flex-wrap">
        <UButton
          v-for="opt in STATUS_FILTER_OPTIONS"
          :key="opt.value"
          size="sm"
          :color="statusFilter === opt.value ? 'primary' : 'neutral'"
          :variant="statusFilter === opt.value ? 'solid' : 'ghost'"
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </div>
    </div>

    <!-- Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable :data="inboxes" :columns="columns" :loading="loading">

        <template #email-cell="{ row }">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-mail" class="w-4 h-4 text-red-500" />
            </div>
            <div class="min-w-0">
              <NuxtLink :to="`/inboxes/${row.original.id}`" class="text-sm font-medium text-highlighted hover:text-primary truncate">
                {{ row.original.email }}
              </NuxtLink>
              <p class="text-xs text-muted truncate">{{ row.original.display_name }}</p>
            </div>
          </div>
        </template>

        <template #domain-cell="{ row }">
          <span class="text-sm text-default">{{ row.original.domain }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" class="capitalize">
            {{ statusLabel(row.original.status) }}
          </UBadge>
        </template>

        <template #health-cell="{ row }">
          <span class="text-sm font-semibold tabular-nums" :class="healthTextColor(row.original.deliverability_score)">
            {{ row.original.deliverability_score != null ? Number(row.original.deliverability_score).toFixed(0) + '%' : '—' }}
          </span>
        </template>

        <template #usage-cell="{ row }">
          <div class="w-32">
            <div class="flex justify-between text-xs text-muted mb-1">
              <span class="tabular-nums">{{ row.original.current_day_sent }} / {{ row.original.daily_send_limit }}</span>
              <span>{{ usagePct(row.original.current_day_sent, row.original.daily_send_limit) }}%</span>
            </div>
            <div class="h-1.5 bg-elevated rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all"
                :style="{ width: `${usagePct(row.original.current_day_sent, row.original.daily_send_limit)}%` }"
              />
            </div>
          </div>
        </template>

        <template #totalSent-cell="{ row }">
          <span class="text-sm tabular-nums text-muted">{{ row.original.total_sent.toLocaleString() }}</span>
        </template>

        <template #connected-cell="{ row }">
          <span class="text-sm text-muted">{{ relDate(row.original.created_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <UDropdownMenu :items="rowActions(row.original)">
            <UButton icon="i-lucide-more-horizontal" color="neutral" variant="ghost" size="xs" />
          </UDropdownMenu>
        </template>

      </UTable>

      <div v-if="!loading && inboxes.length === 0" class="py-20 text-center">
        <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-lucide-mail" class="w-7 h-7 text-primary" />
        </div>
        <p class="text-base font-semibold text-highlighted mb-1">No inboxes connected</p>
        <p class="text-sm text-muted mb-4">
          {{ search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Connect a Gmail account to start sending outreach.' }}
        </p>
        <UButton v-if="!search && statusFilter === 'all'" icon="i-lucide-plus" :loading="connecting" @click="connectInbox">
          Connect your first inbox
        </UButton>
      </div>
    </UCard>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex justify-center mt-6">
      <UPagination v-model:page="page" :total="total" :page-size="pageSize" />
    </div>

  </div>
</template>
