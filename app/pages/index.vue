<script setup lang="ts">
const { user } = useAuth()
const router = useRouter()

type BadgeColor = 'success' | 'neutral' | 'error' | 'warning' | 'primary' | 'info'

// ── stat cards ─────────────────────────────────────────────────────────
const stats = [
  { label: 'Total Contacts', value: '2,041,330', icon: 'i-lucide-users', to: '/contacts', color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Active Campaigns', value: '3', icon: 'i-lucide-megaphone', to: '/campaigns', color: 'text-success-600', bg: 'bg-success-50' },
  { label: 'Emails Sent Today', value: '18,240', icon: 'i-lucide-send', to: '/sent-emails', color: 'text-info-600', bg: 'bg-info-50' },
  { label: 'New Replies Today', value: '47', icon: 'i-lucide-reply', to: '/replies', color: 'text-violet-600', bg: 'bg-violet-50' },
]

// ── sending progress ───────────────────────────────────────────────────
const sentToday = 18240
const dailyLimit = 20000
const sendProgress = Math.round((sentToday / dailyLimit) * 100)

// ── top campaigns ──────────────────────────────────────────────────────
const topCampaigns = [
  { id: '1', name: 'Marina Q2 Outreach', sent: 2941, replied: 318, status: 'active' as const },
  { id: '2', name: 'Downtown Sellers Q2', sent: 2110, replied: 201, status: 'active' as const },
  { id: '3', name: 'JBR Investor Outreach', sent: 1840, replied: 155, status: 'active' as const },
  { id: '4', name: 'GCC Investor Outreach', sent: 1200, replied: 98, status: 'paused' as const },
  { id: '5', name: 'Palm Jumeirah VIP', sent: 880, replied: 44, status: 'paused' as const },
]
const maxCampaignSent = Math.max(...topCampaigns.map(c => c.sent))

const CAMPAIGN_STATUS_COLOR: Record<string, BadgeColor> = {
  active: 'success', paused: 'warning', draft: 'neutral', completed: 'info', error: 'error',
}
function cStatusColor(s: string): BadgeColor { return (CAMPAIGN_STATUS_COLOR[s] ?? 'neutral') as BadgeColor }

// ── inbox health ───────────────────────────────────────────────────────
const inboxHealth = [
  { label: 'Healthy', count: 5, color: 'text-success-600', dot: 'bg-success-500' },
  { label: 'Reduced', count: 2, color: 'text-warning-600', dot: 'bg-warning-500' },
  { label: 'Paused', count: 1, color: 'text-error-600', dot: 'bg-error-500' },
]

// ── recent replies ──────────────────────────────────────────────────────
const recentReplies = [
  { id: 'r1', name: 'Ahmed Al-Rashidi', email: 'ahmed.alrashidi@gmail.com', campaign: 'Marina Q2 Outreach', label: 'Interested', labelColor: 'success' as BadgeColor, time: '8m ago' },
  { id: 'r2', name: 'Sara Al-Mansoori', email: 'sara.almansoori@outlook.com', campaign: 'Downtown Sellers Q2', label: 'Questions', labelColor: 'info' as BadgeColor, time: '22m ago' },
  { id: 'r3', name: 'Hind Al-Qasimi', email: 'hind.alqasimi@outlook.com', campaign: 'JBR Investor Outreach', label: 'Interested', labelColor: 'success' as BadgeColor, time: '1h ago' },
  { id: 'r4', name: 'Nadia Karim', email: 'nadia.karim@hotmail.com', campaign: 'Marina Q2 Outreach', label: 'OOO', labelColor: 'warning' as BadgeColor, time: '2h ago' },
  { id: 'r5', name: 'Sultan Al-Manei', email: 'sultan.almanei@outlook.com', campaign: 'Downtown Sellers Q2', label: 'Interested', labelColor: 'success' as BadgeColor, time: '3h ago' },
]

// ── queue snapshot ──────────────────────────────────────────────────────
const queueSnapshot = { pending: 8, processing: 1, failed: 0 }
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <!-- Welcome -->
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-highlighted">
        Good {{ new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening' }},
        {{ user?.full_name?.split(' ')[0] ?? 'there' }}
      </h1>
      <p class="mt-1 text-sm text-muted">Here's what's happening in your outreach platform.</p>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <NuxtLink v-for="stat in stats" :key="stat.label" :to="stat.to" class="block">
        <UCard class="hover:shadow-md transition-shadow cursor-pointer h-full">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="stat.bg">
              <UIcon :name="stat.icon" class="w-5 h-5" :class="stat.color" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ stat.value }}</p>
              <p class="text-xs text-muted mt-0.5">{{ stat.label }}</p>
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
          <p class="text-xs text-muted mt-0.5">{{ sentToday.toLocaleString() }} / {{ dailyLimit.toLocaleString() }} emails sent today</p>
        </div>
        <span class="text-sm font-semibold tabular-nums" :class="sendProgress >= 90 ? 'text-success-600' : 'text-primary'">{{ sendProgress }}%</span>
      </div>
      <div class="h-2.5 bg-elevated rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all"
          :class="sendProgress >= 90 ? 'bg-success-500' : 'bg-primary'"
          :style="{ width: `${sendProgress}%` }"
        />
      </div>
      <div class="flex justify-between text-xs text-muted mt-1.5">
        <span>0</span>
        <span>{{ dailyLimit.toLocaleString() }} daily limit</span>
      </div>
    </UCard>

    <!-- Main grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Left column -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Top campaigns -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-highlighted">Top Campaigns</h2>
            <NuxtLink to="/campaigns" class="text-sm text-primary hover:underline">View all</NuxtLink>
          </div>
          <UCard :ui="{ body: 'p-0' }">
            <ul class="divide-y divide-default">
              <li
                v-for="c in topCampaigns"
                :key="c.id"
                class="flex items-center gap-3 px-4 py-3 hover:bg-elevated cursor-pointer transition-colors"
                @click="router.push(`/campaigns/${c.id}`)"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1.5">
                    <p class="text-sm font-medium text-highlighted truncate">{{ c.name }}</p>
                    <UBadge :color="cStatusColor(c.status)" variant="subtle" size="xs" class="capitalize shrink-0">{{ c.status }}</UBadge>
                  </div>
                  <div class="h-1.5 bg-elevated rounded-full overflow-hidden">
                    <div
                      class="h-full bg-primary rounded-full"
                      :style="{ width: `${Math.round((c.sent / maxCampaignSent) * 100)}%` }"
                    />
                  </div>
                </div>
                <div class="text-right shrink-0 w-20">
                  <p class="text-sm font-semibold text-highlighted tabular-nums">{{ c.sent.toLocaleString() }}</p>
                  <p class="text-xs text-success-600 tabular-nums">{{ c.replied }} replies</p>
                </div>
              </li>
            </ul>
          </UCard>
        </div>

        <!-- Recent replies -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-highlighted">Recent Replies</h2>
            <NuxtLink to="/replies" class="text-sm text-primary hover:underline">Open inbox</NuxtLink>
          </div>
          <UCard :ui="{ body: 'p-0' }">
            <ul class="divide-y divide-default">
              <li
                v-for="r in recentReplies"
                :key="r.id"
                class="flex items-center gap-3 px-4 py-3 hover:bg-elevated cursor-pointer transition-colors"
                @click="router.push('/replies')"
              >
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="text-xs font-semibold text-primary">{{ r.name.charAt(0) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-highlighted truncate">{{ r.name }}</p>
                  <p class="text-xs text-muted truncate">{{ r.campaign }}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <UBadge :color="r.labelColor" variant="subtle" size="xs">{{ r.label }}</UBadge>
                  <span class="text-xs text-muted">{{ r.time }}</span>
                </div>
              </li>
            </ul>
          </UCard>
        </div>

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
              <li v-for="h in inboxHealth" :key="h.label" class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="h.dot" />
                <span class="text-sm text-default flex-1">{{ h.label }}</span>
                <span class="text-sm font-semibold tabular-nums" :class="h.color">{{ h.count }}</span>
              </li>
            </ul>
            <div class="mt-3 pt-3 border-t border-default">
              <p class="text-xs text-muted">
                {{ inboxHealth.reduce((s, h) => s + h.count, 0) }} total inboxes &middot;
                {{ inboxHealth[0]?.count ?? 0 }} sending at full capacity
              </p>
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
            <div class="grid grid-cols-3 gap-2 text-center">
              <div>
                <p class="text-xl font-semibold text-highlighted tabular-nums">{{ queueSnapshot.pending }}</p>
                <p class="text-xs text-muted mt-0.5">Pending</p>
              </div>
              <div>
                <p class="text-xl font-semibold text-primary tabular-nums">{{ queueSnapshot.processing }}</p>
                <p class="text-xs text-muted mt-0.5">Processing</p>
              </div>
              <div>
                <p class="text-xl font-semibold tabular-nums" :class="queueSnapshot.failed > 0 ? 'text-error-600' : 'text-muted'">
                  {{ queueSnapshot.failed }}
                </p>
                <p class="text-xs text-muted mt-0.5">Failed</p>
              </div>
            </div>
            <div v-if="queueSnapshot.failed > 0" class="mt-3 pt-3 border-t border-default">
              <NuxtLink to="/queue" class="text-xs text-error-600 hover:underline flex items-center gap-1">
                <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5" />
                {{ queueSnapshot.failed }} failed job{{ queueSnapshot.failed > 1 ? 's' : '' }} need attention
              </NuxtLink>
            </div>
          </UCard>
        </div>

        <!-- Quick actions -->
        <div>
          <h2 class="text-base font-semibold text-highlighted mb-3">Quick Actions</h2>
          <div class="space-y-2">
            <NuxtLink to="/campaigns/create" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-default hover:bg-elevated transition-colors">
              <UIcon name="i-lucide-megaphone" class="w-4.5 h-4.5 text-primary shrink-0" />
              <span class="text-sm font-medium text-highlighted">New Campaign</span>
            </NuxtLink>
            <NuxtLink to="/contacts" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-default hover:bg-elevated transition-colors">
              <UIcon name="i-lucide-upload" class="w-4.5 h-4.5 text-primary shrink-0" />
              <span class="text-sm font-medium text-highlighted">Import Contacts</span>
            </NuxtLink>
            <NuxtLink to="/inboxes" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-default hover:bg-elevated transition-colors">
              <UIcon name="i-lucide-mail-plus" class="w-4.5 h-4.5 text-primary shrink-0" />
              <span class="text-sm font-medium text-highlighted">Connect Inbox</span>
            </NuxtLink>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
