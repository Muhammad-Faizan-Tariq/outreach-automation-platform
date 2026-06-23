<script setup lang="ts">
import type { QueueItem, WorkersResponse, FailedJob } from '~/composables/useQueue'

const { fetchQueue, fetchWorkers, fetchFailed } = useQueue()
const { public: cfg } = useRuntimeConfig()

const queueItems = ref<QueueItem[]>([])
const queueTotal = ref(0)
const workersData = ref<WorkersResponse | null>(null)
const failedItems = ref<FailedJob[]>([])
const failedTotal = ref(0)
const loadingQueue = ref(true)
const loadingWorkers = ref(true)
const loadingFailed = ref(true)
const search = ref('')
const activeTab = ref('queue')

let queueTimer: ReturnType<typeof setInterval> | null = null
let workerTimer: ReturnType<typeof setInterval> | null = null

async function loadQueue() {
  loadingQueue.value = true
  try {
    const res = await fetchQueue({ page_size: 200 })
    queueItems.value = res.items
    queueTotal.value = res.total
  }
  catch { /* empty */ }
  finally { loadingQueue.value = false }
}

async function loadWorkers() {
  loadingWorkers.value = true
  try {
    workersData.value = await fetchWorkers()
  }
  catch { /* empty */ }
  finally { loadingWorkers.value = false }
}

async function loadFailed() {
  loadingFailed.value = true
  try {
    const res = await fetchFailed({ page_size: 100 })
    failedItems.value = res.items
    failedTotal.value = res.total
  }
  catch { /* empty */ }
  finally { loadingFailed.value = false }
}

onMounted(async () => {
  await Promise.all([loadQueue(), loadWorkers(), loadFailed()])
  queueTimer = setInterval(loadQueue, cfg.refreshQueue)
  workerTimer = setInterval(loadWorkers, cfg.refreshWorkers)
})

onUnmounted(() => {
  if (queueTimer) clearInterval(queueTimer)
  if (workerTimer) clearInterval(workerTimer)
})

const filteredQueue = computed(() => {
  if (!search.value.trim()) return queueItems.value
  const q = search.value.toLowerCase()
  return queueItems.value.filter(item =>
    item.contact_email.toLowerCase().includes(q)
    || item.campaign_name.toLowerCase().includes(q),
  )
})

const counts = computed(() => ({
  total: queueTotal.value,
  pending: queueItems.value.filter(i => i.status === 'pending').length,
  overdue: queueItems.value.filter(i => i.status === 'overdue').length,
}))

const jobTypes = computed(() => {
  const qt = workersData.value?.queued_tasks
  if (!qt) return []
  const total = qt.sending + qt.replies + qt.imports + qt.maintenance
  return [
    { label: 'sending', count: qt.sending, pct: total > 0 ? Math.round((qt.sending / total) * 100) : 0, color: 'bg-primary', badgeColor: 'primary' as const },
    { label: 'replies', count: qt.replies, pct: total > 0 ? Math.round((qt.replies / total) * 100) : 0, color: 'bg-info-500', badgeColor: 'info' as const },
    { label: 'imports', count: qt.imports, pct: total > 0 ? Math.round((qt.imports / total) * 100) : 0, color: 'bg-warning-500', badgeColor: 'warning' as const },
    { label: 'maintenance', count: qt.maintenance, pct: total > 0 ? Math.round((qt.maintenance / total) * 100) : 0, color: 'bg-neutral-500', badgeColor: 'neutral' as const },
  ]
})

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

function queueStatusColor(s: string): BadgeColor {
  return s === 'overdue' ? 'error' : 'neutral'
}

function relTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago'
  return Math.floor(diff / 86_400_000) + 'd ago'
}

