<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface QueueItem {
  id: string
  to: string
  toName: string
  subject: string
  campaign: string
  inbox: string
  step: number
  scheduledAt: string
  status: 'pending' | 'processing' | 'paused'
}

interface Worker {
  id: string
  status: 'idle' | 'busy' | 'offline'
  jobsToday: number
  currentJob: string | null
}

interface FailedJob {
  id: string
  type: 'send_email' | 'refresh_token' | 'warmup_send'
  description: string
  failedAt: string
  error: string
  retrying: boolean
}

function futureDate(minutesFromNow: number): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() + minutesFromNow)
  return d.toISOString()
}

function pastDate(minutesAgo: number): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - minutesAgo)
  return d.toISOString()
}

const MOCK_QUEUE: QueueItem[] = [
  { id: 'q1', to: 'omar.sheikh@gmail.com', toName: 'Omar Sheikh', subject: 'Maximize Your Dubai Marina Investment', campaign: 'Marina Q2 Outreach', inbox: 'outreach1@dxbpropvault.com', step: 1, scheduledAt: futureDate(4), status: 'processing' },
  { id: 'q2', to: 'saif.alblooshi@gmail.com', toName: 'Saif Al-Blooshi', subject: 'Your Downtown Dubai Unit – Rental Opportunity', campaign: 'Downtown Sellers Q2', inbox: 'outreach2@dxbpropvault.com', step: 1, scheduledAt: futureDate(12), status: 'pending' },
  { id: 'q3', to: 'dalal.alshehhi@gmail.com', toName: 'Dalal Al-Shehhi', subject: 'Last note – quick question about your unit', campaign: 'Downtown Sellers Q2', inbox: 'outreach2@dxbpropvault.com', step: 3, scheduledAt: futureDate(28), status: 'pending' },
  { id: 'q4', to: 'rashid.alfalasi@yahoo.com', toName: 'Rashid Al-Falasi', subject: 'JBR Market Update – Your Unit Could Be Worth More', campaign: 'JBR Investor Outreach', inbox: 'outreach4@dxbpropvault.com', step: 1, scheduledAt: futureDate(45), status: 'pending' },
  { id: 'q5', to: 'amira.hassan@gmail.com', toName: 'Amira Hassan', subject: 'Following up – Marina property opportunity', campaign: 'Marina Q2 Outreach', inbox: 'outreach3@dxbpropvault.com', step: 2, scheduledAt: futureDate(62), status: 'pending' },
  { id: 'q6', to: 'ali.hussain@gmail.com', toName: 'Ali Hussain', subject: 'Maximize Your Dubai Marina Investment', campaign: 'Marina Q2 Outreach', inbox: 'outreach1@dxbpropvault.com', step: 1, scheduledAt: futureDate(80), status: 'pending' },
  { id: 'q7', to: 'mariam.alketbi@gmail.com', toName: 'Mariam Al-Ketbi', subject: 'Following up – JBR property opportunity', campaign: 'JBR Investor Outreach', inbox: 'outreach4@dxbpropvault.com', step: 2, scheduledAt: futureDate(95), status: 'paused' },
  { id: 'q8', to: 'hind.alqasimi@outlook.com', toName: 'Hind Al-Qasimi', subject: 'Last note – quick question about your JBR unit', campaign: 'JBR Investor Outreach', inbox: 'outreach4@dxbpropvault.com', step: 3, scheduledAt: futureDate(120), status: 'paused' },
  { id: 'q9', to: 'waleed.almarri@gmail.com', toName: 'Waleed Al-Marri', subject: 'Following up – Remote property management', campaign: 'GCC Investor Outreach', inbox: 'outreach2@dxbpropvault.com', step: 2, scheduledAt: futureDate(155), status: 'pending' },
  { id: 'q10', to: 'sultan.almanei@outlook.com', toName: 'Sultan Al-Manei', subject: 'Last note – Downtown portfolio opportunity', campaign: 'Downtown Sellers Q2', inbox: 'outreach2@dxbpropvault.com', step: 3, scheduledAt: futureDate(200), status: 'pending' },
]

const MOCK_WORKERS: Worker[] = [
  { id: 'w1', status: 'busy', jobsToday: 142, currentJob: 'send_email → omar.sheikh@gmail.com' },
  { id: 'w2', status: 'idle', jobsToday: 138, currentJob: null },
  { id: 'w3', status: 'idle', jobsToday: 121, currentJob: null },
  { id: 'w4', status: 'offline', jobsToday: 0, currentJob: null },
]

