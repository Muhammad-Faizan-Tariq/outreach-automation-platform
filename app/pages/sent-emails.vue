<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SentEmailSummary, SentEmailDetail } from '~/composables/useSentEmails'

const route = useRoute()
const toast = useToast()
const { sentEmails, total, loading, fetchSentEmails, getSentEmail } = useSentEmails()

// ── filters + pagination ──────────────────────────────────────────────
const statusFilter = ref('all')
const stepFilter = ref<number | null>(null)
const inboxFilter = ref<string | null>(null)  // pre-seeded from ?email_account_id= query param
const campaignFilter = ref<string | null>(null)
const page = ref(1)
const pageSize = 50

async function load() {
  await fetchSentEmails({
    page: page.value,
    page_size: pageSize,
    status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
    step_number: stepFilter.value ?? undefined,
    email_account_id: inboxFilter.value ?? undefined,
    campaign_id: campaignFilter.value ?? undefined,
  })
}

onMounted(() => {
  // seed filters from query params without triggering watcher (page starts at 1)
  if (route.query.email_account_id) inboxFilter.value = String(route.query.email_account_id)
  if (route.query.campaign_id) campaignFilter.value = String(route.query.campaign_id)
  load()
})

watch(page, load)
watch([statusFilter, stepFilter, inboxFilter, campaignFilter], () => {
  page.value = 1
  load()
})

// ── detail modal ──────────────────────────────────────────────────────
const previewOpen = ref(false)
const previewDetail = ref<SentEmailDetail | null>(null)
const previewLoading = ref(false)