function fmtScheduled(ts: string): string {
  const diff = new Date(ts).getTime() - Date.now()
  if (diff < 0) return 'Overdue'
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return 'in ' + mins + 'm'
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return 'in ' + hrs + 'h ' + (mins % 60) + 'm'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Queue</h1>
        <p class="mt-0.5 text-sm text-muted">Emails scheduled to send · auto-refreshes every 30s</p>
      </div>
      <UButton icon="i-lucide-refresh-cw" color="neutral" variant="subtle" :loading="loadingQueue" @click="loadQueue">
        Refresh
      </UButton>
    </div>

    <AppPageLoader v-if="loadingQueue && !queueItems.length" label="Loading queue…" />

    <template v-else>

    <!-- Stats row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <UCard class="text-center">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Total queued</p>
        <p class="text-2xl font-semibold text-highlighted">{{ counts.total }}</p>
      </UCard>
      <UCard class="text-center">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Pending</p>
        <p class="text-2xl font-semibold text-highlighted">{{ counts.pending }}</p>
      </UCard>
      <UCard class="text-center">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Overdue</p>
        <p class="text-2xl font-semibold" :class="counts.overdue > 0 ? 'text-error-600' : 'text-muted'">{{ counts.overdue }}</p>
      </UCard>
      <UCard class="text-center">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Failed jobs</p>
        <p class="text-2xl font-semibold" :class="failedTotal > 0 ? 'text-error-600' : 'text-muted'">{{ failedTotal }}</p>
      </UCard>
    </div>

    <!-- Workers + Job breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

      <!-- Task breakdown from queued tasks -->
      <UCard>
        <h2 class="text-sm font-semibold text-highlighted mb-4">Queued Task Counts</h2>
        <div v-if="loadingWorkers" class="space-y-3">
          <USkeleton v-for="i in 4" :key="i" class="h-6 rounded" />
        </div>
        <div v-else-if="jobTypes.length" class="space-y-3">
          <div v-for="jt in jobTypes" :key="jt.label" class="flex items-center gap-3">
            <UBadge :color="jt.badgeColor" variant="subtle" size="xs" class="font-mono w-28 shrink-0 justify-center">
              {{ jt.label }}
            </UBadge>
            <div class="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="jt.color" :style="{ width: jt.pct + '%' }" />
            </div>
            <span class="text-sm font-semibold text-highlighted tabular-nums w-6 text-right">{{ jt.count }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-muted">No queued tasks</p>
      </UCard>

      <!-- Workers -->
      <UCard>
        <h2 class="text-sm font-semibold text-highlighted mb-4">
          Workers
          <span v-if="workersData" class="ml-2 text-xs font-normal text-muted">
            {{ workersData.total_online }} online
          </span>
        </h2>
        <div v-if="loadingWorkers" class="space-y-2">
          <USkeleton v-for="i in 2" :key="i" class="h-14 rounded-lg" />
        </div>
        <div v-else-if="workersData?.workers.length" class="space-y-2">
          <div
            v-for="worker in workersData.workers"
            :key="worker.name"
            class="flex items-center gap-3 p-2.5 rounded-lg bg-elevated"
          >
            <UBadge :color="worker.status === 'online' ? 'success' : 'neutral'" variant="subtle" size="xs" class="capitalize w-16 justify-center shrink-0">
              {{ worker.status }}
            </UBadge>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-mono text-highlighted truncate">{{ worker.name }}</p>
              <p class="text-xs text-muted">
                Queues: {{ worker.queues.join(', ') || 'none' }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-semibold text-highlighted tabular-nums">{{ worker.active_tasks }}</p>
              <p class="text-xs text-muted">active</p>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-muted">No workers online</p>
      </UCard>

    </div>

    <!-- Failed Jobs -->
    <div v-if="failedItems.length > 0" class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <UIcon name="i-lucide-alert-circle" class="w-4.5 h-4.5 text-error-600" />
        <h2 class="text-base font-semibold text-highlighted">Failed Jobs</h2>
        <UBadge color="error" variant="subtle" size="xs">{{ failedItems.length }}</UBadge>
      </div>
      <UCard :ui="{ body: 'p-0' }">
        <ul class="divide-y divide-default">
          <li
            v-for="job in failedItems"
            :key="job.id"
            class="flex items-center gap-4 px-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <p class="text-sm font-medium text-highlighted truncate">{{ job.contact_email }}</p>
                <UBadge color="neutral" variant="subtle" size="xs">Step {{ job.step_number }}</UBadge>
              </div>
              <p class="text-xs text-muted truncate">{{ job.campaign_name }} · {{ job.subject }}</p>
              <p class="text-xs text-error-600 mt-0.5 font-mono">
                {{ job.error_code ?? 'error' }}: {{ job.error_message ?? 'Unknown error' }}
              </p>
              <p class="text-xs text-muted mt-0.5">Failed {{ relTime(job.created_at) }} · {{ job.retry_count }} retries</p>
            </div>
          </li>
        </ul>
      </UCard>
    </div>

    <!-- Queue table -->
    <div class="flex items-center gap-3 mb-4">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search email or campaign…" class="max-w-xs" />
      <p class="text-sm text-muted">{{ filteredQueue.length }} of {{ counts.total }} items</p>
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <div v-if="filteredQueue.length === 0" class="py-16 text-center">
        <UIcon name="i-lucide-layers" class="w-10 h-10 text-muted mx-auto mb-3" />
        <p class="text-sm font-semibold text-highlighted mb-1">Queue is empty</p>
        <p class="text-xs text-muted">No emails scheduled matching current filters.</p>
      </div>

      <table v-else-if="filteredQueue.length > 0" class="w-full text-sm">
        <thead>
          <tr class="border-b border-default">
            <th class="text-left py-2.5 px-4 text-xs font-medium text-muted uppercase tracking-wide">Recipient</th>
            <th class="text-left py-2.5 px-4 text-xs font-medium text-muted uppercase tracking-wide">Campaign</th>
            <th class="text-center py-2.5 px-4 text-xs font-medium text-muted uppercase tracking-wide">Step</th>
            <th class="text-right py-2.5 px-4 text-xs font-medium text-muted uppercase tracking-wide">Status</th>
            <th class="text-right py-2.5 px-4 text-xs font-medium text-muted uppercase tracking-wide">Scheduled</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredQueue"
            :key="item.campaign_contact_id"
            class="border-b border-default last:border-0 hover:bg-elevated transition-colors"
          >
            <td class="py-3 px-4">
              <p class="text-sm font-mono text-default">{{ item.contact_email }}</p>
            </td>
            <td class="py-3 px-4">
              <p class="text-sm text-default truncate max-w-xs">{{ item.campaign_name }}</p>
            </td>
            <td class="py-3 px-4 text-center">
              <span class="text-xs font-medium text-muted">{{ item.current_step }}</span>
            </td>
            <td class="py-3 px-4 text-right">
              <UBadge :color="queueStatusColor(item.status)" variant="subtle" size="sm" class="capitalize">
                {{ item.status }}
              </UBadge>
            </td>
            <td class="py-3 px-4 text-right">
              <span
                class="text-sm tabular-nums"
                :class="item.status === 'overdue' ? 'text-error-600 font-medium' : 'text-muted'"
              >
                {{ fmtScheduled(item.next_send_at) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>

    </template>

  </div>
</template>
