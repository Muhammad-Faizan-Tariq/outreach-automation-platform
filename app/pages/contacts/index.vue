<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Contact, ImportBatch } from '~/composables/useContacts'

const toast = useToast()

// ---------- mock data ----------
const MOCK_CONTACTS: Contact[] = [
  { id: '1', email: 'ahmed.alrashidi@gmail.com', full_name: 'Ahmed Al-Rashidi', country: 'UAE', contact_type: 'owner', status: 'active', property_count: 3, total_emails_sent: 4, created_at: '2025-05-10T10:00:00Z' },
  { id: '2', email: 'sara.almansoori@outlook.com', full_name: 'Sara Al-Mansoori', country: 'UAE', contact_type: 'owner', status: 'active', property_count: 1, total_emails_sent: 2, created_at: '2025-05-09T09:00:00Z' },
  { id: '3', email: 'khalid.hassan@gmail.com', full_name: 'Khalid Hassan', country: 'UAE', contact_type: 'tenant', status: 'active', property_count: 1, total_emails_sent: 1, created_at: '2025-05-08T14:00:00Z' },
  { id: '4', email: 'fatima.alali@yahoo.com', full_name: 'Fatima Al-Ali', country: 'UAE', contact_type: 'owner', status: 'unsubscribed', property_count: 2, total_emails_sent: 3, created_at: '2025-05-07T11:00:00Z' },
  { id: '5', email: 'omar.sheikh@gmail.com', full_name: 'Omar Sheikh', country: 'UAE', contact_type: 'lead', status: 'active', property_count: 0, total_emails_sent: 1, created_at: '2025-05-06T08:00:00Z' },
  { id: '6', email: 'nadia.karim@hotmail.com', full_name: 'Nadia Karim', country: 'UAE', contact_type: 'owner', status: 'active', property_count: 4, total_emails_sent: 5, created_at: '2025-05-05T16:00:00Z' },
  { id: '7', email: 'hassan.ibrahim@gmail.com', full_name: 'Hassan Ibrahim', country: 'Egypt', contact_type: 'owner', status: 'bounced', property_count: 1, total_emails_sent: 1, created_at: '2025-05-04T10:00:00Z' },
  { id: '8', email: 'layla.ahmed@gmail.com', full_name: 'Layla Ahmed', country: 'UAE', contact_type: 'owner', status: 'active', property_count: 2, total_emails_sent: 3, created_at: '2025-05-03T09:00:00Z' },
  { id: '9', email: 'mohammed.alabudhabi@outlook.com', full_name: 'Mohammed Al-Abudhabi', country: 'UAE', contact_type: 'owner', status: 'active', property_count: 5, total_emails_sent: 6, created_at: '2025-05-02T13:00:00Z' },
  { id: '10', email: 'ali.hussain@gmail.com', full_name: 'Ali Hussain', country: 'Bahrain', contact_type: 'lead', status: 'active', property_count: 0, total_emails_sent: 1, created_at: '2025-05-01T10:00:00Z' },
  { id: '11', email: 'rima.saleh@gmail.com', full_name: 'Rima Saleh', country: 'UAE', contact_type: 'owner', status: 'active', property_count: 1, total_emails_sent: 2, created_at: '2025-04-30T11:00:00Z' },
  { id: '12', email: 'tariq.almutairi@gmail.com', full_name: 'Tariq Al-Mutairi', country: 'Kuwait', contact_type: 'owner', status: 'do_not_contact', property_count: 2, total_emails_sent: 2, created_at: '2025-04-29T09:00:00Z' },
  { id: '13', email: 'hind.alqasimi@outlook.com', full_name: 'Hind Al-Qasimi', country: 'UAE', contact_type: 'owner', status: 'active', property_count: 3, total_emails_sent: 4, created_at: '2025-04-28T15:00:00Z' },
  { id: '14', email: 'saif.alblooshi@gmail.com', full_name: 'Saif Al-Blooshi', country: 'UAE', contact_type: 'tenant', status: 'active', property_count: 1, total_emails_sent: 1, created_at: '2025-04-27T10:00:00Z' },
  { id: '15', email: 'mariam.alketbi@gmail.com', full_name: 'Mariam Al-Ketbi', country: 'UAE', contact_type: 'owner', status: 'active', property_count: 2, total_emails_sent: 3, created_at: '2025-04-26T08:00:00Z' },
  { id: '16', email: 'rashid.alfalasi@yahoo.com', full_name: 'Rashid Al-Falasi', country: 'UAE', contact_type: 'owner', status: 'complained', property_count: 1, total_emails_sent: 2, created_at: '2025-04-25T13:00:00Z' },
  { id: '17', email: 'amira.hassan@gmail.com', full_name: 'Amira Hassan', country: 'Egypt', contact_type: 'lead', status: 'active', property_count: 0, total_emails_sent: 1, created_at: '2025-04-24T11:00:00Z' },
  { id: '18', email: 'sultan.almanei@outlook.com', full_name: 'Sultan Al-Manei', country: 'UAE', contact_type: 'owner', status: 'active', property_count: 6, total_emails_sent: 7, created_at: '2025-04-23T09:00:00Z' },
  { id: '19', email: 'dalal.alshehhi@gmail.com', full_name: 'Dalal Al-Shehhi', country: 'UAE', contact_type: 'owner', status: 'active', property_count: 2, total_emails_sent: 3, created_at: '2025-04-22T14:00:00Z' },
  { id: '20', email: 'waleed.almarri@gmail.com', full_name: 'Waleed Al-Marri', country: 'Qatar', contact_type: 'owner', status: 'active', property_count: 1, total_emails_sent: 2, created_at: '2025-04-21T10:00:00Z' },
]

