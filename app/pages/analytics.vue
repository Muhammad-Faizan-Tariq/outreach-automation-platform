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

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
)

// ── date range ────────────────────────────────────────────────────────
type Range = '7d' | '30d' | '90d'
const range = ref<Range>('30d')

const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 }

function generateLabels(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  })
}

// deterministic pseudo-random noise seeded by index
function wave(i: number, base: number, amp: number, period = 7): number {
  return Math.round(base + amp * Math.sin((i / period) * Math.PI) + (i % 3 === 0 ? -amp * 0.4 : 0))
}

const days = computed(() => RANGE_DAYS[range.value])
const labels = computed(() => generateLabels(days.value))

// daily sends data (200/day limit, dips on weekends)
const dailySends = computed(() =>
  Array.from({ length: days.value }, (_, i) => {
    const dow = (new Date().getDay() - (days.value - 1 - i) + 14) % 7
    if (dow === 0 || dow === 6) return Math.round(60 + (i % 4) * 8)
    return wave(i, 168, 28, 9)
  }),
)

// open rate % per day
const openRates = computed(() =>
  Array.from({ length: days.value }, (_, i) =>
    parseFloat((36 + 8 * Math.sin(i * 0.4) + (i % 5 === 0 ? -4 : 0)).toFixed(1)),
  ),
)

// reply rate % per day
const replyRates = computed(() =>
  Array.from({ length: days.value }, (_, i) =>
    parseFloat((9.5 + 3.5 * Math.sin(i * 0.35 + 1) + (i % 7 === 0 ? 2 : 0)).toFixed(1)),
  ),
)

// ── summary KPIs ──────────────────────────────────────────────────────
const totalSent = computed(() => dailySends.value.reduce((s, v) => s + v, 0))
const avgOpenRate = computed(() => (openRates.value.reduce((s, v) => s + v, 0) / days.value).toFixed(1))
const avgReplyRate = computed(() => (replyRates.value.reduce((s, v) => s + v, 0) / days.value).toFixed(1))
const totalReplies = computed(() => Math.round(totalSent.value * (Number(avgReplyRate.value) / 100)))
const totalBounced = computed(() => Math.round(totalSent.value * 0.015))

// ── chart: daily sends (Line) ─────────────────────────────────────────
const sendsChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Emails sent',
      data: dailySends.value,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
    },
  ],
}))

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: { legend: { display: false }, tooltip: { mode: 'index' as const } },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#94a3b8',
        font: { size: 11 },
        maxTicksLimit: 8,
        maxRotation: 0,
      },
    },
    y: {
      grid: { color: 'rgba(148,163,184,0.08)' },
      ticks: { color: '#94a3b8', font: { size: 11 } },
      beginAtZero: true,
    },
  },
}

// ── chart: open & reply rates (Line, dual) ────────────────────────────
const ratesChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Open rate %',
      data: openRates.value,
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.06)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
    },
    {
      label: 'Reply rate %',
      data: replyRates.value,
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.06)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
    },
  ],
}))

const ratesOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 16 },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 }, maxTicksLimit: 8, maxRotation: 0 },
    },
    y: {
      grid: { color: 'rgba(148,163,184,0.08)' },
      ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v: unknown) => `${v}%` },
      beginAtZero: true,
      max: 60,
    },
  },
}

// ── chart: campaign comparison (horizontal Bar) ───────────────────────
const campaignNames = [
  'Palm Jumeirah VIP',
  'Marina Q2 Outreach',
  'Business Bay Landlords',
  'Downtown Sellers Q2',
  'JBR Investor Outreach',
  'Tenant Upgrade Program',
]
const campaignReplyRates = [16.3, 10.8, 11.0, 9.99, 8.98, 5.0]

const campaignChartData = {
  labels: campaignNames,
  datasets: [
    {
      label: 'Reply rate %',
      data: campaignReplyRates,
      backgroundColor: campaignReplyRates.map(v =>
        v >= 12 ? 'rgba(34,197,94,0.75)' : v >= 8 ? 'rgba(99,102,241,0.75)' : 'rgba(148,163,184,0.5)',
      ),
      borderRadius: 4,
      borderSkipped: false,
    },
  ],
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { parsed: { x: number } }) => ` ${ctx.parsed.x}% reply rate`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148,163,184,0.08)' },
      ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v: unknown) => `${v}%` },
      beginAtZero: true,
      max: 20,
    },
    y: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 } },
    },
  },
}

