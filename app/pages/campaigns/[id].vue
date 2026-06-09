<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// ── types ──────────────────────────────────────────────────────────────
interface EmailStep {
  id: string
  stepNumber: number
  subject: string
  waitDays: number
  sent: number
  opened: number
  replied: number
}

interface RecentLead {
  id: string
  email: string
  name: string
  status: 'replied' | 'opened' | 'sent' | 'bounced'
  lastActivity: string
  step: number
}

interface SentLogEntry {
  id: string
  to: string
  toName: string
  inbox: string
  sentAt: string
  status: 'delivered' | 'opened' | 'replied' | 'bounced' | 'failed'
  opens: number
  step: number
}

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
  fromName: string
  replyTo: string
  steps: EmailStep[]
  leads: RecentLead[]
  sentLog: SentLogEntry[]
  dailySentData: number[]
  dailyReplyData: number[]
}

// ── mock data ───────────────────────────────────────────────────────────
const MOCK_CAMPAIGN: Campaign = {
  id: '1',
  name: 'Marina Q2 Outreach',
  status: 'active',
  contacts: 4820,
  sent: 2941,
  opened: 1294,
  replied: 318,
  bounced: 44,
  dailySendLimit: 200,
  inboxCount: 4,
  startDate: '2025-05-01',
  createdAt: '2025-04-28',
  fromName: 'DXB PropVault Team',
  replyTo: 'outreach1@dxbpropvault.com',
  dailySentData: [120, 185, 200, 198, 200, 175, 195, 200, 188, 200, 192, 200, 178, 200],
  dailyReplyData: [8, 12, 18, 22, 19, 28, 31, 24, 35, 42, 38, 45, 30, 48],
  sentLog: [
    { id: 'sl1', to: 'ahmed.alrashidi@gmail.com', toName: 'Ahmed Al-Rashidi', inbox: 'outreach1@dxbpropvault.com', sentAt: '2025-06-08T10:00:00Z', status: 'replied', opens: 3, step: 1 },
    { id: 'sl2', to: 'sara.almansoori@outlook.com', toName: 'Sara Al-Mansoori', inbox: 'outreach2@dxbpropvault.com', sentAt: '2025-06-08T14:30:00Z', status: 'replied', opens: 2, step: 1 },
    { id: 'sl3', to: 'khalid.hassan@gmail.com', toName: 'Khalid Hassan', inbox: 'outreach1@dxbpropvault.com', sentAt: '2025-06-08T10:05:00Z', status: 'opened', opens: 1, step: 1 },
    { id: 'sl4', to: 'fatima.alali@yahoo.com', toName: 'Fatima Al-Ali', inbox: 'outreach3@dxbpropvault.com', sentAt: '2025-06-09T08:00:00Z', status: 'delivered', opens: 0, step: 1 },
    { id: 'sl5', to: 'hind.alqasimi@outlook.com', toName: 'Hind Al-Qasimi', inbox: 'outreach4@dxbpropvault.com', sentAt: '2025-06-08T09:00:00Z', status: 'replied', opens: 2, step: 1 },
    { id: 'sl6', to: 'nadia.karim@hotmail.com', toName: 'Nadia Karim', inbox: 'outreach1@dxbpropvault.com', sentAt: '2025-06-07T15:00:00Z', status: 'replied', opens: 1, step: 1 },
    { id: 'sl7', to: 'hassan.ibrahim@gmail.com', toName: 'Hassan Ibrahim', inbox: 'outreach3@dxbpropvault.com', sentAt: '2025-06-05T14:00:00Z', status: 'bounced', opens: 0, step: 1 },
    { id: 'sl8', to: 'layla.ahmed@gmail.com', toName: 'Layla Ahmed', inbox: 'outreach4@dxbpropvault.com', sentAt: '2025-06-07T10:00:00Z', status: 'opened', opens: 2, step: 2 },
    { id: 'sl9', to: 'rima.saleh@gmail.com', toName: 'Rima Saleh', inbox: 'outreach3@dxbpropvault.com', sentAt: '2025-06-07T10:10:00Z', status: 'delivered', opens: 0, step: 2 },
    { id: 'sl10', to: 'sultan.almanei@outlook.com', toName: 'Sultan Al-Manei', inbox: 'outreach2@dxbpropvault.com', sentAt: '2025-06-06T10:00:00Z', status: 'replied', opens: 4, step: 1 },
  ],
  steps: [
    { id: 's1', stepNumber: 1, subject: 'Maximize Your Dubai Marina Investment', waitDays: 0, sent: 2941, opened: 1294, replied: 318 },
    { id: 's2', stepNumber: 2, subject: 'Following up – Marina property opportunity', waitDays: 3, sent: 1840, opened: 710, replied: 148 },
    { id: 's3', stepNumber: 3, subject: 'Last note – quick question about your unit', waitDays: 5, sent: 920, opened: 294, replied: 52 },
  ],
  leads: [
    { id: '1', email: 'ahmed.alrashidi@gmail.com', name: 'Ahmed Al-Rashidi', status: 'replied', lastActivity: '2025-06-09T08:22:00Z', step: 1 },
    { id: '2', email: 'sara.almansoori@outlook.com', name: 'Sara Al-Mansoori', status: 'replied', lastActivity: '2025-06-09T07:45:00Z', step: 1 },
    { id: '4', email: 'hind.alqasimi@outlook.com', name: 'Hind Al-Qasimi', status: 'replied', lastActivity: '2025-06-09T06:55:00Z', step: 1 },
    { id: '6', email: 'nadia.karim@hotmail.com', name: 'Nadia Karim', status: 'replied', lastActivity: '2025-06-08T11:30:00Z', step: 1 },
    { id: '8', email: 'layla.ahmed@gmail.com', name: 'Layla Ahmed', status: 'opened', lastActivity: '2025-06-08T09:10:00Z', step: 2 },
    { id: '9', email: 'mariam.alketbi@gmail.com', name: 'Mariam Al-Ketbi', status: 'opened', lastActivity: '2025-06-07T14:30:00Z', step: 2 },
    { id: '11', email: 'rima.saleh@gmail.com', name: 'Rima Saleh', status: 'sent', lastActivity: '2025-06-07T10:00:00Z', step: 2 },
    { id: '13', email: 'dalal.alshehhi@gmail.com', name: 'Dalal Al-Shehhi', status: 'sent', lastActivity: '2025-06-06T09:00:00Z', step: 3 },
    { id: '7', email: 'hassan.ibrahim@gmail.com', name: 'Hassan Ibrahim', status: 'bounced', lastActivity: '2025-06-05T14:00:00Z', step: 1 },
    { id: '15', email: 'sultan.almanei@outlook.com', name: 'Sultan Al-Manei', status: 'replied', lastActivity: '2025-06-05T08:30:00Z', step: 1 },
  ],
}