async function openDetail(row: SentEmailSummary) {
  previewOpen.value = true
  previewDetail.value = null
  previewLoading.value = true
  try {
    previewDetail.value = await getSentEmail(row.id)
  }
  catch (e: any) {
    toast.add({ title: 'Failed to load detail', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
    previewOpen.value = false
  }
  finally {
    previewLoading.value = false
  }
}

// ── table ─────────────────────────────────────────────────────────────
const columns: TableColumn<SentEmailSummary>[] = [
  { id: 'recipient', header: 'Recipient' },
  { accessorKey: 'subject', header: 'Subject' },
  { accessorKey: 'step_number', header: 'Step' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'sentAt', header: 'Sent' },
]

// ── helpers ───────────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const STATUS_COLOR: Record<string, BadgeColor> = {
  pending: 'neutral',
  sent: 'neutral',
  delivered: 'info',
  opened: 'info',
  replied: 'success',
  bounced: 'error',
  failed: 'error',
}
const STATUS_ICON: Record<string, string> = {
  pending: 'i-lucide-clock',
  sent: 'i-lucide-send',
  delivered: 'i-lucide-send-horizontal',
  opened: 'i-lucide-mail-open',
  replied: 'i-lucide-reply',
  bounced: 'i-lucide-ban',
  failed: 'i-lucide-x-circle',
}

function statusColor(s: string): BadgeColor { return (STATUS_COLOR[s] ?? 'neutral') as BadgeColor }
function statusIcon(s: string): string { return STATUS_ICON[s] ?? 'i-lucide-mail' }

function relTime(ts: string | null): string {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

function fmtFull(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function shortId(id: string): string {
  return id.slice(0, 8) + '…'
}

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Replied', value: 'replied' },
  { label: 'Opened', value: 'opened' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Sent', value: 'sent' },
  { label: 'Bounced', value: 'bounced' },
  { label: 'Failed', value: 'failed' },
  { label: 'Pending', value: 'pending' },
]

const STEP_OPTIONS = [
  { label: 'All steps', value: null },
  { label: 'Step 1', value: 1 },
  { label: 'Step 2', value: 2 },
  { label: 'Step 3', value: 3 },
]
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Sent Emails</h1>
        <p class="mt-0.5 text-sm text-muted">{{ total.toLocaleString() }} emails total</p>
      </div>
    </div>

    <!-- Active inbox / campaign filter banner -->
    <div v-if="inboxFilter || campaignFilter" class="flex items-center gap-3 mb-4 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg text-sm">
      <UIcon name="i-lucide-filter" class="w-4 h-4 text-primary shrink-0" />
      <span class="text-muted flex-1">
        Filtered by
        <span v-if="inboxFilter" class="font-mono text-highlighted">inbox {{ inboxFilter.slice(0, 8) }}…</span>
        <span v-if="campaignFilter" class="font-mono text-highlighted">campaign {{ campaignFilter.slice(0, 8) }}…</span>
      </span>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        @click="inboxFilter = null; campaignFilter = null; page = 1"
      >
        Clear filter
      </UButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
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
      <USelect
        v-model="stepFilter"
        :items="STEP_OPTIONS"
        value-key="value"
        label-key="label"
        class="w-36"
      />
    </div>

    <AppPageLoader v-if="loading && !sentEmails.length" label="Loading sent emails…" />

    <!-- Table -->
    <UCard v-else :ui="{ body: 'p-0' }">
      <UTable
        :data="sentEmails"
        :columns="columns"
        :loading="loading"
        class="[&_tr]:cursor-pointer"
        @select="openDetail($event.original)"
      >

        <template #recipient-cell="{ row }">
          <div>
            <p class="text-xs font-mono text-muted">{{ shortId(row.original.contact_id) }}</p>
            <p class="text-xs text-muted">via {{ shortId(row.original.email_account_id) }}</p>
          </div>
        </template>

        <template #subject-cell="{ row }">
          <p class="text-sm text-default truncate max-w-sm">{{ row.original.subject }}</p>
        </template>

        <template #step_number-cell="{ row }">
          <span class="text-sm text-muted tabular-nums">{{ row.original.step_number }}</span>
        </template>

        <template #status-cell="{ row }">
          <div class="flex items-center gap-1.5">
            <UIcon :name="statusIcon(row.original.status)" class="w-3.5 h-3.5 shrink-0 text-muted" />
            <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">
              {{ row.original.status }}
            </UBadge>
          </div>
        </template>

        <template #sentAt-cell="{ row }">
          <span class="text-sm text-muted">{{ relTime(row.original.sent_at ?? row.original.scheduled_at) }}</span>
        </template>

      </UTable>

      <div v-if="!loading && sentEmails.length === 0" class="py-16 text-center">
        <UIcon name="i-lucide-send-horizontal" class="w-10 h-10 text-muted mx-auto mb-3" />
        <p class="text-sm font-semibold text-highlighted">No emails found</p>
        <p class="text-xs text-muted mt-1">Try adjusting your filters.</p>
      </div>
    </UCard>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex justify-center mt-5">
      <UPagination v-model:page="page" :total="total" :page-size="pageSize" />
    </div>

    <!-- Detail modal -->
    <UModal v-model:open="previewOpen" :ui="{ content: 'max-w-2xl w-full' }">
      <template #content>
        <UCard class="w-full">
          <template #header>
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <h3 class="text-base font-semibold text-highlighted truncate">
                  {{ previewDetail?.subject ?? '…' }}
                </h3>
                <p v-if="previewDetail" class="text-xs text-muted mt-0.5 font-mono">
                  {{ previewDetail.campaign_id }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <UBadge v-if="previewDetail" :color="statusColor(previewDetail.status)" variant="subtle" size="sm" class="capitalize">
                  {{ previewDetail.status }}
                </UBadge>
                <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="previewOpen = false" />
              </div>
            </div>
          </template>

          <!-- Loading skeleton -->
          <div v-if="previewLoading" class="space-y-3 py-4">
            <div v-for="n in 4" :key="n" class="h-8 bg-elevated rounded animate-pulse" />
          </div>

          <template v-else-if="previewDetail">
            <!-- Timeline -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 pb-5 border-b border-default text-sm">
              <div>
                <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Scheduled</p>
                <p class="text-default">{{ fmtFull(previewDetail.scheduled_at) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Sent</p>
                <p :class="previewDetail.sent_at ? 'text-default' : 'text-muted'">{{ fmtFull(previewDetail.sent_at) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted uppercase tracking-wide mb-0.5">First opened</p>
                <p :class="previewDetail.first_opened_at ? 'text-info-600 font-medium' : 'text-muted'">{{ fmtFull(previewDetail.first_opened_at) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Open count</p>
                <p :class="previewDetail.open_count > 0 ? 'text-info-600 font-semibold' : 'text-muted'">{{ previewDetail.open_count || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Delivered</p>
                <p :class="previewDetail.delivered_at ? 'text-default' : 'text-muted'">{{ fmtFull(previewDetail.delivered_at) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Bounced</p>
                <p :class="previewDetail.bounced_at ? 'text-error-600 font-medium' : 'text-muted'">{{ fmtFull(previewDetail.bounced_at) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Step</p>
                <p class="text-default">{{ previewDetail.step_number }}</p>
              </div>
              <div>
                <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Retries</p>
                <p class="text-default">{{ previewDetail.retry_count }}</p>
              </div>
            </div>

            <!-- Error info -->
            <div v-if="previewDetail.error_code || previewDetail.error_message" class="mb-4 px-4 py-3 bg-error-50 dark:bg-error-900/20 rounded-lg text-sm">
              <p class="text-error-700 dark:text-error-400 font-medium mb-0.5">Error: {{ previewDetail.error_code ?? 'Unknown' }}</p>
              <p v-if="previewDetail.error_message" class="text-error-600 dark:text-error-400 text-xs">{{ previewDetail.error_message }}</p>
            </div>

            <!-- Email body -->
            <div v-if="previewDetail.body_html" class="bg-elevated rounded-xl px-5 py-4">
              <p class="text-xs text-muted uppercase tracking-wide mb-3 pb-2 border-b border-default font-medium">Email body</p>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="text-sm text-default prose prose-sm max-w-none" v-html="previewDetail.body_html" />
            </div>
            <div v-else-if="previewDetail.body_text" class="bg-elevated rounded-xl px-5 py-4">
              <p class="text-xs text-muted uppercase tracking-wide mb-3 pb-2 border-b border-default font-medium">Email body (plain text)</p>
              <pre class="text-sm text-default whitespace-pre-wrap font-sans leading-relaxed">{{ previewDetail.body_text }}</pre>
            </div>

            <!-- IDs -->
            <div class="mt-4 pt-3 border-t border-default text-xs text-muted space-y-0.5">
              <p>Contact: <span class="font-mono">{{ previewDetail.contact_id }}</span></p>
              <p>Inbox: <span class="font-mono">{{ previewDetail.email_account_id }}</span></p>
              <p v-if="previewDetail.gmail_message_id">Gmail message: <span class="font-mono">{{ previewDetail.gmail_message_id }}</span></p>
              <p v-if="previewDetail.gmail_thread_id">Gmail thread: <span class="font-mono">{{ previewDetail.gmail_thread_id }}</span></p>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

  </div>
</template>
