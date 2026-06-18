<script setup lang="ts">
import type { EmailAccountDetail } from '~/composables/useInboxes'

const route = useRoute()
const toast = useToast()
const { getInbox, updateInbox, pauseInbox, resumeInbox, retireInbox, watchInbox } = useInboxes()

const inbox = ref<EmailAccountDetail | null>(null)
const loading = ref(true)
const notFound = ref(false)

async function fetchInbox(id: string) {
  loading.value = true
  notFound.value = false
  inbox.value = null
  try {
    inbox.value = await getInbox(id)
  }
  catch (e: any) {
    if (e?.status === 404 || e?.statusCode === 404) notFound.value = true
    else toast.add({ title: 'Failed to load inbox', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    loading.value = false
  }
}

watch(() => route.params.id, (id) => fetchInbox(id as string), { immediate: true })

// ── edit modal ────────────────────────────────────────────────────────
const editOpen = ref(false)
const editForm = ref({
  display_name: '',
  daily_send_limit: 50,
  timezone: '',
  send_window_start: '',
  send_window_end: '',
  send_days_of_week: [] as number[],
  notes: '',
})
const saving = ref(false)

function openEdit() {
  if (!inbox.value) return
  editForm.value = {
    display_name: inbox.value.display_name,
    daily_send_limit: inbox.value.daily_send_limit,
    timezone: inbox.value.timezone,
    send_window_start: inbox.value.send_window_start.slice(0, 5),
    send_window_end: inbox.value.send_window_end.slice(0, 5),
    send_days_of_week: [...inbox.value.send_days_of_week],
    notes: inbox.value.notes ?? '',
  }
  editOpen.value = true
}

function toggleDay(d: number) {
  const idx = editForm.value.send_days_of_week.indexOf(d)
  if (idx === -1) editForm.value.send_days_of_week.push(d)
  else editForm.value.send_days_of_week.splice(idx, 1)
}

async function saveEdit() {
  saving.value = true
  try {
    inbox.value = await updateInbox(route.params.id as string, {
      display_name: editForm.value.display_name,
      daily_send_limit: editForm.value.daily_send_limit,
      timezone: editForm.value.timezone,
      send_window_start: editForm.value.send_window_start + ':00',
      send_window_end: editForm.value.send_window_end + ':00',
      send_days_of_week: editForm.value.send_days_of_week,
      notes: editForm.value.notes || undefined,
    })
    editOpen.value = false
    toast.add({ title: 'Settings saved', color: 'success', icon: 'i-lucide-check-circle' })
  }
  catch (e: any) {
    toast.add({ title: 'Save failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    saving.value = false
  }
}

// ── actions ───────────────────────────────────────────────────────────
const acting = ref(false)

async function doAction(action: () => Promise<EmailAccountDetail>, successMsg: string) {
  acting.value = true
  try {
    inbox.value = await action()
    toast.add({ title: successMsg, color: 'success', icon: 'i-lucide-check-circle' })
  }
  catch (e: any) {
    toast.add({ title: 'Action failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    acting.value = false
  }
}

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

function fmtTime(t: string): string { return t.slice(0, 5) }

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function fmtDays(days: number[]): string {
  if (!days.length) return '—'
  const sorted = [...days].sort()
  return sorted.map(d => DAY_LABELS[d]).join(', ')
}

function fmtDt(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDate(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function scoreColor(n: number | null): string {
  if (n === null) return 'text-muted'
  if (Number(n) >= 80) return 'text-success-600'
  if (Number(n) >= 60) return 'text-warning-600'
  return 'text-error-600'
}

function usagePct(sent: number, limit: number): number {
  if (!limit) return 0
  return Math.min(100, Math.round((sent / limit) * 100))
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-8">

    <!-- Back -->
    <NuxtLink to="/inboxes" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to inboxes
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-8 w-72 bg-elevated rounded-lg animate-pulse" />
      <div class="h-48 bg-elevated rounded-xl animate-pulse" />
      <div class="h-48 bg-elevated rounded-xl animate-pulse" />
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="text-center py-24">
      <UIcon name="i-lucide-mail-x" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-lg font-semibold text-highlighted mb-1">Inbox not found</p>
      <NuxtLink to="/inboxes" class="text-sm text-primary hover:underline">Back to inboxes</NuxtLink>
    </div>

    <template v-else-if="inbox">

      <!-- Header -->
      <div class="flex items-start justify-between mb-6 gap-4">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-2xl font-semibold text-highlighted">{{ inbox.display_name }}</h1>
            <UBadge :color="statusColor(inbox.status)" variant="subtle" class="capitalize">
              {{ statusLabel(inbox.status) }}
            </UBadge>
          </div>
          <p class="text-sm text-muted font-mono">{{ inbox.email }}</p>
          <p class="text-xs text-muted mt-0.5">Connected {{ fmtDate(inbox.created_at) }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton color="neutral" variant="subtle" icon="i-lucide-pencil" @click="openEdit">
            Edit settings
          </UButton>
          <UButton
            v-if="inbox.status === 'active' || inbox.status === 'warming_up'"
            color="neutral"
            variant="subtle"
            icon="i-lucide-pause"
            :loading="acting"
            @click="doAction(() => pauseInbox(inbox!.id), 'Inbox paused')"
          >
            Pause
          </UButton>
          <UButton
            v-if="inbox.status === 'paused' || inbox.status === 'suspended'"
            color="neutral"
            variant="subtle"
            icon="i-lucide-play"
            :loading="acting"
            @click="doAction(() => resumeInbox(inbox!.id), 'Inbox resumed')"
          >
            Resume
          </UButton>
          <UButton
            v-if="inbox.status !== 'retired'"
            color="neutral"
            variant="subtle"
            icon="i-lucide-rss"
            :loading="acting"
            @click="doAction(() => watchInbox(inbox!.id), 'Watch registered')"
          >
            Re-watch
          </UButton>
          <UButton
            v-if="inbox.status !== 'retired'"
            color="error"
            variant="subtle"
            icon="i-lucide-trash-2"
            :loading="acting"
            @click="doAction(() => retireInbox(inbox!.id), 'Inbox retired')"
          >
            Retire
          </UButton>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Total Sent</p>
          <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ inbox.total_sent.toLocaleString() }}</p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Deliverability</p>
          <p class="text-2xl font-semibold tabular-nums" :class="scoreColor(inbox.deliverability_score)">
            {{ inbox.deliverability_score != null ? Number(inbox.deliverability_score).toFixed(0) + '%' : '—' }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Bounce Rate (7d)</p>
          <p class="text-2xl font-semibold tabular-nums" :class="inbox.bounce_rate_7d != null && Number(inbox.bounce_rate_7d) > 5 ? 'text-error-600' : 'text-highlighted'">
            {{ inbox.bounce_rate_7d != null ? Number(inbox.bounce_rate_7d).toFixed(1) + '%' : '—' }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Reply Rate (7d)</p>
          <p class="text-2xl font-semibold tabular-nums text-highlighted">
            {{ inbox.reply_rate_7d != null ? Number(inbox.reply_rate_7d).toFixed(1) + '%' : '—' }}
          </p>
        </UCard>
      </div>

      <!-- Two-column: Send settings + Warmup -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        <!-- Send settings -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold text-highlighted">Send Settings</h2>
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit" />
            </div>
          </template>

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted">Daily limit</span>
              <span class="font-medium text-highlighted tabular-nums">{{ inbox.daily_send_limit }} emails/day</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">Today sent</span>
              <div class="flex items-center gap-2">
                <span class="font-medium text-highlighted tabular-nums">{{ inbox.current_day_sent }} / {{ inbox.daily_send_limit }}</span>
                <div class="w-20 h-1.5 bg-elevated rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full" :style="{ width: `${usagePct(inbox.current_day_sent, inbox.daily_send_limit)}%` }" />
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">Send window</span>
              <span class="font-medium text-highlighted">{{ fmtTime(inbox.send_window_start) }} – {{ fmtTime(inbox.send_window_end) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">Send days</span>
              <span class="font-medium text-highlighted">{{ fmtDays(inbox.send_days_of_week) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">Timezone</span>
              <span class="font-medium text-highlighted">{{ inbox.timezone }}</span>
            </div>
            <div v-if="inbox.notes" class="pt-2 border-t border-default">
              <p class="text-muted text-xs mb-0.5">Notes</p>
              <p class="text-default">{{ inbox.notes }}</p>
            </div>
          </div>
        </UCard>

        <!-- Warmup + OAuth -->
        <div class="space-y-4">
          <UCard>
            <template #header>
              <h2 class="text-sm font-semibold text-highlighted">Warmup Status</h2>
            </template>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted">Warmup day</span>
                <span class="font-medium text-highlighted tabular-nums">Day {{ inbox.warmup_day }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted">Started</span>
                <span class="font-medium text-highlighted">{{ fmtDate(inbox.warmup_started_at) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted">Completed</span>
                <span class="font-medium" :class="inbox.warmup_completed_at ? 'text-success-600' : 'text-muted'">
                  {{ inbox.warmup_completed_at ? fmtDate(inbox.warmup_completed_at) : 'In progress' }}
                </span>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="text-sm font-semibold text-highlighted">OAuth &amp; Watch</h2>
            </template>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted">Token expires</span>
                <span class="font-medium" :class="inbox.oauth_token_expires_at && new Date(inbox.oauth_token_expires_at) < new Date() ? 'text-error-600' : 'text-highlighted'">
                  {{ fmtDt(inbox.oauth_token_expires_at) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted">Watch expires</span>
                <span class="font-medium" :class="inbox.gmail_watch_expires_at && new Date(inbox.gmail_watch_expires_at) < new Date() ? 'text-error-600' : 'text-highlighted'">
                  {{ fmtDt(inbox.gmail_watch_expires_at) }}
                </span>
              </div>
              <div v-if="inbox.oauth_scopes?.length" class="pt-2 border-t border-default">
                <p class="text-muted text-xs mb-1">Scopes</p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="scope in inbox.oauth_scopes"
                    :key="scope"
                    class="inline-flex px-1.5 py-0.5 rounded bg-elevated text-muted text-xs font-mono truncate max-w-full"
                  >
                    {{ scope.split('/').pop() }}
                  </span>
                </div>
              </div>
            </div>
          </UCard>
        </div>

      </div>

      <!-- Sent emails quick link -->
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-highlighted mb-0.5">Sent Emails</h2>
            <p class="text-xs text-muted">{{ inbox.total_sent.toLocaleString() }} total · {{ inbox.total_bounced.toLocaleString() }} bounced · {{ inbox.total_replied.toLocaleString() }} replied</p>
          </div>
          <NuxtLink :to="`/sent-emails?email_account_id=${inbox.id}`">
            <UButton color="neutral" variant="subtle" icon="i-lucide-send-horizontal" trailing-icon="i-lucide-arrow-right" size="sm">
              View sent emails
            </UButton>
          </NuxtLink>
        </div>
      </UCard>

    </template>

    <!-- Edit settings modal -->
    <UModal v-model:open="editOpen">
      <template #content>
        <UCard class="max-w-lg w-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-highlighted">Edit inbox settings</h3>
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="editOpen = false" />
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Display name</label>
              <UInput v-model="editForm.display_name" placeholder="e.g. Outreach Account 1" />
            </div>

            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Daily send limit <span class="text-muted font-normal">(max 200)</span></label>
              <UInput v-model.number="editForm.daily_send_limit" type="number" min="1" max="200" />
            </div>

            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Timezone</label>
              <UInput v-model="editForm.timezone" placeholder="e.g. Asia/Dubai" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-highlighted mb-1.5">Send window start</label>
                <UInput v-model="editForm.send_window_start" type="time" />
              </div>
              <div>
                <label class="block text-sm font-medium text-highlighted mb-1.5">Send window end</label>
                <UInput v-model="editForm.send_window_end" type="time" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-highlighted mb-2">Send days</label>
              <div class="flex gap-1.5 flex-wrap">
                <button
                  v-for="(label, idx) in ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']"
                  :key="idx"
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
                  :class="editForm.send_days_of_week.includes(idx)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-default text-muted border-default hover:border-primary hover:text-highlighted'"
                  @click="toggleDay(idx)"
                >
                  {{ label }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Notes <span class="text-muted font-normal">(optional)</span></label>
              <UInput v-model="editForm.notes" placeholder="Internal notes about this inbox…" />
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="neutral" variant="subtle" @click="editOpen = false">Cancel</UButton>
              <UButton :loading="saving" @click="saveEdit">Save settings</UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

  </div>
</template>
