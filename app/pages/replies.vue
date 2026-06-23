<script setup lang="ts">
import type { ReplyListItem, ReplyDetail } from '~/composables/useReplies'
import type { UserSummary } from '~/composables/useUsers'

const { replies, total, loading, fetchReplies, getReply, updateReply } = useReplies()
const { users, fetchUsers } = useUsers()
const { public: cfg } = useRuntimeConfig()

// ── filter state ───────────────────────────────────────────────────────────
const search = ref('')
const classFilter = ref('')
const handledFilter = ref<'all' | 'unhandled' | 'handled'>('all')
let searchTimer: ReturnType<typeof setTimeout> | null = null

// ── selected reply ─────────────────────────────────────────────────────────
const selectedId = ref<string | null>(null)
const selectedDetail = ref<ReplyDetail | null>(null)
const detailLoading = ref(false)
const threadRef = ref<HTMLElement | null>(null)

// ── right-panel state ──────────────────────────────────────────────────────
const notesText = ref('')
const savingNotes = ref(false)
const reclassifyOpen = ref(false)
const reclassifyValue = ref('')
const savingClassify = ref(false)
const savingHandled = ref(false)

const CLASSIFICATIONS = [
  { value: 'interested', label: 'Interested', color: 'success' as const },
  { value: 'question', label: 'Question', color: 'info' as const },
  { value: 'not_interested', label: 'Not Interested', color: 'neutral' as const },
  { value: 'auto_reply', label: 'Auto Reply', color: 'warning' as const },
  { value: 'referral', label: 'Referral', color: 'primary' as const },
  { value: 'unsubscribe', label: 'Unsubscribe', color: 'error' as const },
  { value: 'bounce', label: 'Bounce', color: 'error' as const },
  { value: 'spam_complaint', label: 'Spam Complaint', color: 'error' as const },
  { value: 'unclassified', label: 'Unclassified', color: 'neutral' as const },
]

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

function classLabel(v: string): string {
  return CLASSIFICATIONS.find(c => c.value === v)?.label ?? v
}
function classColor(v: string): BadgeColor {
  return (CLASSIFICATIONS.find(c => c.value === v)?.color ?? 'neutral') as BadgeColor
}

// ── load helpers ───────────────────────────────────────────────────────────
async function load() {
  const params: Parameters<typeof fetchReplies>[0] = { page_size: 80 }
  if (classFilter.value) params.classification = classFilter.value
  if (handledFilter.value === 'handled') params.is_handled = true
  if (handledFilter.value === 'unhandled') params.is_handled = false
  if (search.value.trim()) params.search = search.value.trim()
  await fetchReplies(params)
  if (!selectedId.value && replies.value.length) {
    await select(replies.value[0]!)
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(), cfg.searchDebounce)
})
onUnmounted(() => { if (searchTimer) clearTimeout(searchTimer) })

watch([classFilter, handledFilter], () => {
  selectedId.value = null
  selectedDetail.value = null
  load()
})

onMounted(async () => {
  await Promise.all([load(), fetchUsers({ page_size: 100 })])
})

async function select(reply: ReplyListItem) {
  if (selectedId.value === reply.id) return
  selectedId.value = reply.id
  selectedDetail.value = null
  detailLoading.value = true
  try {
    selectedDetail.value = await getReply(reply.id)
    notesText.value = selectedDetail.value.agent_notes ?? ''
    await nextTick()
    if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
  }
  catch { /* keep panel open */ }
  finally { detailLoading.value = false }
}

// ── actions ────────────────────────────────────────────────────────────────
function openReclassify() {
  reclassifyValue.value = selectedDetail.value?.classification ?? ''
  reclassifyOpen.value = true
}

async function applyReclassify() {
  if (!selectedId.value || !reclassifyValue.value) return
  savingClassify.value = true
  try {
    const updated = await updateReply(selectedId.value, { classification: reclassifyValue.value })
    selectedDetail.value = updated
    const idx = replies.value.findIndex(r => r.id === selectedId.value)
    if (idx >= 0) replies.value[idx]!.classification = reclassifyValue.value
    reclassifyOpen.value = false
  }
  catch { /* keep open */ }
  finally { savingClassify.value = false }
}