// ---------- pagination + search ----------
const page = ref(1)
const pageSize = 50
const search = ref('')
const loading = ref(false)

const filtered = computed(() => {
  if (!search.value.trim()) return MOCK_CONTACTS
  const q = search.value.toLowerCase()
  return MOCK_CONTACTS.filter(c =>
    c.email.toLowerCase().includes(q)
    || (c.full_name?.toLowerCase().includes(q) ?? false),
  )
})

const contacts = computed(() => filtered.value)
const total = computed(() => filtered.value.length)

watch(search, () => { page.value = 1 })

// ---------- import modal ----------
const importOpen = ref(false)
const selectedFile = ref<File | null>(null)
const importing = ref(false)
const importBatch = ref<ImportBatch | null>(null)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

async function startImport() {
  if (!selectedFile.value) return
  importing.value = true
  importBatch.value = null
  // Simulate a 1.5 s processing delay, then show completed state
  await new Promise(r => setTimeout(r, 800))
  importBatch.value = {
    id: 'mock-batch-1',
    filename: selectedFile.value.name,
    status: 'processing',
    total_rows: 247,
    contacts_created: 0,
    contacts_updated: 0,
    properties_created: 0,
    rows_skipped: 0,
    rows_failed: 0,
    error_log: [],
    started_at: new Date().toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
  }
  await new Promise(r => setTimeout(r, 1400))
  importBatch.value = {
    id: 'mock-batch-1',
    filename: selectedFile.value.name,
    status: 'completed',
    total_rows: 247,
    contacts_created: 238,
    contacts_updated: 0,
    properties_created: 238,
    rows_skipped: 9,
    rows_failed: 0,
    error_log: [],
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
  importing.value = false
  toast.add({
    title: 'Import complete',
    description: '238 contacts added, 9 skipped.',
    color: 'success',
    icon: 'i-lucide-check-circle',
  })
}

function closeImport() {
  importOpen.value = false
  importBatch.value = null
  selectedFile.value = null
  importing.value = false
}

// ---------- table ----------
const columns: TableColumn<Contact>[] = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'full_name', header: 'Name' },
  { accessorKey: 'country', header: 'Country' },
  { accessorKey: 'contact_type', header: 'Type' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'properties', header: 'Properties' },
  { id: 'sent', header: 'Sent' },
]

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const TYPE_COLOR: Record<string, BadgeColor> = {
  owner: 'primary',
  tenant: 'info',
  lead: 'neutral',
}

const STATUS_COLOR: Record<string, BadgeColor> = {
  active: 'success',
  unsubscribed: 'neutral',
  bounced: 'error',
  complained: 'warning',
  do_not_contact: 'error',
  deleted: 'neutral',
}

function typeColor(t: string): BadgeColor { return (TYPE_COLOR[t] ?? 'neutral') as BadgeColor }
function statusColor(s: string): BadgeColor { return (STATUS_COLOR[s] ?? 'neutral') as BadgeColor }