// ── state ───────────────────────────────────────────────────────────────
const campaign = ref<Campaign>(MOCK_CAMPAIGN)
const activeTab = ref('overview')

const tabs = [
  { label: 'Overview', value: 'overview', icon: 'i-lucide-layout-dashboard' },
  { label: 'Contacts', value: 'contacts', icon: 'i-lucide-users' },
  { label: 'Sent Log', value: 'sentlog', icon: 'i-lucide-send' },
  { label: 'Sequence', value: 'sequence', icon: 'i-lucide-git-branch' },
  { label: 'Settings', value: 'settings', icon: 'i-lucide-settings' },
]

const sentLogColumns: TableColumn<SentLogEntry>[] = [
  { id: 'recipient', header: 'Recipient' },
  { id: 'inbox', header: 'Inbox' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'opens', header: 'Opens' },
  { id: 'step', header: 'Step' },
  { id: 'sentAt', header: 'Sent' },
]

const SENT_STATUS_COLOR: Record<string, BadgeColor> = {
  replied: 'success', opened: 'info', delivered: 'neutral', bounced: 'error', failed: 'error',
}
function sentStatusColor(s: string): BadgeColor { return (SENT_STATUS_COLOR[s] ?? 'neutral') as BadgeColor }

// ── computed ─────────────────────────────────────────────────────────────
const openRate = computed(() => campaign.value.sent ? ((campaign.value.opened / campaign.value.sent) * 100).toFixed(1) : '0')
const replyRate = computed(() => campaign.value.sent ? ((campaign.value.replied / campaign.value.sent) * 100).toFixed(1) : '0')
const bounceRate = computed(() => campaign.value.sent ? ((campaign.value.bounced / campaign.value.sent) * 100).toFixed(1) : '0')
const progress = computed(() => campaign.value.contacts ? Math.round((campaign.value.sent / campaign.value.contacts) * 100) : 0)

