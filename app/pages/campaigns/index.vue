<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { Campaign } from '~/composables/useCampaigns'

const toast = useToast()
const { campaigns, total, loading, fetchCampaigns, startCampaign, pauseCampaign, deleteCampaign } = useCampaigns()
const { public: cfg } = useRuntimeConfig()

const search = ref('')
const statusFilter = ref('all')
const page = ref(1)
const pageSize = 20

// Backend uses 'running'; UI shows 'active'
function toBackendStatus(uiStatus: string) {
  return uiStatus === 'active' ? 'running' : uiStatus
}
function toDisplayStatus(s: string) {
  return s === 'running' ? 'active' : s
}

async function load() {
  await fetchCampaigns({
    page: page.value,
    page_size: pageSize,
    status: statusFilter.value !== 'all' ? toBackendStatus(statusFilter.value) : undefined,
    search: search.value.trim() || undefined,
  })
}

const isFirstLoad = computed(() => loading.value && campaigns.value.length === 0)

onMounted(load)

watch(page, load)
watch(statusFilter, () => { page.value = 1; load() })

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, cfg.searchDebounce)
})
onUnmounted(() => { if (searchTimer) clearTimeout(searchTimer) })

// ── summary counts from loaded data ───────────────────────────────────
const summaryStats = computed(() => [
  { label: 'Total', value: total.value, color: 'text-highlighted', icon: 'i-lucide-send' },
  { label: 'Active', value: campaigns.value.filter(c => c.status === 'running').length, color: 'text-success-600', icon: 'i-lucide-play-circle' },
  { label: 'Paused', value: campaigns.value.filter(c => c.status === 'paused').length, color: 'text-warning-600', icon: 'i-lucide-pause-circle' },
  { label: 'Draft', value: campaigns.value.filter(c => c.status === 'draft').length, color: 'text-muted', icon: 'i-lucide-file-edit' },
])

const totals = computed(() => ({
  sent: campaigns.value.reduce((s, c) => s + c.total_sent, 0),
  opened: campaigns.value.reduce((s, c) => s + c.total_opened, 0),
  replied: campaigns.value.reduce((s, c) => s + c.total_replied, 0),
  bounced: campaigns.value.reduce((s, c) => s + c.total_bounced, 0),
}))

// ── columns ───────────────────────────────────────────────────────────
const columns: TableColumn<Campaign>[] = [
  { accessorKey: 'name', header: 'Campaign' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'contacts', header: 'Contacts' },
  { id: 'sent', header: 'Sent' },
  { id: 'openRate', header: 'Open %' },
  { id: 'replyRate', header: 'Reply %' },
  { id: 'bounceRate', header: 'Bounce %' },
  { id: 'actions', header: '' },
]

// ── helpers ───────────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const STATUS_COLOR: Record<string, BadgeColor> = {
  running: 'success', active: 'success',
  paused: 'warning', draft: 'neutral',
  completed: 'info', archived: 'neutral', scheduled: 'info',
}

function statusColor(s: string): BadgeColor { return (STATUS_COLOR[s] ?? 'neutral') as BadgeColor }

function pct(num: number, den: number): string {
  if (!den) return '—'
  return `${((num / den) * 100).toFixed(1)}%`
}

function openColor(c: Campaign): string {
  if (!c.total_sent) return 'text-muted'
  const r = c.total_opened / c.total_sent
  if (r >= 0.4) return 'text-success-600'
  if (r >= 0.2) return 'text-warning-600'
  return 'text-error-600'
}
function replyColor(c: Campaign): string {
  if (!c.total_sent) return 'text-muted'
  const r = c.total_replied / c.total_sent
  if (r >= 0.1) return 'text-success-600'
  if (r >= 0.04) return 'text-warning-600'
  return 'text-muted'
}
function bounceColor(c: Campaign): string {
  if (!c.total_sent) return 'text-muted'
  const r = c.total_bounced / c.total_sent
  if (r >= 0.05) return 'text-error-600 font-semibold'
  if (r >= 0.02) return 'text-warning-600'
  return 'text-muted'
}

