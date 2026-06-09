<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'

interface Campaign {
  id: string
  name: string
  status: 'active' | 'paused' | 'draft' | 'completed' | 'error'
  contacts: number
  sent: number
  opened: number
  replied: number
  bounced: number
  dailySendLimit: number
  inboxCount: number
  startDate: string
  endDate?: string
  createdAt: string
  replyTrend: number[]
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Marina Q2 Outreach', status: 'active', contacts: 4820, sent: 2941, opened: 1294, replied: 318, bounced: 44, dailySendLimit: 200, inboxCount: 4, startDate: '2025-05-01', createdAt: '2025-04-28', replyTrend: [8, 12, 9, 15, 22, 18, 28, 31, 24, 35, 42, 38, 45, 52] },
  { id: '2', name: 'Downtown Sellers Q2', status: 'active', contacts: 3210, sent: 1873, opened: 749, replied: 187, bounced: 28, dailySendLimit: 150, inboxCount: 3, startDate: '2025-05-10', createdAt: '2025-05-08', replyTrend: [5, 8, 11, 14, 10, 16, 19, 22, 18, 25, 21, 28, 24, 30] },
  { id: '3', name: 'Palm Jumeirah VIP', status: 'paused', contacts: 640, sent: 412, opened: 198, replied: 67, bounced: 6, dailySendLimit: 50, inboxCount: 1, startDate: '2025-04-15', createdAt: '2025-04-12', replyTrend: [4, 7, 9, 12, 15, 18, 14, 16, 0, 0, 0, 0, 0, 0] },
  { id: '4', name: 'JBR Investor Outreach', status: 'active', contacts: 2180, sent: 980, opened: 392, replied: 88, bounced: 15, dailySendLimit: 100, inboxCount: 2, startDate: '2025-05-20', createdAt: '2025-05-18', replyTrend: [3, 5, 7, 9, 8, 12, 14, 11, 16, 18, 15, 20, 22, 25] },
  { id: '5', name: 'Tenant Upgrade Program', status: 'paused', contacts: 1540, sent: 820, opened: 287, replied: 41, bounced: 22, dailySendLimit: 80, inboxCount: 2, startDate: '2025-04-20', createdAt: '2025-04-18', replyTrend: [2, 4, 5, 6, 7, 5, 3, 4, 0, 0, 0, 0, 0, 0] },
  { id: '6', name: 'GCC Investor Outreach', status: 'draft', contacts: 8200, sent: 0, opened: 0, replied: 0, bounced: 0, dailySendLimit: 300, inboxCount: 5, startDate: '', createdAt: '2025-06-01', replyTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: '7', name: 'Business Bay Landlords', status: 'completed', contacts: 3800, sent: 3800, opened: 1596, replied: 418, bounced: 57, dailySendLimit: 200, inboxCount: 4, startDate: '2025-03-01', endDate: '2025-04-30', createdAt: '2025-02-25', replyTrend: [10, 18, 24, 30, 35, 42, 38, 45, 52, 48, 40, 30, 20, 8] },
  { id: '8', name: 'DIFC Office Owners', status: 'draft', contacts: 520, sent: 0, opened: 0, replied: 0, bounced: 0, dailySendLimit: 50, inboxCount: 1, startDate: '', createdAt: '2025-06-05', replyTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: '9', name: 'Ras Al Khaimah Villas', status: 'error', contacts: 1200, sent: 340, opened: 102, replied: 18, bounced: 85, dailySendLimit: 100, inboxCount: 2, startDate: '2025-05-25', createdAt: '2025-05-22', replyTrend: [5, 7, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
]

// ── state ─────────────────────────────────────────────────────────────
const campaigns = ref(MOCK_CAMPAIGNS)
const search = ref('')
const statusFilter = ref<string>('all')

const filtered = computed(() => {
  let list = campaigns.value
  if (statusFilter.value !== 'all') list = list.filter(c => c.status === statusFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }
  return list
})

// ── summary stats ─────────────────────────────────────────────────────
const summaryStats = computed(() => [
  { label: 'Total', value: campaigns.value.length, color: 'text-highlighted', icon: 'i-lucide-send' },
  { label: 'Active', value: campaigns.value.filter(c => c.status === 'active').length, color: 'text-success-600', icon: 'i-lucide-play-circle' },
  { label: 'Paused', value: campaigns.value.filter(c => c.status === 'paused').length, color: 'text-warning-600', icon: 'i-lucide-pause-circle' },
  { label: 'Draft', value: campaigns.value.filter(c => c.status === 'draft').length, color: 'text-muted', icon: 'i-lucide-file-edit' },
])

// ── totals row ────────────────────────────────────────────────────────
const totals = computed(() => {
  const sent = campaigns.value.reduce((s, c) => s + c.sent, 0)
  const opened = campaigns.value.reduce((s, c) => s + c.opened, 0)
  const replied = campaigns.value.reduce((s, c) => s + c.replied, 0)
  const bounced = campaigns.value.reduce((s, c) => s + c.bounced, 0)
  return { sent, opened, replied, bounced }
})

// ── columns ───────────────────────────────────────────────────────────
const columns: TableColumn<Campaign>[] = [
  { accessorKey: 'name', header: 'Campaign' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'contacts', header: 'Contacts' },
  { id: 'sent', header: 'Sent' },
  { id: 'openRate', header: 'Open %' },
  { id: 'replyRate', header: 'Reply %' },
  { id: 'bounceRate', header: 'Bounce %' },
  { id: 'trend', header: 'Trend' },
  { id: 'actions', header: '' },
]

// ── helpers ───────────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const STATUS_COLOR: Record<string, BadgeColor> = {
  active: 'success',
  paused: 'warning',
  draft: 'neutral',
  completed: 'info',
  error: 'error',
}

function statusColor(s: string): BadgeColor { return (STATUS_COLOR[s] ?? 'neutral') as BadgeColor }
function statusLabel(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function pct(num: number, den: number): string {
  if (!den) return '—'
  return `${((num / den) * 100).toFixed(1)}%`
}

function openColor(c: Campaign): string {
  if (!c.sent) return 'text-muted'
  const r = c.opened / c.sent
  if (r >= 0.4) return 'text-success-600'
  if (r >= 0.2) return 'text-warning-600'
  return 'text-error-600'
}

function replyColor(c: Campaign): string {
  if (!c.sent) return 'text-muted'
  const r = c.replied / c.sent
  if (r >= 0.1) return 'text-success-600'
  if (r >= 0.04) return 'text-warning-600'
  return 'text-muted'
}

function bounceColor(c: Campaign): string {
  if (!c.sent) return 'text-muted'
  const r = c.bounced / c.sent
  if (r >= 0.05) return 'text-error-600 font-semibold'
  if (r >= 0.02) return 'text-warning-600'
  return 'text-muted'
}

function trendColor(c: Campaign): string {
  if (c.status === 'active') return 'bg-primary'
  if (c.status === 'completed') return 'bg-success-500'
  return 'bg-muted'
}

function rowActions(c: Campaign): DropdownMenuItem[][] {
  const items: DropdownMenuItem[] = [
    { label: 'View details', icon: 'i-lucide-external-link', to: `/campaigns/${c.id}` },
    { label: 'Duplicate', icon: 'i-lucide-copy' },
  ]
  if (c.status === 'active') {
    items.push({ label: 'Pause', icon: 'i-lucide-pause', onSelect: () => toggleStatus(c) })
  }
  if (c.status === 'paused') {
    items.push({ label: 'Resume', icon: 'i-lucide-play', onSelect: () => toggleStatus(c) })
  }
  if (c.status === 'draft') {
    items.push({ label: 'Launch', icon: 'i-lucide-rocket', onSelect: () => toggleStatus(c) })
  }
  items.push({ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const })
  return [items]
}

function toggleStatus(c: Campaign) {
  if (c.status === 'active') c.status = 'paused'
  else if (c.status === 'paused') c.status = 'active'
  else if (c.status === 'draft') c.status = 'active'
}

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Draft', value: 'draft' },
  { label: 'Completed', value: 'completed' },
]

const maxTrend = (data: number[]) => Math.max(...data, 1)
function barH(val: number, data: number[]): number {
  return Math.round((val / maxTrend(data)) * 20)
}
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Campaigns</h1>
        <p class="mt-0.5 text-sm text-muted">{{ campaigns.length }} total · {{ totals.sent.toLocaleString() }} emails sent</p>
      </div>
      <NuxtLink to="/campaigns/create">
        <UButton icon="i-lucide-plus">New campaign</UButton>
      </NuxtLink>
    </div>

