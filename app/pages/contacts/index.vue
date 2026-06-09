<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Contact, ImportBatch } from '~/composables/useContacts'

const toast = useToast()
const { contacts, total, loading, fetchContacts, uploadCSV, getImport } = useContacts()

// ---------- pagination + search ----------
const page = ref(1)
const pageSize = 50
const search = ref('')
let searchTimer: ReturnType<typeof setTimeout>

const load = () => fetchContacts({ page: page.value, page_size: pageSize, search: search.value || undefined })

watch(page, load)
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 350)
})
onMounted(load)

// ---------- import modal ----------
const importOpen = ref(false)
const selectedFile = ref<File | null>(null)
const importing = ref(false)
const importBatch = ref<ImportBatch | null>(null)
let pollTimer: ReturnType<typeof setInterval>

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

async function startImport() {
  if (!selectedFile.value) return
  importing.value = true
  importBatch.value = null
  try {
    const { batch_id } = await uploadCSV(selectedFile.value)
    // Start polling
    pollTimer = setInterval(async () => {
      const batch = await getImport(batch_id)
      importBatch.value = batch
      if (['completed', 'failed'].includes(batch.status)) {
        clearInterval(pollTimer)
        importing.value = false
        if (batch.status === 'completed') {
          toast.add({
            title: 'Import complete',
            description: `${batch.contacts_created} contacts added, ${batch.rows_skipped} skipped.`,
            color: 'success',
            icon: 'i-lucide-check-circle',
          })
          importOpen.value = false
          await load()
        }
        else {
          toast.add({
            title: 'Import failed',
            description: 'Check the error log below.',
            color: 'error',
            icon: 'i-lucide-alert-circle',
          })
        }
      }
    }, 2000)
  }
  catch (e: any) {
    importing.value = false
    toast.add({
      title: 'Upload failed',
      description: e?.data?.detail ?? 'Could not upload file.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
}

function closeImport() {
  clearInterval(pollTimer)
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

function typeColor(t: string): BadgeColor { return TYPE_COLOR[t] ?? 'neutral' }
function statusColor(s: string): BadgeColor { return STATUS_COLOR[s] ?? 'neutral' }

function importStatusLabel(s: string) {
  return { pending: 'Queued', processing: 'Processing…', completed: 'Done', failed: 'Failed' }[s] ?? s
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