async function toggleHandled() {
  if (!selectedId.value || !selectedDetail.value) return
  savingHandled.value = true
  const newValue = !selectedDetail.value.handled_at
  try {
    const updated = await updateReply(selectedId.value, { is_handled: newValue })
    selectedDetail.value = updated
    const idx = replies.value.findIndex(r => r.id === selectedId.value)
    if (idx >= 0) replies.value[idx]!.handled_at = updated.handled_at
  }
  catch { /* noop */ }
  finally { savingHandled.value = false }
}

async function saveNotes() {
  if (!selectedId.value) return
  savingNotes.value = true
  try {
    const updated = await updateReply(selectedId.value, { agent_notes: notesText.value })
    if (selectedDetail.value) selectedDetail.value.agent_notes = updated.agent_notes
  }
  catch { /* noop */ }
  finally { savingNotes.value = false }
}

async function assignAgent(agentId: string | null) {
  if (!selectedId.value) return
  try {
    const updated = await updateReply(selectedId.value, { assigned_agent_id: agentId })
    selectedDetail.value = updated
    const idx = replies.value.findIndex(r => r.id === selectedId.value)
    if (idx >= 0) {
      replies.value[idx]!.assigned_agent_id = updated.assigned_agent_id
      replies.value[idx]!.assigned_agent_name = updated.assigned_agent_name
    }
  }
  catch { /* noop */ }
}