const MOCK_FAILED: FailedJob[] = [
  { id: 'f1', type: 'send_email', description: 'Email to hassan.ibrahim@gmail.com (Marina Q2 Outreach)', failedAt: pastDate(240), error: 'SMTP 550 mailbox not found', retrying: false },
  { id: 'f2', type: 'refresh_token', description: 'Refresh OAuth token for outreach3@dxbpropvault.com', failedAt: pastDate(90), error: 'invalid_grant: Token expired', retrying: false },
]

// ── job type breakdown ─────────────────────────────────────────────────
const jobTypes = [
  { label: 'send_email', count: 9, color: 'bg-primary' },
  { label: 'refresh_token', count: 1, color: 'bg-warning-500' },
  { label: 'warmup_send', count: 0, color: 'bg-info-500' },
]
const totalJobs = jobTypes.reduce((s, j) => s + j.count, 0)

// ── state ─────────────────────────────────────────────────────────────
const queue = ref(MOCK_QUEUE)
const failedJobs = ref(MOCK_FAILED)
const search = ref('')
const statusFilter = ref('all')
const isRefreshing = ref(false)

const filtered = computed(() => {
  let list = queue.value
  if (statusFilter.value !== 'all') list = list.filter(q => q.status === statusFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(item =>
      item.toName.toLowerCase().includes(q)
      || item.to.toLowerCase().includes(q)
      || item.campaign.toLowerCase().includes(q),
    )
  }
  return list
})

const counts = computed(() => ({
  total: queue.value.length,
  processing: queue.value.filter(q => q.status === 'processing').length,
  pending: queue.value.filter(q => q.status === 'pending').length,
  paused: queue.value.filter(q => q.status === 'paused').length,
}))

function refresh() {
  isRefreshing.value = true
  setTimeout(() => { isRefreshing.value = false }, 600)
}

function cancelItem(id: string) {
  queue.value = queue.value.filter(q => q.id !== id)
}

async function retryJob(job: FailedJob) {
  job.retrying = true
  await new Promise(r => setTimeout(r, 1200))
  failedJobs.value = failedJobs.value.filter(j => j.id !== job.id)
}

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const STATUS_COLOR: Record<string, BadgeColor> = {
  pending: 'neutral', processing: 'primary', paused: 'warning',
}
const WORKER_STATUS_COLOR: Record<string, BadgeColor> = {
  busy: 'primary', idle: 'success', offline: 'neutral',
}
const JOB_TYPE_COLOR: Record<string, BadgeColor> = {
  send_email: 'primary', refresh_token: 'warning', warmup_send: 'info',
}

function statusColor(s: string): BadgeColor { return (STATUS_COLOR[s] ?? 'neutral') as BadgeColor }
function workerStatusColor(s: string): BadgeColor { return (WORKER_STATUS_COLOR[s] ?? 'neutral') as BadgeColor }
function jobTypeColor(t: string): BadgeColor { return (JOB_TYPE_COLOR[t] ?? 'neutral') as BadgeColor }