// ── columns ───────────────────────────────────────────────────────────────
const leadColumns: TableColumn<RecentLead>[] = [
  { accessorKey: 'name', header: 'Contact' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'step', header: 'Step' },
  { accessorKey: 'lastActivity', header: 'Last Activity' },
]

// ── helpers ───────────────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const CAMPAIGN_STATUS_COLOR: Record<string, BadgeColor> = {
  active: 'success', paused: 'warning', draft: 'neutral', completed: 'info', error: 'error',
}
const LEAD_STATUS_COLOR: Record<string, BadgeColor> = {
  replied: 'success', opened: 'info', sent: 'neutral', bounced: 'error',
}

function cStatusColor(s: string): BadgeColor { return (CAMPAIGN_STATUS_COLOR[s] ?? 'neutral') as BadgeColor }
function leadStatusColor(s: string): BadgeColor { return (LEAD_STATUS_COLOR[s] ?? 'neutral') as BadgeColor }

function pct(num: number, den: number) {
  if (!den) return '—'
  return `${((num / den) * 100).toFixed(1)}%`
}

function relTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const maxSent = computed(() => Math.max(...campaign.value.dailySentData, 1))
const maxReply = computed(() => Math.max(...campaign.value.dailyReplyData, 1))
function barH(val: number, max: number, maxPx: number = 64): number {
  return Math.round((val / max) * maxPx)
}