function importStatusLabel(s: string) {
  return ({ pending: 'Queued', processing: 'Processing…', completed: 'Done', failed: 'Failed' } as Record<string, string>)[s] ?? s
}
function importStatusColor(s: string): BadgeColor {
  const map: Record<string, BadgeColor> = { pending: 'neutral', processing: 'warning', completed: 'success', failed: 'error' }
  return (map[s] ?? 'neutral') as BadgeColor
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Contacts</h1>
        <p class="mt-0.5 text-sm text-muted">{{ total.toLocaleString() }} total</p>
      </div>
      <UButton icon="i-lucide-upload" @click="importOpen = true">
        Import CSV
      </UButton>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search by email or name…"
        class="max-w-xs"
      />
    </div>

    <!-- Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable :data="contacts" :columns="columns" :loading="loading">

        <template #email-cell="{ row }">
          <NuxtLink
            :to="`/contacts/${row.original.id}`"
            class="text-sm font-medium text-primary hover:underline"
          >
            {{ row.original.email }}
          </NuxtLink>
        </template>

        <template #full_name-cell="{ row }">
          <span class="text-sm text-default">{{ row.original.full_name ?? '—' }}</span>
        </template>

        <template #country-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.country ?? '—' }}</span>
        </template>

        <template #contact_type-cell="{ row }">
          <UBadge :color="typeColor(row.original.contact_type)" variant="subtle" class="capitalize">
            {{ row.original.contact_type }}
          </UBadge>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" class="capitalize">
            {{ row.original.status.replace('_', ' ') }}
          </UBadge>
        </template>

        <template #properties-cell="{ row }">
          <span class="text-sm text-muted tabular-nums">{{ row.original.property_count }}</span>
        </template>

        <template #sent-cell="{ row }">
          <span class="text-sm text-muted tabular-nums">{{ row.original.total_emails_sent }}</span>
        </template>

      </UTable>
    </UCard>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex justify-center mt-6">
      <UPagination v-model:page="page" :total="total" :page-size="pageSize" />
    </div>

    <!-- Import modal -->
    <UModal v-model:open="importOpen" :dismissible="!importing" @close="closeImport">
      <template #content>
        <UCard class="sm:max-w-md w-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-highlighted">Import contacts</h3>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                :disabled="importing"
                @click="closeImport"
              />
            </div>
          </template>

          <!-- File picker (only before upload) -->
          <div v-if="!importBatch" class="space-y-4">
            <p class="text-sm text-muted">
              Upload a DLD CSV file. Processing runs in the background — you'll see a live status below.
            </p>
            <div>
              <label class="text-sm font-medium text-highlighted block mb-1.5">CSV file</label>
              <input
                type="file"
                accept=".csv,text/csv"
                class="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                @change="onFileChange"
              />
            </div>
            <UButton
              block
              :disabled="!selectedFile"
              :loading="importing"
              @click="startImport"
            >
              Start import
            </UButton>
          </div>

          <!-- Live import progress -->
          <div v-else class="space-y-4">
            <div class="flex items-center gap-3">
              <UBadge :color="importStatusColor(importBatch.status)" variant="subtle">
                {{ importStatusLabel(importBatch.status) }}
              </UBadge>
              <span class="text-sm text-muted truncate">{{ importBatch.filename }}</span>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="bg-elevated rounded-lg p-3">
                <p class="text-muted text-xs mb-0.5">Rows</p>
                <p class="font-semibold text-highlighted tabular-nums">{{ importBatch.total_rows }}</p>
              </div>
              <div class="bg-elevated rounded-lg p-3">
                <p class="text-muted text-xs mb-0.5">Created</p>
                <p class="font-semibold text-success-600 tabular-nums">{{ importBatch.contacts_created }}</p>
              </div>
              <div class="bg-elevated rounded-lg p-3">
                <p class="text-muted text-xs mb-0.5">Skipped</p>
                <p class="font-semibold text-muted tabular-nums">{{ importBatch.rows_skipped }}</p>
              </div>
              <div class="bg-elevated rounded-lg p-3">
                <p class="text-muted text-xs mb-0.5">Failed</p>
                <p class="font-semibold text-error-600 tabular-nums">{{ importBatch.rows_failed }}</p>
              </div>
            </div>

            <!-- Spinner while processing -->
            <div v-if="importing" class="flex items-center gap-2 text-sm text-muted">
              <UIcon name="i-lucide-loader-circle" class="w-4 h-4 animate-spin" />
              Processing…
            </div>

            <!-- Error log -->
            <div v-if="importBatch.error_log?.length" class="text-xs text-error-600 bg-error-50 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
              <p v-for="(err, i) in importBatch.error_log.slice(0, 20)" :key="i">{{ err.row ?? '' }} {{ err.reason ?? JSON.stringify(err) }}</p>
            </div>

            <UButton
              v-if="!importing"
              block
              color="neutral"
              variant="subtle"
              @click="closeImport"
            >
              Close
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>

  </div>
</template>
