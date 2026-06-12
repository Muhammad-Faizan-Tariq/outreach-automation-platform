<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface SuppressionEntry {
  id: string
  email: string
  reason: string
  source: string
  notes: string | null
  added_by: string | null
  created_at: string
}

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const { authHeaders } = useAuth()
const toast = useToast()

const list = ref<SuppressionEntry[]>([])
const total = ref(0)
const pageLoading = ref(true)
const page = ref(1)
const pageSize = 100
const search = ref('')
const reasonFilter = ref('all')
const reasons = ref<string[]>([])

async function load() {
  pageLoading.value = true
  try {
    const query = new URLSearchParams()
    query.set('page', String(page.value))
    query.set('page_size', String(pageSize))
    if (search.value.trim()) query.set('search', search.value.trim())
    if (reasonFilter.value !== 'all') query.set('reason', reasonFilter.value)
    const res = await $fetch<{ items: SuppressionEntry[]; total: number; page: number; page_size: number }>(
      `${apiBase}/suppression?${query.toString()}`,
      { headers: authHeaders.value },
    )
    list.value = res.items
    total.value = res.total
  }
  catch (e: any) {
    toast.add({ title: 'Failed to load', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    pageLoading.value = false
  }
}

async function loadReasons() {
  try {
    reasons.value = await $fetch<string[]>(`${apiBase}/suppression/reasons`, { headers: authHeaders.value })
  }
  catch { reasons.value = ['unsubscribed', 'bounced', 'complained', 'manual', 'do_not_contact'] }
}

onMounted(() => { load(); loadReasons() })
watch([page, reasonFilter], load)
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})

const reasonFilterOptions = computed(() => [
  { label: 'All', value: 'all' },
  ...reasons.value.map(r => ({ label: reasonLabel(r), value: r })),
])

// ── add single modal ──────────────────────────────────────────────────
const addOpen = ref(false)
const addEmail = ref('')
const addReason = ref('manual')
const addNotes = ref('')
const adding = ref(false)

// ── bulk import modal ─────────────────────────────────────────────────
const bulkOpen = ref(false)
const bulkEmails = ref('')
const bulkReason = ref('manual')
const bulkNotes = ref('')
const bulking = ref(false)

interface BulkResponse { added: number; already_suppressed: number; invalid: number }

