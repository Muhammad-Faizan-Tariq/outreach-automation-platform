<script setup lang="ts">
import type { AnalyticsSummary } from '~/composables/useAnalytics'

const { user } = useAuth()
const router = useRouter()
const { fetchSummary } = useAnalytics()
const { fetchQueue, fetchFailed } = useQueue()

type BadgeColor = 'success' | 'neutral' | 'error' | 'warning' | 'primary' | 'info'

const summary = ref<AnalyticsSummary | null>(null)
const queueTotal = ref(0)
const failedTotal = ref(0)
const loading = ref(true)

onMounted(async () => {
  const [sum, q, f] = await Promise.all([
    fetchSummary().catch(() => null),
    fetchQueue({ page_size: 1 }).catch(() => null),
    fetchFailed({ page_size: 1 }).catch(() => null),
  ])
  summary.value = sum
  queueTotal.value = q?.total ?? 0
  failedTotal.value = f?.total ?? 0
  loading.value = false
})

const sendProgress = computed(() => {
  if (!summary.value || !summary.value.daily_send_capacity) return 0
  return Math.min(100, Math.round((summary.value.sent_today / summary.value.daily_send_capacity) * 100))
})

const maxCampaignSent = computed(() => {
  const campaigns = summary.value?.top_campaigns ?? []
  if (!campaigns.length) return 1
  return Math.max(...campaigns.map(c => c.total_sent))
})

const CAMPAIGN_STATUS_COLOR: Record<string, BadgeColor> = {
  running: 'success', paused: 'warning', draft: 'neutral', completed: 'info', error: 'error',
}
function cStatusColor(s: string): BadgeColor { return (CAMPAIGN_STATUS_COLOR[s] ?? 'neutral') as BadgeColor }

const inboxHealthRows = computed(() => {
  const h = summary.value?.inbox_health
  if (!h) return []
  return [
    { label: 'Healthy', count: h.healthy, color: 'text-success-600', dot: 'bg-success-500' },
    { label: 'Reduced', count: h.reduced, color: 'text-warning-600', dot: 'bg-warning-500' },
    { label: 'Critical', count: h.critical, color: 'text-error-600', dot: 'bg-error-500' },
  ]
})