function relDate(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

async function toggleStatus(c: Campaign) {
  try {
    if (c.status === 'running') {
      await pauseCampaign(c.id)
      toast.add({ title: 'Campaign paused', color: 'neutral', icon: 'i-lucide-pause-circle' })
    }
    else if (c.status === 'paused' || c.status === 'draft') {
      await startCampaign(c.id)
      toast.add({ title: 'Campaign started', color: 'success', icon: 'i-lucide-play-circle' })
    }
    await load()
  }
  catch (e: any) {
    toast.add({ title: 'Action failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
}

async function remove(c: Campaign) {
  try {
    await deleteCampaign(c.id)
    toast.add({ title: 'Campaign deleted', color: 'neutral', icon: 'i-lucide-trash-2' })
    await load()
  }
  catch (e: any) {
    toast.add({ title: 'Delete failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
}

function rowActions(c: Campaign): DropdownMenuItem[][] {
  const items: DropdownMenuItem[] = [
    { label: 'View details', icon: 'i-lucide-external-link', to: `/campaigns/${c.id}` },
  ]
  if (c.status === 'running') {
    items.push({ label: 'Pause', icon: 'i-lucide-pause', onSelect: () => toggleStatus(c) })
  }
  if (c.status === 'paused' || c.status === 'draft') {
    items.push({ label: c.status === 'draft' ? 'Launch' : 'Resume', icon: 'i-lucide-play', onSelect: () => toggleStatus(c) })
  }
  items.push({ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => remove(c) })
  return [items]
}

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Draft', value: 'draft' },
  { label: 'Completed', value: 'completed' },
]
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Campaigns</h1>
        <p class="mt-0.5 text-sm text-muted">{{ total }} total · {{ totals.sent.toLocaleString() }} emails sent</p>
      </div>
      <NuxtLink to="/campaigns/create">
        <UButton icon="i-lucide-plus">New campaign</UButton>
      </NuxtLink>
    </div>

    <AppPageLoader v-if="isFirstLoad" label="Loading campaigns…" />

    <template v-else>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <UCard v-for="stat in summaryStats" :key="stat.label">
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
    </div>

    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search campaigns…" class="max-w-xs" />
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

    <UCard :ui="{ body: 'p-0' }">
      <UTable :data="campaigns" :columns="columns" :loading="loading">

        <template #name-cell="{ row }">
          <NuxtLink :to="`/campaigns/${row.original.id}`" class="font-medium text-highlighted hover:text-primary transition-colors">
            {{ row.original.name }}
          </NuxtLink>
          <p class="text-xs text-muted mt-0.5 capitalize">
            {{ row.original.campaign_type.replace('_', ' ') }} ·
            <span v-if="row.original.started_at">Started {{ relDate(row.original.started_at) }}</span>
            <span v-else>Not started</span>
          </p>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">
            {{ toDisplayStatus(row.original.status) }}
          </UBadge>
        </template>

        <template #contacts-cell="{ row }">
          <div class="text-sm">
            <span class="font-medium text-highlighted tabular-nums">{{ (row.original.actual_audience_size ?? row.original.total_contacts).toLocaleString() }}</span>
            <div v-if="row.original.total_sent > 0" class="mt-0.5">
              <div class="h-1 w-20 bg-elevated rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full"
                  :style="{ width: `${Math.min(100, Math.round((row.original.total_sent / ((row.original.actual_audience_size ?? row.original.total_contacts) || 1)) * 100))}%` }"
                />
              </div>
              <p class="text-xs text-muted mt-0.5">
                {{ Math.min(100, Math.round((row.original.total_sent / ((row.original.actual_audience_size ?? row.original.total_contacts) || 1)) * 100)) }}% sent
              </p>
            </div>
          </div>
        </template>

        <template #sent-cell="{ row }">
          <span class="text-sm tabular-nums text-default font-medium">
            {{ row.original.total_sent > 0 ? row.original.total_sent.toLocaleString() : '—' }}
          </span>
        </template>

        <template #openRate-cell="{ row }">
          <span class="text-sm tabular-nums font-semibold" :class="openColor(row.original)">
            {{ pct(row.original.total_opened, row.original.total_sent) }}
          </span>
        </template>

        <template #replyRate-cell="{ row }">
          <span class="text-sm tabular-nums font-semibold" :class="replyColor(row.original)">
            {{ pct(row.original.total_replied, row.original.total_sent) }}
          </span>
        </template>

        <template #bounceRate-cell="{ row }">
          <span class="text-sm tabular-nums" :class="bounceColor(row.original)">
            {{ pct(row.original.total_bounced, row.original.total_sent) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <UDropdownMenu :items="rowActions(row.original)">
            <UButton icon="i-lucide-more-horizontal" color="neutral" variant="ghost" size="xs" />
          </UDropdownMenu>
        </template>

      </UTable>

      <div v-if="!loading && campaigns.length === 0" class="py-16 text-center">
        <UIcon name="i-lucide-send" class="w-10 h-10 text-muted mx-auto mb-3" />
        <p class="text-base font-semibold text-highlighted mb-1">No campaigns found</p>
        <p class="text-sm text-muted mb-4">
          {{ search || statusFilter !== 'all' ? 'Try changing your filters.' : 'Create your first campaign to get started.' }}
        </p>
        <NuxtLink v-if="!search && statusFilter === 'all'" to="/campaigns/create">
          <UButton icon="i-lucide-plus">New campaign</UButton>
        </NuxtLink>
      </div>
    </UCard>

    <div v-if="total > pageSize" class="flex justify-center mt-6">
      <UPagination v-model:page="page" :total="total" :page-size="pageSize" />
    </div>

    <div v-if="campaigns.length > 0" class="mt-3 flex items-center gap-6 px-4 py-2 bg-elevated rounded-lg text-sm text-muted">
      <span class="font-medium text-highlighted">Totals (this page)</span>
      <span>Sent: <strong class="text-default">{{ totals.sent.toLocaleString() }}</strong></span>
      <span>Opened: <strong class="text-default">{{ pct(totals.opened, totals.sent) }}</strong></span>
      <span>Replied: <strong class="text-success-600">{{ pct(totals.replied, totals.sent) }}</strong></span>
      <span>Bounced: <strong class="text-default">{{ pct(totals.bounced, totals.sent) }}</strong></span>
    </div>

    </template>

  </div>
</template>