    <!-- Summary stats -->
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

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-4">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search campaigns…"
        class="max-w-xs"
      />
      <div class="flex gap-1">
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
      <UTable :data="filtered" :columns="columns">

        <!-- Campaign name -->
        <template #name-cell="{ row }">
          <NuxtLink
            :to="`/campaigns/${row.original.id}`"
            class="font-medium text-highlighted hover:text-primary transition-colors"
          >
            {{ row.original.name }}
          </NuxtLink>
          <p class="text-xs text-muted mt-0.5">
            <span v-if="row.original.startDate">Started {{ row.original.startDate }}</span>
            <span v-else>Not started</span>
            &middot; {{ row.original.inboxCount }} inbox{{ row.original.inboxCount !== 1 ? 'es' : '' }}
          </p>
        </template>

        <!-- Status -->
        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm">
            {{ statusLabel(row.original.status) }}
          </UBadge>
        </template>

        <!-- Contacts -->
        <template #contacts-cell="{ row }">
          <div class="text-sm">
            <span class="font-medium text-highlighted tabular-nums">{{ row.original.contacts.toLocaleString() }}</span>
            <div v-if="row.original.sent > 0" class="mt-0.5">
              <div class="h-1 w-20 bg-elevated rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full"
                  :style="{ width: `${Math.round((row.original.sent / row.original.contacts) * 100)}%` }"
                />
              </div>
              <p class="text-xs text-muted mt-0.5">{{ Math.round((row.original.sent / row.original.contacts) * 100) }}% sent</p>
            </div>
          </div>
        </template>

