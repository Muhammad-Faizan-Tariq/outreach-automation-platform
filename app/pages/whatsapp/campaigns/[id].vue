<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

const route = useRoute()
const toast = useToast()
const id = route.params.id as string

const { getCampaign, startCampaign, pauseCampaign, addContacts, getCampaignContacts } = useWaCampaigns()

const campaign = ref<any>(null)
const loading = ref(true)
const notFound = ref(false)

const contacts = ref<any[]>([])
const contactsTotal = ref(0)
const contactsLoading = ref(false)

onMounted(async () => {
  try {
    campaign.value = await getCampaign(id)
    await loadContacts()
  }
  catch (e: any) {
    if (e?.status === 404) notFound.value = true
  }
  finally {
    loading.value = false
  }
})

async function loadContacts() {
  contactsLoading.value = true
  try {
    const res = await getCampaignContacts(id, { pageSize: 100 })
    contacts.value = res.items
    contactsTotal.value = res.total
  }
  finally {
    contactsLoading.value = false }
}

// ── Status actions ────────────────────────────────────────────────────────────
const actioning = ref(false)
async function handleStart() {
  actioning.value = true
  try {
    campaign.value = await startCampaign(id)
    toast.add({ title: 'Campaign started', color: 'success', icon: 'i-lucide-play' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to start', description: e?.data?.detail ?? 'Error.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { actioning.value = false }
}

async function handlePause() {
  actioning.value = true
  try {
    campaign.value = await pauseCampaign(id)
    toast.add({ title: 'Campaign paused', color: 'warning', icon: 'i-lucide-pause' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to pause', description: e?.data?.detail ?? 'Error.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { actioning.value = false }
}

// ── Add contacts ─────────────────────────────────────────────────────────────
const showAddModal = ref(false)
const contactSearch = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const adding = ref(false)

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const { authHeaders } = useAuth()

let searchTimer: ReturnType<typeof setTimeout>
watch(contactSearch, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(searchContacts, 400)
})

async function searchContacts() {
  if (!contactSearch.value.trim()) { searchResults.value = []; return }
  searchLoading.value = true
  try {
    const q = new URLSearchParams({ search: contactSearch.value, page_size: '30' })
    const res = await $fetch<{ items: any[] }>(`${apiBase}/contacts?${q}`, { headers: authHeaders.value })
    searchResults.value = res.items
  }
  catch { searchResults.value = [] }
  finally { searchLoading.value = false }
}

function toggleSelect(contactId: string) {
  if (selectedIds.value.has(contactId)) selectedIds.value.delete(contactId)
  else selectedIds.value.add(contactId)
  selectedIds.value = new Set(selectedIds.value)
}

async function handleAddContacts() {
  if (selectedIds.value.size === 0) return
  adding.value = true
  try {
    const res = await addContacts(id, [...selectedIds.value])
    campaign.value.total_contacts += res.added
    toast.add({ title: `${res.added} contact(s) added`, color: 'success', icon: 'i-lucide-user-plus' })
    showAddModal.value = false
    selectedIds.value = new Set()
    contactSearch.value = ''
    searchResults.value = []
    await loadContacts()
  }
  catch (e: any) {
    toast.add({ title: 'Failed to add contacts', description: e?.data?.detail ?? 'Error.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { adding.value = false }
}

// ── Table ─────────────────────────────────────────────────────────────────────
const contactColumns: ColumnDef<any>[] = [
  { accessorKey: 'phone_number', header: 'Phone' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'sent_at', header: 'Sent' },
  { accessorKey: 'delivered_at', header: 'Delivered' },
  { accessorKey: 'read_at', header: 'Read' },
]

type StatusColor = 'success' | 'warning' | 'neutral' | 'error' | 'info'
function contactStatusColor(s: string): StatusColor {
  const map: Record<string, StatusColor> = { sent: 'info', delivered: 'success', read: 'primary' as any, failed: 'error', pending: 'neutral', skipped: 'warning' }
  return map[s] ?? 'neutral'
}

function campaignStatusColor(s: string): StatusColor {
  const map: Record<string, StatusColor> = { running: 'success', paused: 'warning', completed: 'info', failed: 'error', draft: 'neutral' }
  return map[s] ?? 'neutral'
}

function deliveryRate() {
  if (!campaign.value?.total_sent) return 0
  return Math.round(campaign.value.total_delivered / campaign.value.total_sent * 100)
}
function readRate() {
  if (!campaign.value?.total_sent) return 0
  return Math.round(campaign.value.total_read / campaign.value.total_sent * 100)
}
</script>

<template>
  <div class="px-6 py-8 max-w-6xl mx-auto">

    <NuxtLink to="/whatsapp/campaigns" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to campaigns
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-10 w-72 rounded-xl" />
      <div class="grid grid-cols-4 gap-4"><USkeleton v-for="i in 4" :key="i" class="h-20 rounded-xl" /></div>
      <USkeleton class="h-48 rounded-xl" />
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="text-center py-24">
      <UIcon name="i-lucide-megaphone-off" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-lg font-semibold text-highlighted mb-1">Campaign not found</p>
      <NuxtLink to="/whatsapp/campaigns" class="text-sm text-primary hover:underline">Back to campaigns</NuxtLink>
    </div>

    <template v-else-if="campaign">

      <!-- Header -->
      <div class="flex items-start justify-between mb-6 gap-4">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-2xl font-semibold text-highlighted">{{ campaign.name }}</h1>
            <UBadge :color="campaignStatusColor(campaign.status)" variant="subtle" class="capitalize">{{ campaign.status }}</UBadge>
          </div>
          <p v-if="campaign.description" class="text-sm text-muted">{{ campaign.description }}</p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            v-if="campaign.status === 'draft' || campaign.status === 'paused'"
            icon="i-lucide-play"
            color="success"
            :loading="actioning"
            @click="handleStart"
          >
            Start Campaign
          </UButton>
          <UButton
            v-if="campaign.status === 'running'"
            icon="i-lucide-pause"
            color="warning"
            variant="subtle"
            :loading="actioning"
            @click="handlePause"
          >
            Pause
          </UButton>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-default border border-default rounded-xl px-4 py-3">
          <p class="text-xs text-muted">Contacts</p>
          <p class="text-2xl font-bold text-highlighted mt-0.5">{{ campaign.total_contacts.toLocaleString() }}</p>
        </div>
        <div class="bg-default border border-default rounded-xl px-4 py-3">
          <p class="text-xs text-muted">Sent</p>
          <p class="text-2xl font-bold text-info-600 mt-0.5">{{ campaign.total_sent.toLocaleString() }}</p>
        </div>
        <div class="bg-default border border-default rounded-xl px-4 py-3">
          <p class="text-xs text-muted">Delivered</p>
          <p class="text-2xl font-bold text-success-600 mt-0.5">{{ campaign.total_delivered.toLocaleString() }}</p>
          <p v-if="campaign.total_sent" class="text-xs text-success-600">{{ deliveryRate() }}%</p>
        </div>
        <div class="bg-default border border-default rounded-xl px-4 py-3">
          <p class="text-xs text-muted">Read</p>
          <p class="text-2xl font-bold text-primary mt-0.5">{{ campaign.total_read.toLocaleString() }}</p>
          <p v-if="campaign.total_sent" class="text-xs text-primary">{{ readRate() }}%</p>
        </div>
      </div>

      <!-- Contacts section -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-highlighted">Contacts <span class="text-muted font-normal text-sm">({{ contactsTotal }})</span></h2>
        <UButton
          v-if="campaign.status === 'draft'"
          icon="i-lucide-user-plus"
          color="primary"
          variant="subtle"
          size="sm"
          @click="showAddModal = true"
        >
          Add Contacts
        </UButton>
      </div>

      <UCard class="overflow-hidden p-0">
        <UTable :data="contacts" :columns="contactColumns" :loading="contactsLoading">

          <template #phone_number-cell="{ row }">
            <span class="font-mono text-sm text-default">{{ row.original.phone_number }}</span>
          </template>

          <template #status-cell="{ row }">
            <UBadge :color="contactStatusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">
              {{ row.original.status }}
            </UBadge>
          </template>

          <template #sent_at-cell="{ row }">
            <span class="text-sm text-muted">{{ row.original.sent_at ? new Date(row.original.sent_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' }}</span>
          </template>

          <template #delivered_at-cell="{ row }">
            <span class="text-sm text-muted">{{ row.original.delivered_at ? new Date(row.original.delivered_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' }}</span>
          </template>

          <template #read_at-cell="{ row }">
            <span class="text-sm text-muted">{{ row.original.read_at ? new Date(row.original.read_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' }}</span>
          </template>

          <template #empty>
            <div class="text-center py-10 text-muted">
              <UIcon name="i-lucide-users" class="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p class="text-sm">No contacts added yet.</p>
              <button v-if="campaign.status === 'draft'" class="text-xs text-primary hover:underline mt-1" @click="showAddModal = true">Add contacts to get started</button>
            </div>
          </template>

        </UTable>
      </UCard>

      <!-- Add contacts modal -->
      <UModal v-model:open="showAddModal" title="Add Contacts" description="Search and select contacts to add to this campaign.">
        <template #body>
          <div class="space-y-4">
            <UInput v-model="contactSearch" icon="i-lucide-search" placeholder="Search by name or email…" />

            <div v-if="searchLoading" class="space-y-2">
              <USkeleton v-for="i in 4" :key="i" class="h-10 rounded-lg" />
            </div>

            <div v-else-if="!contactSearch" class="text-center py-6 text-sm text-muted">
              Type to search contacts.
            </div>

            <div v-else-if="searchResults.length === 0" class="text-center py-6 text-sm text-muted">
              No contacts found.
            </div>

            <div v-else class="space-y-1 max-h-72 overflow-y-auto">
              <button
                v-for="c in searchResults"
                :key="c.id"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left"
                :class="selectedIds.has(c.id) ? 'border-primary bg-primary/5' : 'border-default hover:bg-elevated'"
                @click="toggleSelect(c.id)"
              >
                <div class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors" :class="selectedIds.has(c.id) ? 'border-primary bg-primary' : 'border-default'">
                  <UIcon v-if="selectedIds.has(c.id)" name="i-lucide-check" class="w-3 h-3 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-highlighted truncate">{{ c.full_name || c.email }}</p>
                  <p class="text-xs text-muted truncate">{{ c.email }}</p>
                </div>
              </button>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-default">
              <span class="text-sm text-muted">{{ selectedIds.size }} selected</span>
              <div class="flex gap-2">
                <UButton color="neutral" variant="subtle" @click="showAddModal = false; selectedIds = new Set(); contactSearch = ''">Cancel</UButton>
                <UButton :disabled="selectedIds.size === 0" :loading="adding" @click="handleAddContacts">
                  Add {{ selectedIds.size > 0 ? selectedIds.size : '' }} Contact{{ selectedIds.size !== 1 ? 's' : '' }}
                </UButton>
              </div>
            </div>
          </div>
        </template>
      </UModal>

    </template>
  </div>
</template>