function toggleStatus() {
  if (campaign.value.status === 'active') campaign.value.status = 'paused'
  else if (campaign.value.status === 'paused') campaign.value.status = 'active'
}
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-6 py-8">

    <!-- Back -->
    <NuxtLink to="/campaigns" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to campaigns
    </NuxtLink>

    <!-- Header -->
    <div class="flex items-start justify-between mb-6 gap-4">
      <div class="min-w-0">
        <div class="flex items-center gap-3 mb-1">
          <h1 class="text-2xl font-semibold text-highlighted truncate">{{ campaign.name }}</h1>
          <UBadge :color="cStatusColor(campaign.status)" variant="subtle" class="capitalize shrink-0">
            {{ campaign.status }}
          </UBadge>
        </div>
        <p class="text-sm text-muted">
          Started {{ campaign.startDate }} &middot; {{ campaign.inboxCount }} inboxes &middot; {{ campaign.dailySendLimit }} emails/day limit
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <UButton
          v-if="campaign.status === 'active'"
          icon="i-lucide-pause"
          color="neutral"
          variant="subtle"
          @click="toggleStatus"
        >
          Pause
        </UButton>
        <UButton
          v-if="campaign.status === 'paused'"
          icon="i-lucide-play"
          @click="toggleStatus"
        >
          Resume
        </UButton>
        <UDropdownMenu :items="[[
          { label: 'Duplicate', icon: 'i-lucide-copy' },
          { label: 'Export leads', icon: 'i-lucide-download' },
          { label: 'Delete campaign', icon: 'i-lucide-trash-2', color: 'error' as const },
        ]]">
          <UButton icon="i-lucide-more-horizontal" color="neutral" variant="subtle" />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-0 border-b border-default mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="activeTab === tab.value
          ? 'border-primary text-primary'
          : 'border-transparent text-muted hover:text-highlighted'"
        @click="activeTab = tab.value"
      >
        <UIcon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ══ OVERVIEW TAB ════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'overview'">

      <!-- KPI cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Sent</p>
          <p class="text-3xl font-semibold text-highlighted tabular-nums">{{ campaign.sent.toLocaleString() }}</p>
          <div class="mt-2">
            <div class="flex justify-between text-xs text-muted mb-1">
              <span>Progress</span><span>{{ progress }}%</span>
            </div>
            <div class="h-1.5 bg-elevated rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full" :style="{ width: `${progress}%` }" />
            </div>
          </div>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Open Rate</p>
          <p class="text-3xl font-semibold tabular-nums" :class="Number(openRate) >= 30 ? 'text-success-600' : Number(openRate) >= 15 ? 'text-warning-600' : 'text-error-600'">
            {{ openRate }}%
          </p>
          <p class="text-xs text-muted mt-1">{{ campaign.opened.toLocaleString() }} opened</p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Reply Rate</p>
          <p class="text-3xl font-semibold tabular-nums" :class="Number(replyRate) >= 8 ? 'text-success-600' : Number(replyRate) >= 3 ? 'text-warning-600' : 'text-muted'">
            {{ replyRate }}%
          </p>
          <p class="text-xs text-muted mt-1">{{ campaign.replied.toLocaleString() }} replies</p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Bounce Rate</p>
          <p class="text-3xl font-semibold tabular-nums" :class="Number(bounceRate) >= 5 ? 'text-error-600' : Number(bounceRate) >= 2 ? 'text-warning-600' : 'text-success-600'">
            {{ bounceRate }}%
          </p>
          <p class="text-xs text-muted mt-1">{{ campaign.bounced.toLocaleString() }} bounced</p>
        </UCard>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        <!-- Daily sends chart -->
        <UCard>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-highlighted">Daily Sends</h3>
              <p class="text-xs text-muted">Last 14 days</p>
            </div>
            <span class="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{{ campaign.dailySendLimit }}/day limit</span>
          </div>
          <div class="flex items-end justify-between gap-1 h-16">
            <div
              v-for="(val, i) in campaign.dailySentData"
              :key="i"
              class="flex-1 bg-primary rounded-t-sm"
              :style="{ height: `${barH(val, maxSent, 64)}px`, opacity: val === 0 ? 0.2 : 0.85 }"
            />
          </div>
          <div class="flex justify-between text-xs text-muted mt-1">
            <span>14d ago</span><span>Today</span>
          </div>
        </UCard>

        <!-- Daily replies chart -->
        <UCard>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-highlighted">Daily Replies</h3>
              <p class="text-xs text-muted">Last 14 days</p>
            </div>
            <span class="text-xs font-medium text-success-600 bg-success-50 px-2 py-0.5 rounded">{{ campaign.replied }} total</span>
          </div>
          <div class="flex items-end justify-between gap-1 h-16">
            <div
              v-for="(val, i) in campaign.dailyReplyData"
              :key="i"
              class="flex-1 bg-success-500 rounded-t-sm"
              :style="{ height: `${barH(val, maxReply, 64)}px`, opacity: val === 0 ? 0.15 : 0.85 }"
            />
          </div>
          <div class="flex justify-between text-xs text-muted mt-1">
            <span>14d ago</span><span>Today</span>
          </div>
        </UCard>

      </div>

      <!-- Step performance -->
      <UCard>
        <h3 class="text-sm font-semibold text-highlighted mb-4">Sequence Performance</h3>
        <div class="space-y-3">
          <div
            v-for="step in campaign.steps"
            :key="step.id"
            class="flex items-center gap-4 p-3 rounded-lg bg-elevated"
          >
            <div class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {{ step.stepNumber }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-highlighted truncate">{{ step.subject }}</p>
              <p class="text-xs text-muted">
                {{ step.stepNumber === 1 ? 'Day 0 (immediate)' : `+${step.waitDays} days after previous` }}
              </p>
            </div>
            <div class="flex gap-6 text-sm text-right shrink-0">
              <div>
                <p class="text-xs text-muted">Sent</p>
                <p class="font-semibold text-default tabular-nums">{{ step.sent.toLocaleString() }}</p>
              </div>
              <div>
                <p class="text-xs text-muted">Opened</p>
                <p class="font-semibold text-info-600 tabular-nums">{{ pct(step.opened, step.sent) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted">Replied</p>
                <p class="font-semibold text-success-600 tabular-nums">{{ pct(step.replied, step.sent) }}</p>
              </div>
            </div>
          </div>
        </div>
      </UCard>

    </template>

    <!-- ══ CONTACTS TAB ═════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'contacts'">
      <UCard :ui="{ body: 'p-0' }">
        <UTable :data="campaign.leads" :columns="leadColumns">
          <template #name-cell="{ row }">
            <NuxtLink :to="`/contacts/${row.original.id}`" class="text-sm font-medium text-highlighted hover:text-primary">
              {{ row.original.name }}
            </NuxtLink>
            <p class="text-xs text-muted">{{ row.original.email }}</p>
          </template>
          <template #status-cell="{ row }">
            <UBadge :color="leadStatusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">
              {{ row.original.status }}
            </UBadge>
          </template>
          <template #step-cell="{ row }">
            <span class="text-sm text-muted">Step {{ row.original.step }}</span>
          </template>
          <template #lastActivity-cell="{ row }">
            <span class="text-sm text-muted">{{ relTime(row.original.lastActivity) }}</span>
          </template>
        </UTable>
      </UCard>
    </template>

    <!-- ══ SENT LOG TAB ═════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'sentlog'">
      <UCard :ui="{ body: 'p-0' }">
        <UTable :data="campaign.sentLog" :columns="sentLogColumns">
          <template #recipient-cell="{ row }">
            <p class="text-sm font-medium text-highlighted">{{ row.original.toName }}</p>
            <p class="text-xs text-muted font-mono">{{ row.original.to }}</p>
          </template>
          <template #inbox-cell="{ row }">
            <p class="text-xs font-mono text-muted">{{ row.original.inbox }}</p>
          </template>
          <template #status-cell="{ row }">
            <UBadge :color="sentStatusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">
              {{ row.original.status }}
            </UBadge>
          </template>
          <template #opens-cell="{ row }">
            <span class="text-sm" :class="row.original.opens > 0 ? 'text-info-600 font-medium' : 'text-muted'">
              {{ row.original.opens > 0 ? row.original.opens : '—' }}
            </span>
          </template>
          <template #step-cell="{ row }">
            <span class="text-sm text-muted">Step {{ row.original.step }}</span>
          </template>
          <template #sentAt-cell="{ row }">
            <span class="text-sm text-muted">{{ relTime(row.original.sentAt) }}</span>
          </template>
        </UTable>
      </UCard>
    </template>

    <!-- ══ SEQUENCE TAB ════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'sequence'">
      <div class="space-y-3">
        <div
          v-for="(step, i) in campaign.steps"
          :key="step.id"
          class="flex gap-4"
        >
          <!-- Connector line -->
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
              {{ step.stepNumber }}
            </div>
            <div v-if="i < campaign.steps.length - 1" class="w-px flex-1 bg-border-default mt-1 mb-1 min-h-4" />
          </div>
          <!-- Card -->
          <UCard class="flex-1 mb-3">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="text-sm font-semibold text-highlighted">{{ step.subject }}</p>
                <p class="text-xs text-muted mt-0.5">
                  <span v-if="step.stepNumber === 1">Sent immediately when contact enters campaign</span>
                  <span v-else>Sent {{ step.waitDays }} days after Step {{ step.stepNumber - 1 }} (if no reply)</span>
                </p>
              </div>
              <div class="flex gap-4 text-sm text-right shrink-0">
                <div><p class="text-xs text-muted">Open</p><p class="font-semibold text-info-600">{{ pct(step.opened, step.sent) }}</p></div>
                <div><p class="text-xs text-muted">Reply</p><p class="font-semibold text-success-600">{{ pct(step.replied, step.sent) }}</p></div>
              </div>
            </div>
          </UCard>
        </div>
        <!-- Add step placeholder -->
        <div class="flex gap-4 opacity-50">
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full border-2 border-dashed border-default flex items-center justify-center">
              <UIcon name="i-lucide-plus" class="w-4 h-4 text-muted" />
            </div>
          </div>
          <div class="flex-1 border-2 border-dashed border-default rounded-xl px-4 py-3 text-sm text-muted cursor-not-allowed">
            Add follow-up step
          </div>
        </div>
      </div>
    </template>

    <!-- ══ SETTINGS TAB ════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'settings'">
      <UCard class="max-w-2xl space-y-6">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">From Name</label>
            <UInput :model-value="campaign.fromName" readonly />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Reply-To</label>
            <UInput :model-value="campaign.replyTo" readonly />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Daily Send Limit</label>
            <UInput :model-value="String(campaign.dailySendLimit)" readonly />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Active Inboxes</label>
            <UInput :model-value="String(campaign.inboxCount)" readonly />
          </div>
        </div>
        <p class="text-xs text-muted">Settings are read-only while the campaign is running. Pause the campaign to edit.</p>
      </UCard>
    </template>

  </div>
</template>