        <!-- Sent -->
        <template #sent-cell="{ row }">
          <span class="text-sm tabular-nums text-default font-medium">
            {{ row.original.sent > 0 ? row.original.sent.toLocaleString() : '—' }}
          </span>
        </template>

        <!-- Open rate -->
        <template #openRate-cell="{ row }">
          <span class="text-sm tabular-nums font-semibold" :class="openColor(row.original)">
            {{ pct(row.original.opened, row.original.sent) }}
          </span>
        </template>

        <!-- Reply rate -->
        <template #replyRate-cell="{ row }">
          <span class="text-sm tabular-nums font-semibold" :class="replyColor(row.original)">
            {{ pct(row.original.replied, row.original.sent) }}
          </span>
        </template>

        <!-- Bounce rate -->
        <template #bounceRate-cell="{ row }">
          <span class="text-sm tabular-nums" :class="bounceColor(row.original)">
            {{ pct(row.original.bounced, row.original.sent) }}
          </span>
        </template>

        <!-- Reply trend sparkline -->
        <template #trend-cell="{ row }">
          <div class="flex items-end gap-px h-5">
            <div
              v-for="(val, i) in row.original.replyTrend"
              :key="i"
              class="w-1.5 rounded-sm transition-all"
              :class="trendColor(row.original)"
              :style="{ height: `${barH(val, row.original.replyTrend)}px`, opacity: val === 0 ? 0.15 : 1 }"
            />
          </div>
        </template>

        <!-- Actions dropdown -->
        <template #actions-cell="{ row }">
          <UDropdownMenu :items="rowActions(row.original)">
            <UButton icon="i-lucide-more-horizontal" color="neutral" variant="ghost" size="xs" />
          </UDropdownMenu>
        </template>

      </UTable>

      <!-- Empty state -->
      <div v-if="filtered.length === 0" class="py-16 text-center">
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

    <!-- Aggregate totals footer -->
    <div v-if="filtered.length > 0" class="mt-3 flex items-center gap-6 px-4 py-2 bg-elevated rounded-lg text-sm text-muted">
      <span class="font-medium text-highlighted">Totals</span>
      <span>Sent: <strong class="text-default">{{ totals.sent.toLocaleString() }}</strong></span>
      <span>Opened: <strong class="text-default">{{ pct(totals.opened, totals.sent) }}</strong></span>
      <span>Replied: <strong class="text-success-600">{{ pct(totals.replied, totals.sent) }}</strong></span>
      <span>Bounced: <strong class="text-default">{{ pct(totals.bounced, totals.sent) }}</strong></span>
    </div>

  </div>
</template>