// ── chart: outcome distribution (Doughnut) ────────────────────────────
const doughnutData = computed(() => {
  const replied = totalReplies.value
  const openedOnly = Math.round(totalSent.value * 0.33)
  const bounced = totalBounced.value
  const sentOnly = totalSent.value - replied - openedOnly - bounced
  return {
    labels: ['Replied', 'Opened only', 'Sent only', 'Bounced'],
    datasets: [
      {
        data: [replied, openedOnly, sentOnly, bounced],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(148, 163, 184, 0.4)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: 'transparent',
        hoverOffset: 6,
      },
    ],
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: { color: '#94a3b8', font: { size: 11 }, padding: 14, boxWidth: 12 },
    },
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; parsed: number; dataset: { data: number[] } }) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
          const pct = ((ctx.parsed / total) * 100).toFixed(1)
          return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`
        },
      },
    },
  },
}

// ── inbox stats table ─────────────────────────────────────────────────
const inboxStats = [
  { email: 'outreach1@dxbpropvault.com', sent: 820, opens: 328, replies: 89, bounces: 12, score: 94.5 },
  { email: 'outreach2@dxbpropvault.com', sent: 780, opens: 296, replies: 74, bounces: 10, score: 88.2 },
  { email: 'outreach3@dxbpropvault.com', sent: 760, opens: 319, replies: 82, bounces: 9, score: 91.8 },
  { email: 'outreach4@dxbpropvault.com', sent: 840, opens: 369, replies: 97, bounces: 13, score: 96.1 },
  { email: 'campaigns@propvault.ae', sent: 340, opens: 115, replies: 31, bounces: 8, score: 72.0 },
  { email: 'outreach5@dxbpropvault.com', sent: 220, opens: 77, replies: 19, bounces: 7, score: 68.4 },
]

function scoreColor(s: number) {
  if (s >= 80) return 'text-success-600'
  if (s >= 60) return 'text-warning-600'
  return 'text-error-600'
}
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Analytics</h1>
        <p class="mt-0.5 text-sm text-muted">Platform-wide sending performance</p>
      </div>
      <!-- Date range selector -->
      <div class="flex items-center gap-1 border border-default rounded-lg p-0.5">
        <UButton
          v-for="r in (['7d', '30d', '90d'] as Range[])"
          :key="r"
          size="sm"
          :color="range === r ? 'primary' : 'neutral'"
          :variant="range === r ? 'solid' : 'ghost'"
          @click="range = r"
        >
          {{ r }}
        </UButton>
      </div>
    </div>

    <!-- KPI row -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <UCard>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Sent</p>
        <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ totalSent.toLocaleString() }}</p>
        <p class="text-xs text-muted mt-0.5">last {{ days }}d</p>
      </UCard>
      <UCard>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Avg Open Rate</p>
        <p class="text-2xl font-semibold tabular-nums" :class="Number(avgOpenRate) >= 30 ? 'text-success-600' : 'text-warning-600'">{{ avgOpenRate }}%</p>
        <p class="text-xs text-muted mt-0.5">avg / day</p>
      </UCard>
      <UCard>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Avg Reply Rate</p>
        <p class="text-2xl font-semibold text-success-600 tabular-nums">{{ avgReplyRate }}%</p>
        <p class="text-xs text-muted mt-0.5">avg / day</p>
      </UCard>
      <UCard>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Total Replies</p>
        <p class="text-2xl font-semibold text-success-600 tabular-nums">{{ totalReplies.toLocaleString() }}</p>
        <p class="text-xs text-muted mt-0.5">last {{ days }}d</p>
      </UCard>
      <UCard>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Bounced</p>
        <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ totalBounced.toLocaleString() }}</p>
        <p class="text-xs text-muted mt-0.5">{{ ((totalBounced / totalSent) * 100).toFixed(1) }}% bounce rate</p>
      </UCard>
    </div>

    <!-- Row 1: Daily sends + Rates -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

      <UCard>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-highlighted">Daily Sends</h3>
            <p class="text-xs text-muted">Total emails sent per day</p>
          </div>
          <span class="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">200/day limit</span>
        </div>
        <ClientOnly>
          <div class="h-48">
            <Line :data="sendsChartData" :options="lineOptions" />
          </div>
          <template #fallback>
            <div class="h-48 bg-elevated rounded-lg animate-pulse" />
          </template>
        </ClientOnly>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-highlighted">Open &amp; Reply Rates</h3>
            <p class="text-xs text-muted">Daily percentage over time</p>
          </div>
        </div>
        <ClientOnly>
          <div class="h-48">
            <Line :data="ratesChartData" :options="ratesOptions" />
          </div>
          <template #fallback>
            <div class="h-48 bg-elevated rounded-lg animate-pulse" />
          </template>
        </ClientOnly>
      </UCard>

    </div>

    <!-- Row 2: Campaign comparison + Outcome distribution -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

      <!-- Campaign reply rate bar (3 cols) -->
      <UCard class="lg:col-span-3">
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-highlighted">Campaign Reply Rates</h3>
          <p class="text-xs text-muted">All-time reply rate by campaign</p>
        </div>
        <ClientOnly>
          <div class="h-52">
            <Bar :data="campaignChartData" :options="barOptions" />
          </div>
          <template #fallback>
            <div class="h-52 bg-elevated rounded-lg animate-pulse" />
          </template>
        </ClientOnly>
      </UCard>

      <!-- Outcome donut (2 cols) -->
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

    <!-- Inbox performance table -->
    <UCard>
      <div class="mb-4">
        <h3 class="text-sm font-semibold text-highlighted">Inbox Performance</h3>
        <p class="text-xs text-muted">Breakdown by sending inbox (all time)</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default">
              <th class="text-left py-2 pr-4 text-xs font-medium text-muted uppercase tracking-wide">Inbox</th>
              <th class="text-right py-2 px-4 text-xs font-medium text-muted uppercase tracking-wide">Sent</th>
              <th class="text-right py-2 px-4 text-xs font-medium text-muted uppercase tracking-wide">Open %</th>
              <th class="text-right py-2 px-4 text-xs font-medium text-muted uppercase tracking-wide">Reply %</th>
              <th class="text-right py-2 px-4 text-xs font-medium text-muted uppercase tracking-wide">Bounce %</th>
              <th class="text-right py-2 pl-4 text-xs font-medium text-muted uppercase tracking-wide">Health</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="inbox in inboxStats"
              :key="inbox.email"
              class="border-b border-default last:border-0 hover:bg-elevated transition-colors"
            >
              <td class="py-3 pr-4">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <UIcon name="i-simple-icons-gmail" class="w-3 h-3 text-red-500" />
                  </div>
                  <span class="font-mono text-xs text-default">{{ inbox.email }}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-right tabular-nums text-default font-medium">{{ inbox.sent.toLocaleString() }}</td>
              <td class="py-3 px-4 text-right tabular-nums text-info-600 font-semibold">{{ ((inbox.opens / inbox.sent) * 100).toFixed(1) }}%</td>
              <td class="py-3 px-4 text-right tabular-nums text-success-600 font-semibold">{{ ((inbox.replies / inbox.sent) * 100).toFixed(1) }}%</td>
              <td class="py-3 px-4 text-right tabular-nums" :class="inbox.bounces / inbox.sent >= 0.02 ? 'text-warning-600' : 'text-muted'">
                {{ ((inbox.bounces / inbox.sent) * 100).toFixed(1) }}%
              </td>
              <td class="py-3 pl-4 text-right">
                <span class="font-semibold tabular-nums" :class="scoreColor(inbox.score)">{{ inbox.score }}</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-default bg-elevated">
              <td class="py-2.5 pr-4 text-xs font-semibold text-highlighted">Total</td>
              <td class="py-2.5 px-4 text-right text-xs font-semibold text-highlighted tabular-nums">
                {{ inboxStats.reduce((s, r) => s + r.sent, 0).toLocaleString() }}
              </td>
              <td class="py-2.5 px-4 text-right text-xs font-semibold text-info-600 tabular-nums">
                {{ ((inboxStats.reduce((s, r) => s + r.opens, 0) / inboxStats.reduce((s, r) => s + r.sent, 0)) * 100).toFixed(1) }}%
              </td>
              <td class="py-2.5 px-4 text-right text-xs font-semibold text-success-600 tabular-nums">
                {{ ((inboxStats.reduce((s, r) => s + r.replies, 0) / inboxStats.reduce((s, r) => s + r.sent, 0)) * 100).toFixed(1) }}%
              </td>
              <td class="py-2.5 px-4 text-right text-xs font-semibold text-muted tabular-nums">
                {{ ((inboxStats.reduce((s, r) => s + r.bounces, 0) / inboxStats.reduce((s, r) => s + r.sent, 0)) * 100).toFixed(1) }}%
              </td>
              <td class="py-2.5 pl-4" />
            </tr>
          </tfoot>
        </table>
      </div>
    </UCard>

  </div>
</template>
