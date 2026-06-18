<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import type { AnalyticsSummary, AnalyticsMetrics } from '~/composables/useAnalytics'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
)

type Range = '7d' | '30d' | '90d'

const { fetchSummary, fetchMetrics } = useAnalytics()
const { public: cfg } = useRuntimeConfig()

const range = ref<Range>('30d')
const summary = ref<AnalyticsSummary | null>(null)
const metrics = ref<AnalyticsMetrics | null>(null)
const loading = ref(true)
const loadingMetrics = ref(false)
const lastUpdated = ref<Date | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null
let rangeSeq = 0

async function load(silent = false) {
  if (!silent) loading.value = true
  const [s, m] = await Promise.all([
    fetchSummary().catch(() => null),
    fetchMetrics(range.value).catch(() => null),
  ])
  summary.value = s
  metrics.value = m
  loading.value = false
  if (s) lastUpdated.value = new Date()
}

async function changeRange(r: Range) {
  range.value = r
  loadingMetrics.value = true
  const seq = ++rangeSeq
  const m = await fetchMetrics(r).catch(() => null)
  if (seq === rangeSeq) {
    metrics.value = m
    loadingMetrics.value = false
  }
}

onMounted(() => {
  load()
  refreshTimer = setInterval(() => load(true), cfg.refreshAnalytics)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

// ── label formatting ──────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtLabel(iso: string): string {
  const parts = iso.split('-')
  const day = Number(parts[2])
  const mon = MONTHS[(Number(parts[1]) - 1)] ?? ''
  return day + ' ' + mon
}

const chartLabels = computed(() => (metrics.value?.labels ?? []).map(fmtLabel))
const days = computed(() => metrics.value?.labels.length ?? 0)

// ── KPI totals ────────────────────────────────────────────────────────────
const totalSent = computed(() => (metrics.value?.sent ?? []).reduce((s, v) => s + v, 0))
const totalReplied = computed(() => (metrics.value?.replied ?? []).reduce((s, v) => s + v, 0))
const totalBounced = computed(() => (metrics.value?.bounced ?? []).reduce((s, v) => s + v, 0))
const totalOpened = computed(() => (metrics.value?.opened ?? []).reduce((s, v) => s + v, 0))

const avgOpenRate = computed(() => {
  const rates = (metrics.value?.open_rate ?? []).filter(r => r > 0)
  if (!rates.length) return '0.0'
  return ((rates.reduce((s, r) => s + r, 0) / rates.length) * 100).toFixed(1)
})
const avgReplyRate = computed(() => {
  const rates = (metrics.value?.reply_rate ?? []).filter(r => r > 0)
  if (!rates.length) return '0.0'
  return ((rates.reduce((s, r) => s + r, 0) / rates.length) * 100).toFixed(1)
})

// ── chart datasets ────────────────────────────────────────────────────────
const sendsChartData = computed(() => ({
  labels: chartLabels.value,
  datasets: [{
    label: 'Emails sent',
    data: metrics.value?.sent ?? [],
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4,
  }],
}))

const openRatesPct = computed(() => (metrics.value?.open_rate ?? []).map(r => parseFloat((r * 100).toFixed(1))))
const replyRatesPct = computed(() => (metrics.value?.reply_rate ?? []).map(r => parseFloat((r * 100).toFixed(1))))

const ratesChartData = computed(() => ({
  labels: chartLabels.value,
  datasets: [
    {
      label: 'Open rate %',
      data: openRatesPct.value,
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.06)',
      borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4,
    },
    {
      label: 'Reply rate %',
      data: replyRatesPct.value,
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.06)',
      borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4,
    },
  ],
}))

const campaignNames = computed(() => summary.value?.top_campaigns.map(c => c.name) ?? [])
const campaignRates = computed(() => summary.value?.top_campaigns.map(c => parseFloat((c.reply_rate * 100).toFixed(1))) ?? [])
const barMax = computed(() => {
  const max = Math.max(...campaignRates.value, 5)
  return Math.ceil(max / 5) * 5 + 5
})

const campaignChartData = computed(() => ({
  labels: campaignNames.value,
  datasets: [{
    label: 'Reply rate %',
    data: campaignRates.value,
    backgroundColor: campaignRates.value.map(v =>
      v >= 12 ? 'rgba(34,197,94,0.75)' : v >= 8 ? 'rgba(99,102,241,0.75)' : 'rgba(148,163,184,0.5)',
    ),
    borderRadius: 4,
    borderSkipped: false,
  }],
}))