async function bulkImport() {
  const emails = bulkEmails.value
    .split(/[\n,;]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@'))
  if (emails.length === 0) return
  bulking.value = true
  try {
    const res = await $fetch<BulkResponse>(`${apiBase}/suppression/bulk`, {
      method: 'POST',
      headers: authHeaders.value,
      body: { emails, reason: bulkReason.value, notes: bulkNotes.value || null },
    })
    bulkOpen.value = false
    bulkEmails.value = ''
    bulkNotes.value = ''
    toast.add({
      title: 'Bulk import done',
      description: `${res.added} added · ${res.already_suppressed} already suppressed · ${res.invalid} invalid`,
      color: 'success',
      icon: 'i-lucide-shield-check',
    })
    await load()
  }
  catch (e: any) {
    toast.add({ title: 'Bulk import failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    bulking.value = false
  }
}

const addReasonOptions = computed(() =>
  reasons.value.map(r => ({ label: reasonLabel(r), value: r })),
)

async function addEntry() {
  if (!addEmail.value.trim()) return
  adding.value = true
  try {
    const entry = await $fetch<SuppressionEntry>(`${apiBase}/suppression`, {
      method: 'POST',
      headers: authHeaders.value,
      body: { email: addEmail.value.toLowerCase().trim(), reason: addReason.value, notes: addNotes.value || null },
    })
    list.value.unshift(entry)
    total.value++
    addOpen.value = false
    addEmail.value = ''
    addNotes.value = ''
    toast.add({ title: 'Address suppressed', description: `${entry.email} will not receive any emails.`, color: 'success', icon: 'i-lucide-shield-check' })
  }
  catch (e: any) {
    const msg = e?.data?.detail ?? 'Error'
    toast.add({ title: 'Add failed', description: typeof msg === 'string' ? msg : 'Already suppressed or invalid email', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    adding.value = false
  }
}

async function remove(entry: SuppressionEntry) {
  try {
    await $fetch(`${apiBase}/suppression/${entry.id}`, { method: 'DELETE', headers: authHeaders.value })
    list.value = list.value.filter(e => e.id !== entry.id)
    total.value--
    toast.add({ title: 'Removed', description: `${entry.email} removed from suppression list.`, color: 'neutral', icon: 'i-lucide-trash-2' })
  }
  catch (e: any) {
    toast.add({ title: 'Remove failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
}

// ── helpers ────────────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const REASON_COLOR: Record<string, BadgeColor> = {
  unsubscribed: 'neutral',
  bounced: 'error',
  complained: 'warning',
  do_not_contact: 'error',
  manual: 'neutral',
}

function reasonColor(r: string): BadgeColor { return (REASON_COLOR[r] ?? 'neutral') as BadgeColor }
function reasonLabel(r: string): string {
  const map: Record<string, string> = {
    unsubscribed: 'Unsubscribed',
    bounced: 'Bounced',
    complained: 'Complained',
    do_not_contact: 'Do not contact',
    manual: 'Manual',
  }
  return map[r] ?? r.replace('_', ' ')
}

function relTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

const columns: TableColumn<SuppressionEntry>[] = [
  { accessorKey: 'email', header: 'Email address' },
  { accessorKey: 'reason', header: 'Reason' },
  { accessorKey: 'source', header: 'Source' },
  { id: 'addedAt', header: 'Added' },
  { id: 'actions', header: '' },
]
</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-8">

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Suppression List</h1>
        <p class="mt-0.5 text-sm text-muted">{{ total.toLocaleString() }} suppressed addresses — these will never receive emails.</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-list-plus" color="neutral" variant="subtle" @click="bulkOpen = true">Bulk import</UButton>
        <UButton icon="i-lucide-plus" @click="addOpen = true">Add address</UButton>
      </div>
    </div>

    <UAlert
      icon="i-lucide-shield-check"
      color="info"
      variant="subtle"
      title="Suppression is enforced globally"
      description="Any address on this list is automatically excluded from all campaigns, regardless of which contact list they're in."
      class="mb-5"
    />

    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search by email…" class="max-w-xs" />
      <div class="flex gap-1 flex-wrap">
        <UButton
          v-for="opt in reasonFilterOptions"
          :key="opt.value"
          size="sm"
          :color="reasonFilter === opt.value ? 'primary' : 'neutral'"
          :variant="reasonFilter === opt.value ? 'solid' : 'ghost'"
          @click="reasonFilter = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </div>
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <UTable :data="list" :columns="columns" :loading="pageLoading">

        <template #email-cell="{ row }">
          <span class="text-sm font-mono text-default">{{ row.original.email }}</span>
        </template>

        <template #reason-cell="{ row }">
          <UBadge :color="reasonColor(row.original.reason)" variant="subtle" size="sm">
            {{ reasonLabel(row.original.reason) }}
          </UBadge>
        </template>

        <template #source-cell="{ row }">
          <span class="text-sm text-muted capitalize">{{ row.original.source }}</span>
        </template>

        <template #addedAt-cell="{ row }">
          <span class="text-sm text-muted">{{ relTime(row.original.created_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <UTooltip text="Remove from suppression list">
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="remove(row.original)"
            />
          </UTooltip>
        </template>

      </UTable>

      <div v-if="!pageLoading && list.length === 0" class="py-14 text-center">
        <UIcon name="i-lucide-shield-x" class="w-10 h-10 text-muted mx-auto mb-3" />
        <p class="text-sm font-semibold text-highlighted mb-1">No suppressed addresses</p>
        <p class="text-xs text-muted">{{ search || reasonFilter !== 'all' ? 'Try adjusting your filters.' : 'Add addresses you never want to email.' }}</p>
      </div>
    </UCard>

    <div v-if="total > pageSize" class="flex justify-center mt-6">
      <UPagination v-model:page="page" :total="total" :page-size="pageSize" />
    </div>

    <!-- Add modal -->
    <UModal v-model:open="addOpen">
      <template #content>
        <UCard class="max-w-md w-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-highlighted">Suppress email address</h3>
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="addOpen = false" />
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Email address</label>
              <UInput v-model="addEmail" type="email" placeholder="contact@example.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Reason</label>
              <USelect v-model="addReason" :items="addReasonOptions" value-key="value" label-key="label" />
            </div>
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Notes <span class="text-muted font-normal">(optional)</span></label>
              <UInput v-model="addNotes" placeholder="Optional context…" />
            </div>
            <UButton block :loading="adding" :disabled="!addEmail.trim()" @click="addEntry">
              Add to suppression list
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Bulk import modal -->
    <UModal v-model:open="bulkOpen">
      <template #content>
        <UCard class="max-w-lg w-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-highlighted">Bulk suppress addresses</h3>
                <p class="text-xs text-muted mt-0.5">Paste up to 1,000 emails — one per line, or comma/semicolon separated.</p>
              </div>
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="bulkOpen = false" />
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Email addresses</label>
              <UTextarea
                v-model="bulkEmails"
                :rows="8"
                placeholder="alice@example.com&#10;bob@example.com&#10;carol@example.com"
                class="font-mono text-xs"
              />
              <p class="text-xs text-muted mt-1">
                {{ bulkEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes('@')).length }} valid email(s) detected
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Reason</label>
              <USelect v-model="bulkReason" :items="addReasonOptions" value-key="value" label-key="label" />
            </div>
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Notes <span class="text-muted font-normal">(optional)</span></label>
              <UInput v-model="bulkNotes" placeholder="e.g. Imported from previous platform unsubscribe export" />
            </div>
            <UButton
              block
              :loading="bulking"
              :disabled="!bulkEmails.trim()"
              @click="bulkImport"
            >
              Import {{ bulkEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes('@')).length || '' }} addresses
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>

  </div>
</template>
