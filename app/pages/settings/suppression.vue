<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface SuppressionEntry {
  id: string
  email: string
  reason: 'unsubscribed' | 'bounced' | 'complained' | 'do_not_contact' | 'manual'
  source: 'contact' | 'campaign' | 'manual'
  campaign?: string
  addedAt: string
}

const MOCK: SuppressionEntry[] = [
  { id: 's1', email: 'fatima.alali@yahoo.com', reason: 'unsubscribed', source: 'contact', addedAt: '2025-05-20T10:00:00Z' },
  { id: 's2', email: 'hassan.ibrahim@gmail.com', reason: 'bounced', source: 'campaign', campaign: 'Marina Q2 Outreach', addedAt: '2025-06-05T14:00:00Z' },
  { id: 's3', email: 'tariq.almutairi@gmail.com', reason: 'do_not_contact', source: 'manual', addedAt: '2025-04-29T09:00:00Z' },
  { id: 's4', email: 'rashid.alfalasi@yahoo.com', reason: 'complained', source: 'campaign', campaign: 'Marina Q2 Outreach', addedAt: '2025-04-25T13:00:00Z' },
  { id: 's5', email: 'rima.saleh@gmail.com', reason: 'unsubscribed', source: 'contact', addedAt: '2025-06-04T13:55:00Z' },
  { id: 's6', email: 'amira.hassan@gmail.com', reason: 'bounced', source: 'campaign', campaign: 'JBR Investor Outreach', addedAt: '2025-06-09T08:30:00Z' },
  { id: 's7', email: 'blocked1@example.com', reason: 'manual', source: 'manual', addedAt: '2025-03-10T10:00:00Z' },
  { id: 's8', email: 'blocked2@competitor.com', reason: 'manual', source: 'manual', addedAt: '2025-03-10T10:05:00Z' },
  { id: 's9', email: 'blocked3@spam.com', reason: 'manual', source: 'manual', addedAt: '2025-03-10T10:10:00Z' },
]

// ── state ─────────────────────────────────────────────────────────────
const list = ref(MOCK)
const search = ref('')
const reasonFilter = ref('all')
const addOpen = ref(false)
const addEmail = ref('')
const addReason = ref<'do_not_contact' | 'bounced' | 'unsubscribed' | 'manual'>('manual')
const adding = ref(false)
const toast = useToast()

const REASON_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Unsubscribed', value: 'unsubscribed' },
  { label: 'Bounced', value: 'bounced' },
  { label: 'Complained', value: 'complained' },
  { label: 'Do not contact', value: 'do_not_contact' },
  { label: 'Manual', value: 'manual' },
]

const ADD_REASON_OPTIONS = [
  { label: 'Manual block', value: 'manual' },
  { label: 'Do not contact', value: 'do_not_contact' },
  { label: 'Bounced email', value: 'bounced' },
  { label: 'Unsubscribed', value: 'unsubscribed' },
]

const filtered = computed(() => {
  let l = list.value
  if (reasonFilter.value !== 'all') l = l.filter(e => e.reason === reasonFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    l = l.filter(e => e.email.toLowerCase().includes(q))
  }
  return l
})

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const REASON_COLOR: Record<string, BadgeColor> = {
  unsubscribed: 'neutral',
  bounced: 'error',
  complained: 'warning',
  do_not_contact: 'error',
  manual: 'neutral',
}
const REASON_LABEL: Record<string, string> = {
  unsubscribed: 'Unsubscribed',
  bounced: 'Bounced',
  complained: 'Complained',
  do_not_contact: 'Do not contact',
  manual: 'Manual',
}

function reasonColor(r: string): BadgeColor { return (REASON_COLOR[r] ?? 'neutral') as BadgeColor }
function reasonLabel(r: string): string { return REASON_LABEL[r] ?? r }

function relTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

function remove(id: string) {
  list.value = list.value.filter(e => e.id !== id)
}

async function addEntry() {
  if (!addEmail.value.trim()) return
  adding.value = true
  await new Promise(r => setTimeout(r, 500))
  list.value.unshift({
    id: `s${Date.now()}`,
    email: addEmail.value.toLowerCase().trim(),
    reason: addReason.value,
    source: 'manual',
    addedAt: new Date().toISOString(),
  })
  adding.value = false
  addOpen.value = false
  toast.add({ title: 'Address suppressed', description: `${addEmail.value} will not receive any emails.`, color: 'success', icon: 'i-lucide-shield-check' })
  addEmail.value = ''
}

const columns: TableColumn<SuppressionEntry>[] = [
  { accessorKey: 'email', header: 'Email address' },
  { accessorKey: 'reason', header: 'Reason' },
  { id: 'source', header: 'Source' },
  { id: 'addedAt', header: 'Added' },
  { id: 'actions', header: '' },
]
</script>

<template>
  <div class="max-w-screen-lg mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Suppression List</h1>
        <p class="mt-0.5 text-sm text-muted">{{ list.length }} suppressed addresses — these will never receive emails.</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-upload" color="neutral" variant="subtle">Import</UButton>
        <UButton icon="i-lucide-plus" @click="addOpen = true">Add address</UButton>
      </div>
    </div>

    <!-- Info banner -->
    <UAlert
      icon="i-lucide-shield-check"
      color="info"
      variant="subtle"
      title="Suppression is enforced globally"
      description="Any address on this list is automatically excluded from all campaigns, regardless of which contact list they're in."
      class="mb-5"
    />

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search by email…" class="max-w-xs" />
      <div class="flex gap-1 flex-wrap">
        <UButton
          v-for="opt in REASON_OPTIONS"
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

    <!-- Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable :data="filtered" :columns="columns">

        <template #email-cell="{ row }">
          <span class="text-sm font-mono text-default">{{ row.original.email }}</span>
        </template>

        <template #reason-cell="{ row }">
          <UBadge :color="reasonColor(row.original.reason)" variant="subtle" size="sm">
            {{ reasonLabel(row.original.reason) }}
          </UBadge>
        </template>

        <template #source-cell="{ row }">
          <div class="text-sm text-muted">
            <span class="capitalize">{{ row.original.source }}</span>
            <span v-if="row.original.campaign" class="text-xs block text-primary">{{ row.original.campaign }}</span>
          </div>
        </template>

        <template #addedAt-cell="{ row }">
          <span class="text-sm text-muted">{{ relTime(row.original.addedAt) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <UTooltip text="Remove from suppression list">
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="remove(row.original.id)"
            />
          </UTooltip>
        </template>

      </UTable>

      <div v-if="filtered.length === 0" class="py-14 text-center">
        <UIcon name="i-lucide-shield-x" class="w-10 h-10 text-muted mx-auto mb-3" />
        <p class="text-sm font-semibold text-highlighted mb-1">No suppressed addresses</p>
        <p class="text-xs text-muted">{{ search || reasonFilter !== 'all' ? 'Try adjusting your filters.' : 'Add addresses you never want to email.' }}</p>
      </div>
    </UCard>

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
              <USelect v-model="addReason" :items="ADD_REASON_OPTIONS" value-key="value" label-key="label" />
            </div>
            <UButton block :loading="adding" :disabled="!addEmail.trim()" @click="addEntry">
              Add to suppression list
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>

  </div>
</template>