// ── formatting ─────────────────────────────────────────────────────────────
function fmt(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtFull(ts: string | null) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

const unhandledCount = computed(() => replies.value.filter(r => !r.handled_at).length)
</script>

<template>
  <div class="flex h-full overflow-hidden border-t border-default">

    <!-- ── LEFT: reply list ─────────────────────────────────────────────── -->
    <div class="w-72 border-r border-default flex flex-col shrink-0 bg-default">

      <!-- List header -->
      <div class="px-3 pt-3 pb-2 border-b border-default space-y-2 shrink-0">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-sm font-semibold text-highlighted flex items-center gap-2">
            Replies
            <UBadge v-if="unhandledCount > 0" color="primary" variant="solid" size="xs">{{ unhandledCount }}</UBadge>
          </h2>
          <span class="text-xs text-muted">{{ total }} total</span>
        </div>
        <UInput v-model="search" icon="i-lucide-search" placeholder="Search replies…" size="sm" />

        <!-- Handled filter -->
        <div class="flex gap-1">
          <UButton
            v-for="opt in [{ label: 'All', value: 'all' }, { label: 'Unhandled', value: 'unhandled' }, { label: 'Handled', value: 'handled' }]"
            :key="opt.value"
            size="xs"
            :color="handledFilter === opt.value ? 'primary' : 'neutral'"
            :variant="handledFilter === opt.value ? 'solid' : 'ghost'"
            @click="handledFilter = opt.value as 'all' | 'unhandled' | 'handled'"
          >
            {{ opt.label }}
          </UButton>
        </div>

        <!-- Classification filter -->
        <div class="flex flex-wrap gap-1">
          <button
            class="text-xs px-2 py-0.5 rounded-full border transition-colors"
            :class="classFilter === '' ? 'bg-primary text-white border-primary' : 'border-default text-muted hover:text-highlighted hover:border-highlighted'"
            @click="classFilter = ''"
          >
            All
          </button>
          <button
            v-for="c in CLASSIFICATIONS.slice(0, 5)"
            :key="c.value"
            class="text-xs px-2 py-0.5 rounded-full border transition-colors"
            :class="classFilter === c.value ? 'bg-primary text-white border-primary' : 'border-default text-muted hover:text-highlighted hover:border-highlighted'"
            @click="classFilter = c.value"
          >
            {{ c.label }}
          </button>
        </div>
      </div>

      <!-- Reply list -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading && !replies.length" class="flex items-center justify-center py-10">
          <div class="relative">
            <div class="w-8 h-8 rounded-full border-2 border-primary/20" />
            <div class="absolute inset-0 w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
        <div v-else-if="replies.length === 0" class="px-4 py-10 text-center">
          <UIcon name="i-lucide-inbox" class="w-8 h-8 text-muted mx-auto mb-2" />
          <p class="text-sm text-muted">No replies found</p>
        </div>

        <button
          v-for="reply in replies"
          :key="reply.id"
          class="w-full text-left px-3 py-3 border-b border-default transition-colors"
          :class="selectedId === reply.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-elevated'"
          @click="select(reply)"
        >
          <div class="flex items-start gap-2">
            <div
              class="mt-1.5 w-2 h-2 rounded-full shrink-0"
              :class="!reply.handled_at ? 'bg-primary' : 'bg-transparent'"
            />
            <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
              {{ initials(reply.contact_name ?? reply.from_name ?? reply.from_email) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-0.5">
                <p
                  class="text-sm truncate"
                  :class="!reply.handled_at ? 'font-semibold text-highlighted' : 'font-medium text-default'"
                >
                  {{ reply.contact_name ?? reply.from_name ?? reply.from_email }}
                </p>
                <span class="text-xs text-muted shrink-0">{{ fmt(reply.received_at) }}</span>
              </div>
              <p class="text-xs text-muted truncate leading-relaxed">
                {{ reply.snippet ?? reply.subject ?? '(no preview)' }}
              </p>
              <div class="flex items-center gap-1.5 mt-1">
                <UBadge :color="classColor(reply.classification)" variant="subtle" size="xs">
                  {{ classLabel(reply.classification) }}
                </UBadge>
                <UBadge v-if="reply.handled_at" color="neutral" variant="subtle" size="xs">Handled</UBadge>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- ── MIDDLE: thread view ──────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden bg-default min-w-0">

      <!-- Empty state -->
      <div v-if="!selectedId" class="flex-1 flex flex-col items-center justify-center text-center gap-3">
        <div class="w-16 h-16 rounded-full bg-elevated flex items-center justify-center">
          <UIcon name="i-lucide-inbox" class="w-8 h-8 text-muted" />
        </div>
        <div>
          <p class="text-base font-semibold text-highlighted">No reply selected</p>
          <p class="text-sm text-muted mt-0.5">Choose a reply from the list to view it.</p>
        </div>
      </div>

      <template v-else>
        <!-- Thread header -->
        <div class="px-6 py-4 border-b border-default shrink-0 bg-default">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 class="text-base font-semibold text-highlighted truncate">
                  {{ selectedDetail?.subject ?? replies.find(r => r.id === selectedId)?.subject ?? '(no subject)' }}
                </h3>
                <UBadge v-if="selectedDetail" :color="classColor(selectedDetail.classification)" variant="subtle" size="sm">
                  {{ classLabel(selectedDetail.classification) }}
                </UBadge>
                <UBadge v-if="selectedDetail?.handled_at" color="success" variant="subtle" size="sm">Handled</UBadge>
              </div>
              <p class="text-xs text-muted">
                {{ selectedDetail?.from_email ?? '…' }}<span v-if="selectedDetail?.campaign_name"> · {{ selectedDetail.campaign_name }}</span>
              </p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-tag" @click="openReclassify">
                Classify
              </UButton>
              <UButton
                :icon="selectedDetail?.handled_at ? 'i-lucide-rotate-ccw' : 'i-lucide-check-circle'"
                size="xs"
                :color="selectedDetail?.handled_at ? 'neutral' : 'success'"
                variant="subtle"
                :loading="savingHandled"
                @click="toggleHandled"
              >
                {{ selectedDetail?.handled_at ? 'Reopen' : 'Mark handled' }}
              </UButton>
            </div>
          </div>
        </div>

        <!-- Messages area -->
        <div ref="threadRef" class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <AppPageLoader v-if="detailLoading" label="Loading thread…" />

          <template v-else-if="selectedDetail">
            <!-- Original outbound email (thread context) -->
            <div v-if="selectedDetail.original_email" class="flex gap-3 flex-row-reverse">
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold bg-primary text-white">
                Us
              </div>
              <div class="max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm bg-primary text-white rounded-tr-sm">
                <p class="text-xs font-medium opacity-70 mb-2">{{ selectedDetail.original_email.subject }}</p>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div
                  v-if="selectedDetail.original_email.body_html"
                  class="text-xs leading-relaxed opacity-90"
                  v-html="selectedDetail.original_email.body_html"
                />
                <div v-else class="text-xs whitespace-pre-wrap leading-relaxed opacity-90">
                  {{ selectedDetail.original_email.body_text ?? '' }}
                </div>
                <div class="text-xs mt-2 text-right text-white/60">
                  {{ fmtFull(selectedDetail.original_email.sent_at) }}
                </div>
              </div>
            </div>

            <!-- The inbound reply -->
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold bg-elevated text-highlighted">
                {{ initials(selectedDetail.contact_name ?? selectedDetail.from_name ?? selectedDetail.from_email) }}
              </div>
              <div class="max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm bg-elevated text-default rounded-tl-sm border border-default">
                <p class="text-xs font-medium text-muted mb-2">{{ selectedDetail.from_email }}</p>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div
                  v-if="selectedDetail.body_html"
                  class="leading-relaxed prose prose-sm max-w-none"
                  v-html="selectedDetail.body_html"
                />
                <div v-else class="whitespace-pre-wrap leading-relaxed">
                  {{ selectedDetail.body_text ?? '(no body)' }}
                </div>
                <div class="text-xs mt-2 text-right text-muted">
                  {{ fmtFull(selectedDetail.received_at) }}
                </div>
              </div>
            </div>

            <!-- AI classification note -->
            <div v-if="selectedDetail.classification_reason" class="flex justify-center">
              <span class="text-xs text-muted bg-elevated px-3 py-1 rounded-full border border-default">
                AI note: {{ selectedDetail.classification_reason }}
              </span>
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- ── RIGHT: contact panel ─────────────────────────────────────────── -->
    <div class="hidden lg:flex w-64 border-l border-default flex-col overflow-y-auto bg-default shrink-0">

      <div v-if="!selectedDetail" class="flex-1" />

      <template v-else>
        <!-- Contact card -->
        <div class="px-4 py-5 border-b border-default">
          <div class="flex flex-col items-center text-center mb-3">
            <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-base font-bold mb-2">
              {{ initials(selectedDetail.contact_name ?? selectedDetail.from_name ?? selectedDetail.from_email) }}
            </div>
            <p class="text-sm font-semibold text-highlighted">
              {{ selectedDetail.contact_name ?? selectedDetail.from_name ?? selectedDetail.from_email }}
            </p>
            <p class="text-xs text-muted mt-0.5 truncate w-full">{{ selectedDetail.from_email }}</p>
          </div>
        </div>

        <!-- Classification -->
        <div class="px-4 py-4 border-b border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">Classification</p>
          <UBadge :color="classColor(selectedDetail.classification)" variant="subtle" size="sm">
            {{ classLabel(selectedDetail.classification) }}
          </UBadge>
          <p v-if="selectedDetail.classification_confidence !== null" class="text-xs text-muted mt-1">
            Confidence: {{ ((selectedDetail.classification_confidence ?? 0) * 100).toFixed(0) }}%
          </p>
        </div>

        <!-- Assign agent -->
        <div class="px-4 py-4 border-b border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">Assigned To</p>
          <UDropdownMenu
            :items="[[
              { label: 'Unassigned', icon: 'i-lucide-user-x', onSelect: () => assignAgent(null) },
              ...users.filter((u: UserSummary) => u.is_active).map((u: UserSummary) => ({
                label: u.full_name,
                icon: 'i-lucide-user',
                onSelect: () => assignAgent(u.id),
              })),
            ]]"
          >
            <button class="w-full flex items-center gap-2 text-sm text-default hover:text-highlighted transition-colors">
              <UIcon name="i-lucide-user-round" class="w-3.5 h-3.5 text-muted shrink-0" />
              <span class="flex-1 text-left truncate">{{ selectedDetail.assigned_agent_name ?? 'Unassigned' }}</span>
              <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-muted shrink-0" />
            </button>
          </UDropdownMenu>
        </div>

        <!-- Campaign -->
        <div v-if="selectedDetail.campaign_name" class="px-4 py-4 border-b border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">Campaign</p>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-send" class="w-3.5 h-3.5 text-primary shrink-0" />
            <p class="text-sm text-default font-medium truncate">{{ selectedDetail.campaign_name }}</p>
          </div>
        </div>

        <!-- Thread info -->
        <div class="px-4 py-4 border-b border-default space-y-2 text-sm">
          <p class="text-xs font-medium text-muted uppercase tracking-wide">Info</p>
          <div class="flex justify-between">
            <span class="text-muted">Received</span>
            <span class="font-medium text-default">{{ fmt(selectedDetail.received_at) }}</span>
          </div>
          <div v-if="selectedDetail.handled_at" class="flex justify-between">
            <span class="text-muted">Handled</span>
            <span class="font-medium text-success-600">{{ fmt(selectedDetail.handled_at) }}</span>
          </div>
        </div>

        <!-- Agent notes -->
        <div class="px-4 py-4 border-b border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">Agent Notes</p>
          <UTextarea v-model="notesText" placeholder="Add internal notes…" :rows="3" class="w-full text-xs" />
          <UButton
            size="xs" color="neutral" variant="subtle" class="mt-2 w-full"
            :loading="savingNotes"
            @click="saveNotes"
          >
            Save notes
          </UButton>
        </div>

        <!-- Actions -->
        <div class="px-4 py-4 space-y-2">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-3">Actions</p>
          <UButton block size="xs" color="neutral" variant="subtle" icon="i-lucide-tag" @click="openReclassify">
            Re-classify
          </UButton>
          <UButton
            block size="xs"
            :color="selectedDetail.handled_at ? 'neutral' : 'success'"
            variant="subtle"
            :icon="selectedDetail.handled_at ? 'i-lucide-rotate-ccw' : 'i-lucide-check-circle'"
            :loading="savingHandled"
            @click="toggleHandled"
          >
            {{ selectedDetail.handled_at ? 'Reopen' : 'Mark handled' }}
          </UButton>
          <UButton
            v-if="selectedDetail.contact_id"
            block size="xs" color="neutral" variant="subtle" icon="i-lucide-user"
            :to="'/contacts/' + selectedDetail.contact_id"
          >
            View contact
          </UButton>
        </div>
      </template>
    </div>

    <!-- Re-classify modal -->
    <UModal v-model:open="reclassifyOpen">
      <template #content>
        <UCard class="max-w-sm w-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-highlighted">Classify reply</h3>
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="reclassifyOpen = false" />
            </div>
          </template>
          <div class="space-y-2">
            <button
              v-for="c in CLASSIFICATIONS"
              :key="c.value"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-sm"
              :class="reclassifyValue === c.value
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-default hover:bg-elevated text-default'"
              @click="reclassifyValue = c.value"
            >
              <UBadge :color="c.color" variant="subtle" size="xs" class="shrink-0 w-28 justify-center">
                {{ c.label }}
              </UBadge>
            </button>
          </div>
          <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-default">
            <UButton color="neutral" variant="ghost" size="sm" @click="reclassifyOpen = false">Cancel</UButton>
            <UButton size="sm" :loading="savingClassify" :disabled="!reclassifyValue" @click="applyReclassify">
              Apply
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>

  </div>
</template>