const doughnutData = computed(() => {
  const replied = totalReplied.value
  const openedOnly = Math.max(0, totalOpened.value - replied)
  const bounced = totalBounced.value
  const rest = Math.max(0, totalSent.value - replied - openedOnly - bounced)
  return {
    labels: ['Replied', 'Opened only', 'Sent only', 'Bounced'],
    datasets: [{
      data: [replied, openedOnly, rest, bounced],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(148, 163, 184, 0.4)',
        'rgba(239, 68, 68, 0.7)',
      ],
      borderColor: 'transparent',
      hoverOffset: 6,
    }],
  }
})

// ── chart options ─────────────────────────────────────────────────────────
const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: { legend: { display: false }, tooltip: { mode: 'index' as const } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 }, maxTicksLimit: 8, maxRotation: 0 } },
    y: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 11 } }, beginAtZero: true },
  },
}

const ratesOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      display: true, position: 'top' as const,
      labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 16 },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 }, maxTicksLimit: 8, maxRotation: 0 } },
    y: {
      grid: { color: 'rgba(148,163,184,0.08)' },
      ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v: unknown) => String(v) + '%' },
      beginAtZero: true, max: 60,
    },
  },
}

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: { parsed: { x: number } }) => ' ' + String(ctx.parsed.x) + '% reply rate' } },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148,163,184,0.08)' },
      ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v: unknown) => String(v) + '%' },
      beginAtZero: true,
      max: barMax.value,
    },
    y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
  },
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { position: 'right' as const, labels: { color: '#94a3b8', font: { size: 11 }, padding: 14, boxWidth: 12 } },
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; parsed: number; dataset: { data: number[] } }) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
          const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0'
          return ' ' + ctx.label + ': ' + ctx.parsed.toLocaleString() + ' (' + pct + '%)'
        },
      },
    },
  },
}