const totalInboxes = computed(() => {
  const h = summary.value?.inbox_health
  if (!h) return 0
  return h.healthy + h.reduced + h.critical
})

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <!-- Welcome -->
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-highlighted">
        Good {{ greeting }}, {{ user?.full_name?.split(' ')[0] ?? 'there' }}
      </h1>
      <p class="mt-1 text-sm text-muted">Here's what's happening in your outreach platform.</p>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-24 bg-elevated rounded-xl animate-pulse" />
      </div>
      <div class="h-16 bg-elevated rounded-xl animate-pulse" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 h-64 bg-elevated rounded-xl animate-pulse" />
        <div class="space-y-4">
          <div class="h-32 bg-elevated rounded-xl animate-pulse" />
          <div class="h-32 bg-elevated rounded-xl animate-pulse" />
        </div>
      </div>
    </div>

    <template v-else-if="summary">

      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <NuxtLink to="/contacts" class="block">
          <UCard class="hover:shadow-md transition-shadow cursor-pointer h-full">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                <UIcon name="i-lucide-users" class="w-5 h-5 text-primary" />
              </div>
              <div>
                <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ summary.total_contacts.toLocaleString() }}</p>
                <p class="text-xs text-muted mt-0.5">Total Contacts</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
        <NuxtLink to="/campaigns" class="block">
          <UCard class="hover:shadow-md transition-shadow cursor-pointer h-full">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-success-50">
                <UIcon name="i-lucide-megaphone" class="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ summary.active_campaigns }}</p>
                <p class="text-xs text-muted mt-0.5">Active Campaigns</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
        <NuxtLink to="/sent-emails" class="block">
          <UCard class="hover:shadow-md transition-shadow cursor-pointer h-full">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-info-50">
                <UIcon name="i-lucide-send" class="w-5 h-5 text-info-600" />
              </div>
              <div>
                <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ summary.sent_today.toLocaleString() }}</p>
                <p class="text-xs text-muted mt-0.5">Emails Sent Today</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
        <NuxtLink to="/replies" class="block">
          <UCard class="hover:shadow-md transition-shadow cursor-pointer h-full">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-violet-50">
                <UIcon name="i-lucide-reply" class="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ summary.replies_today }}</p>
                <p class="text-xs text-muted mt-0.5">New Replies Today</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <!-- Sending progress bar -->
      <UCard class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <div>
            <p class="text-sm font-semibold text-highlighted">Today's Sending Progress</p>
            <p class="text-xs text-muted mt-0.5">
              {{ summary.sent_today.toLocaleString() }} / {{ summary.daily_send_capacity.toLocaleString() }} emails sent today
            </p>
          </div>
          <span
            class="text-sm font-semibold tabular-nums"
            :class="sendProgress >= 90 ? 'text-success-600' : 'text-primary'"
          >
            {{ sendProgress }}%
          </span>
        </div>
        <div class="h-2.5 bg-elevated rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="sendProgress >= 90 ? 'bg-success-500' : 'bg-primary'"
            :style="{ width: sendProgress + '%' }"
          />
        </div>
        <div class="flex justify-between text-xs text-muted mt-1.5">
          <span>0</span>
          <span>{{ summary.daily_send_capacity.toLocaleString() }} daily capacity</span>
        </div>
      </UCard>

      <!-- Main grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Left: Top campaigns -->
        <div class="lg:col-span-2">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-highlighted">Top Campaigns</h2>
            <NuxtLink to="/campaigns" class="text-sm text-primary hover:underline">View all</NuxtLink>
          </div>
          <UCard :ui="{ body: 'p-0' }">
            <div v-if="!summary.top_campaigns.length" class="py-10 text-center text-sm text-muted">
              No active campaigns yet
            </div>
            <ul v-else class="divide-y divide-default">
              <li
                v-for="c in summary.top_campaigns"
                :key="c.id"
                class="flex items-center gap-3 px-4 py-3 hover:bg-elevated cursor-pointer transition-colors"
                @click="router.push('/campaigns/' + c.id)"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1.5">
                    <p class="text-sm font-medium text-highlighted truncate">{{ c.name }}</p>
                    <UBadge :color="cStatusColor(c.status)" variant="subtle" size="xs" class="capitalize shrink-0">
                      {{ c.status }}
                    </UBadge>
                  </div>
                  <div class="h-1.5 bg-elevated rounded-full overflow-hidden">
                    <div
                      class="h-full bg-primary rounded-full"
                      :style="{ width: Math.round((c.total_sent / maxCampaignSent) * 100) + '%' }"
                    />
                  </div>
                </div>
                <div class="text-right shrink-0 w-24">
                  <p class="text-sm font-semibold text-highlighted tabular-nums">{{ c.total_sent.toLocaleString() }}</p>
                  <p class="text-xs text-success-600 tabular-nums">{{ c.total_replied }} replies</p>
                </div>
              </li>
            </ul>
          </UCard>
        </div>

        <!-- Right column -->
        <div class="space-y-6">

          <!-- Inbox health -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-base font-semibold text-highlighted">Inbox Health</h2>
              <NuxtLink to="/inboxes" class="text-sm text-primary hover:underline">Manage</NuxtLink>
            </div>
            <UCard>
              <ul class="space-y-3">
                <li v-for="h in inboxHealthRows" :key="h.label" class="flex items-center gap-3">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="h.dot" />
                  <span class="text-sm text-default flex-1">{{ h.label }}</span>
                  <span class="text-sm font-semibold tabular-nums" :class="h.color">{{ h.count }}</span>
                </li>
              </ul>
              <div class="mt-3 pt-3 border-t border-default">
                <p class="text-xs text-muted">{{ totalInboxes }} total inboxes</p>
              </div>
            </UCard>
          </div>

          <!-- Queue snapshot -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-base font-semibold text-highlighted">Queue Snapshot</h2>
              <NuxtLink to="/queue" class="text-sm text-primary hover:underline">View queue</NuxtLink>
            </div>
            <UCard>
              <div class="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p class="text-xl font-semibold text-highlighted tabular-nums">{{ queueTotal }}</p>
                  <p class="text-xs text-muted mt-0.5">Pending</p>
                </div>
                <div>
                  <p
                    class="text-xl font-semibold tabular-nums"
                    :class="failedTotal > 0 ? 'text-error-600' : 'text-muted'"
                  >
                    {{ failedTotal }}
                  </p>
                  <p class="text-xs text-muted mt-0.5">Failed</p>
                </div>
              </div>
              <div v-if="failedTotal > 0" class="mt-3 pt-3 border-t border-default">
                <NuxtLink to="/queue" class="text-xs text-error-600 hover:underline flex items-center gap-1">
                  <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5" />
                  {{ failedTotal }} failed job{{ failedTotal > 1 ? 's' : '' }} need attention
                </NuxtLink>
              </div>
            </UCard>
          </div>

          <!-- Quick actions -->
          <div>
            <h2 class="text-base font-semibold text-highlighted mb-3">Quick Actions</h2>
            <div class="space-y-2">
              <NuxtLink
                to="/campaigns/create"
                class="flex items-center gap-3 px-4 py-3 rounded-lg border border-default hover:bg-elevated transition-colors"
              >
                <UIcon name="i-lucide-megaphone" class="w-4.5 h-4.5 text-primary shrink-0" />
                <span class="text-sm font-medium text-highlighted">New Campaign</span>
              </NuxtLink>
              <NuxtLink
                to="/contacts"
                class="flex items-center gap-3 px-4 py-3 rounded-lg border border-default hover:bg-elevated transition-colors"
              >
                <UIcon name="i-lucide-upload" class="w-4.5 h-4.5 text-primary shrink-0" />
                <span class="text-sm font-medium text-highlighted">Import Contacts</span>
              </NuxtLink>
              <NuxtLink
                to="/inboxes"
                class="flex items-center gap-3 px-4 py-3 rounded-lg border border-default hover:bg-elevated transition-colors"
              >
                <UIcon name="i-lucide-mail-plus" class="w-4.5 h-4.5 text-primary shrink-0" />
                <span class="text-sm font-medium text-highlighted">Connect Inbox</span>
              </NuxtLink>
            </div>
          </div>

        </div>
      </div>

    </template>

    <!-- Error / no data -->
    <div v-else class="py-20 text-center">
      <UIcon name="i-lucide-wifi-off" class="w-10 h-10 text-muted mx-auto mb-3" />
      <p class="text-sm font-semibold text-highlighted mb-1">Couldn't load dashboard</p>
      <p class="text-xs text-muted">Check that the API server is running.</p>
    </div>

  </div>
</template>