function fmtScheduled(ts: string): string {
  const diff = new Date(ts).getTime() - Date.now()
  if (diff < 0) return 'Overdue'
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `in ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `in ${hrs}h ${mins % 60}m`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function relTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

const columns: TableColumn<QueueItem>[] = [
  { id: 'recipient', header: 'Recipient' },
  { id: 'subject', header: 'Subject / Campaign' },
  { id: 'inbox', header: 'Inbox' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'scheduledAt', header: 'Scheduled' },
  { id: 'actions', header: '' },
]
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Queue</h1>
        <p class="mt-0.5 text-sm text-muted">Emails scheduled to send</p>
      </div>
      <UButton icon="i-lucide-refresh-cw" color="neutral" variant="subtle" :loading="isRefreshing" @click="refresh">
        Refresh
      </UButton>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <UCard class="text-center">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Total queued</p>
        <p class="text-2xl font-semibold text-highlighted">{{ counts.total }}</p>
      </UCard>
      <UCard class="text-center">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Processing</p>
        <p class="text-2xl font-semibold text-primary">{{ counts.processing }}</p>
      </UCard>
      <UCard class="text-center">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Pending</p>
        <p class="text-2xl font-semibold text-highlighted">{{ counts.pending }}</p>
      </UCard>
      <UCard class="text-center">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Paused</p>
        <p class="text-2xl font-semibold text-warning-600">{{ counts.paused }}</p>
      </UCard>
    </div>

    <!-- Job type breakdown + Workers row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

      <!-- Job type breakdown -->
      <UCard>
        <h2 class="text-sm font-semibold text-highlighted mb-4">Job Type Breakdown</h2>
        <div class="space-y-3">
          <div v-for="jt in jobTypes" :key="jt.label" class="flex items-center gap-3">
            <UBadge :color="jobTypeColor(jt.label)" variant="subtle" size="xs" class="font-mono w-32 shrink-0">
              {{ jt.label }}
            </UBadge>
            <div class="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="jt.color"
                :style="{ width: totalJobs > 0 ? `${Math.round((jt.count / totalJobs) * 100)}%` : '0%' }"
              />
            </div>
            <span class="text-sm font-semibold text-highlighted tabular-nums w-6 text-right">{{ jt.count }}</span>
          </div>
        </div>
      </UCard>

      <!-- Workers -->
      <UCard>
        <h2 class="text-sm font-semibold text-highlighted mb-4">Workers</h2>
        <div class="space-y-2">
          <div
            v-for="worker in MOCK_WORKERS"
            :key="worker.id"
            class="flex items-center gap-3 p-2.5 rounded-lg bg-elevated"
          >
            <UBadge :color="workerStatusColor(worker.status)" variant="subtle" size="xs" class="capitalize w-16 justify-center shrink-0">
              {{ worker.status }}
            </UBadge>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-mono text-highlighted">{{ worker.id }}</p>
              <p class="text-xs text-muted truncate">
                {{ worker.currentJob ?? 'Waiting for jobs' }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-semibold text-highlighted tabular-nums">{{ worker.jobsToday }}</p>
              <p class="text-xs text-muted">today</p>
            </div>
          </div>
        </div>
      </UCard>

    </div>

    <!-- Failed Jobs -->
    <div v-if="failedJobs.length > 0" class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <UIcon name="i-lucide-alert-circle" class="w-4.5 h-4.5 text-error-600" />
        <h2 class="text-base font-semibold text-highlighted">Failed Jobs</h2>
        <UBadge color="error" variant="subtle" size="xs">{{ failedJobs.length }}</UBadge>
      </div>
      <UCard :ui="{ body: 'p-0' }">
        <ul class="divide-y divide-default">
          <li
            v-for="job in failedJobs"
            :key="job.id"
            class="flex items-center gap-4 px-4 py-3"
          >
            <UBadge :color="jobTypeColor(job.type)" variant="subtle" size="xs" class="font-mono shrink-0">
              {{ job.type }}
            </UBadge>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-highlighted truncate">{{ job.description }}</p>
              <p class="text-xs text-error-600 mt-0.5 font-mono">{{ job.error }}</p>
              <p class="text-xs text-muted mt-0.5">Failed {{ relTime(job.failedAt) }}</p>
            </div>
            <UButton
              size="xs"
              color="error"
              variant="subtle"
              icon="i-lucide-rotate-ccw"
              :loading="job.retrying"
              @click="retryJob(job)"
            >
              Retry
            </UButton>
          </li>
        </ul>
      </UCard>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-4">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search recipient or campaign…" class="max-w-xs" />
      <div class="flex gap-1">
        <UButton
          v-for="opt in [
            { label: 'All', value: 'all' },
            { label: 'Processing', value: 'processing' },
            { label: 'Pending', value: 'pending' },
            { label: 'Paused', value: 'paused' },
          ]"
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

    <!-- Queue Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable :data="filtered" :columns="columns">

        <template #recipient-cell="{ row }">
          <p class="text-sm font-medium text-highlighted">{{ row.original.toName }}</p>
          <p class="text-xs text-muted font-mono">{{ row.original.to }}</p>
        </template>

        <template #subject-cell="{ row }">
          <p class="text-sm text-default truncate max-w-xs">{{ row.original.subject }}</p>
          <p class="text-xs text-primary">{{ row.original.campaign }} · Step {{ row.original.step }}</p>
        </template>

        <template #inbox-cell="{ row }">
          <p class="text-xs font-mono text-muted">{{ row.original.inbox }}</p>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">
            <template v-if="row.original.status === 'processing'">
              <UIcon name="i-lucide-loader-circle" class="w-3 h-3 animate-spin mr-1" />
            </template>
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #scheduledAt-cell="{ row }">
          <span class="text-sm tabular-nums" :class="row.original.status === 'processing' ? 'text-primary font-medium' : 'text-muted'">
            {{ fmtScheduled(row.original.scheduledAt) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="cancelItem(row.original.id)"
          />
        </template>

      </UTable>

      <div v-if="filtered.length === 0" class="py-16 text-center">
        <UIcon name="i-lucide-layers" class="w-10 h-10 text-muted mx-auto mb-3" />
        <p class="text-sm font-semibold text-highlighted mb-1">Queue is empty</p>
        <p class="text-xs text-muted">No emails scheduled matching current filters.</p>
      </div>
    </UCard>

  </div>
</template>