function rateColor(r: number) {
  if (r >= 8) return 'text-success-600'
  if (r >= 4) return 'text-warning-600'
  return 'text-error-600'
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Analytics</h1>
        <p class="mt-0.5 text-sm text-muted">
          Platform-wide sending performance
          <span v-if="lastUpdated" class="ml-2 text-xs">
            · Updated {{ lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </p>
      </div>
      <div class="flex items-center gap-2">
      <div class="flex items-center gap-1 border border-default rounded-lg p-0.5">
        <UButton
          v-for="r in (['7d', '30d', '90d'] as Range[])"
          :key="r"
          size="sm"
          :color="range === r ? 'primary' : 'neutral'"
          :variant="range === r ? 'solid' : 'ghost'"
          :loading="loadingMetrics && range === r"
          @click="changeRange(r)"
        >
          {{ r }}
        </UButton>
      </div>
      <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="xs" :loading="loadingMetrics" @click="load(true)" />
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <USkeleton v-for="i in 5" :key="i" class="h-20 rounded-xl" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <USkeleton class="h-56 rounded-xl" />
        <USkeleton class="h-56 rounded-xl" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <USkeleton class="lg:col-span-3 h-52 rounded-xl" />
        <USkeleton class="lg:col-span-2 h-52 rounded-xl" />
      </div>
    </div>

    <template v-else>

      <!-- KPI row -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Sent</p>
          <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ totalSent.toLocaleString() }}</p>
          <p class="text-xs text-muted mt-0.5">last {{ days }}d</p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Avg Open Rate</p>
          <p class="text-2xl font-semibold tabular-nums" :class="Number(avgOpenRate) >= 30 ? 'text-success-600' : 'text-warning-600'">
            {{ avgOpenRate }}%
          </p>
          <p class="text-xs text-muted mt-0.5">avg / day</p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Avg Reply Rate</p>
          <p class="text-2xl font-semibold text-success-600 tabular-nums">{{ avgReplyRate }}%</p>
          <p class="text-xs text-muted mt-0.5">avg / day</p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Total Replies</p>
          <p class="text-2xl font-semibold text-success-600 tabular-nums">{{ totalReplied.toLocaleString() }}</p>
          <p class="text-xs text-muted mt-0.5">last {{ days }}d</p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Bounced</p>
          <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ totalBounced.toLocaleString() }}</p>
          <p class="text-xs text-muted mt-0.5">
            {{ totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0.0' }}% bounce rate
          </p>
        </UCard>
      </div>

      <!-- Charts row 1: Daily sends + Rates -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <UCard>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-highlighted">Daily Sends</h3>
              <p class="text-xs text-muted">Total emails sent per day</p>
            </div>
          </div>
          <ClientOnly>
            <div class="h-48" :class="loadingMetrics ? 'opacity-40 pointer-events-none' : ''">
              <Line :data="sendsChartData" :options="lineOptions" />
            </div>
            <template #fallback>
              <div class="h-48 bg-elevated rounded-lg animate-pulse" />
            </template>
          </ClientOnly>
        </UCard>

        <UCard>
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-highlighted">Open &amp; Reply Rates</h3>
            <p class="text-xs text-muted">Daily percentage over time</p>
          </div>
          <ClientOnly>
            <div class="h-48" :class="loadingMetrics ? 'opacity-40 pointer-events-none' : ''">
              <Line :data="ratesChartData" :options="ratesOptions" />
            </div>
            <template #fallback>
              <div class="h-48 bg-elevated rounded-lg animate-pulse" />
            </template>
          </ClientOnly>
        </UCard>
      </div>

      <!-- Charts row 2: Campaign bar + Outcome doughnut -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <UCard class="lg:col-span-3">
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-highlighted">Campaign Reply Rates</h3>
            <p class="text-xs text-muted">All-time reply rate by campaign</p>
          </div>
          <ClientOnly>
            <div v-if="summary?.top_campaigns.length" class="h-52">
              <Bar :data="campaignChartData" :options="barOptions" />
            </div>
            <div v-else class="h-52 flex items-center justify-center">
              <p class="text-sm text-muted">No campaign data yet</p>
            </div>
            <template #fallback>
              <div class="h-52 bg-elevated rounded-lg animate-pulse" />
            </template>
          </ClientOnly>
        </UCard>

        <UCard class="lg:col-span-2">
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-highlighted">Outcome Distribution</h3>
            <p class="text-xs text-muted">All sent emails — last {{ days }}d</p>
          </div>
          <ClientOnly>
            <div class="h-52">
              <Doughnut :data="doughnutData" :options="doughnutOptions" />
            </div>
            <template #fallback>
              <div class="h-52 bg-elevated rounded-lg animate-pulse" />
            </template>
          </ClientOnly>
        </UCard>
      </div>

      <!-- Top campaigns table -->
      <UCard v-if="summary?.top_campaigns.length">
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-highlighted">Top Campaign Performance</h3>
          <p class="text-xs text-muted">Ranked by total emails sent (all time)</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default">
                <th class="text-left py-2 pr-4 text-xs font-medium text-muted uppercase tracking-wide">Campaign</th>
                <th class="text-right py-2 px-4 text-xs font-medium text-muted uppercase tracking-wide">Status</th>
                <th class="text-right py-2 px-4 text-xs font-medium text-muted uppercase tracking-wide">Sent</th>
                <th class="text-right py-2 px-4 text-xs font-medium text-muted uppercase tracking-wide">Replies</th>
                <th class="text-right py-2 pl-4 text-xs font-medium text-muted uppercase tracking-wide">Reply Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in summary.top_campaigns"
                :key="c.id"
                class="border-b border-default last:border-0 hover:bg-elevated transition-colors"
              >
                <td class="py-3 pr-4 text-sm font-medium text-highlighted">{{ c.name }}</td>
                <td class="py-3 px-4 text-right">
                  <UBadge :color="c.status === 'running' ? 'success' : 'warning'" variant="subtle" size="xs" class="capitalize">
                    {{ c.status }}
                  </UBadge>
                </td>
                <td class="py-3 px-4 text-right tabular-nums text-default font-medium">{{ c.total_sent.toLocaleString() }}</td>
                <td class="py-3 px-4 text-right tabular-nums text-success-600 font-semibold">{{ c.total_replied.toLocaleString() }}</td>
                <td class="py-3 pl-4 text-right">
                  <span class="font-semibold tabular-nums" :class="rateColor(c.reply_rate * 100)">
                    {{ (c.reply_rate * 100).toFixed(1) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

    </template>

  </div>
</template>
