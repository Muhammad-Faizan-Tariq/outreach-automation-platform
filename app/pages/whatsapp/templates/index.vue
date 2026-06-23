<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

const { templates, total, loading: templatesLoading, error, fetchTemplates, deleteTemplate, syncTemplate, importFromAlots, importAllFromAlots } = useWaTemplates()
const { phones, loading: phonesLoading, fetchAllPhones } = useWaPhoneNumbers()
const { accounts, loading: accountsLoading, fetchAccounts } = useWaAccounts()
const toast = useToast()

const search = ref('')
const statusFilter = ref('all')
const categoryFilter = ref('all')
const accountFilter = ref('all')
const page = ref(1)
const importing = ref(false)
const importingAll = ref(false)
const showImportModal = ref(false)
const importPhoneId = ref('')

onMounted(() => {
  fetchAllPhones()
  fetchAccounts()
  reload()
})

// ── Lookup maps ─────────────────────────────────────────────────────────────
const accountMap = computed(() =>
  Object.fromEntries(accounts.value.map(a => [a.id, a.name]))
)

// phoneId → { label: "Dubai 02 — +447401457395", accountId, accountName }
const phoneInfoMap = computed(() => {
  const map: Record<string, { label: string; accountId: string; accountName: string }> = {}
  for (const p of phones.value) {
    const accountName = accountMap.value[p.wa_account_id] ?? 'Unknown'
    const phoneLabel = p.display_name || p.phone_number || p.phone_number_id
    map[p.id] = { label: `${accountName} — ${phoneLabel}`, accountId: p.wa_account_id, accountName }
  }
  return map
})

// phoneIds that belong to the selected account filter
const filteredPhoneIds = computed(() => {
  if (accountFilter.value === 'all') return null
  return phones.value
    .filter(p => p.wa_account_id === accountFilter.value)
    .map(p => p.id)
})

// Apply account filter client-side (on top of server-side status/category/search filters)
const visibleTemplates = computed(() => {
  if (!filteredPhoneIds.value) return templates.value
  return templates.value.filter(t =>
    t.wa_phone_number_id && filteredPhoneIds.value!.includes(t.wa_phone_number_id)
  )
})

// ── Import ──────────────────────────────────────────────────────────────────
const activePhoneOptions = computed(() =>
  phones.value
    .filter(p => p.is_active)
    .map(p => ({
      label: phoneInfoMap.value[p.id]?.label ?? p.phone_number_id,
      value: p.id,
    }))
)

async function handleImport() {
  if (!importPhoneId.value) {
    toast.add({ title: 'Select a phone number first', color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }
  importing.value = true
  showImportModal.value = false
  try {
    const res = await importFromAlots(importPhoneId.value)
    if (res.imported > 0) {
      toast.add({
        title: `${res.imported} template${res.imported !== 1 ? 's' : ''} imported`,
        description: `${res.skipped} already existed · ${res.failed} failed · ${res.total_in_alots} total in Alots`,
        color: 'success',
        icon: 'i-lucide-download',
      })
      reload()
    }
    else {
      toast.add({
        title: 'Nothing new to import',
        description: `All ${res.total_in_alots} Alots template${res.total_in_alots !== 1 ? 's' : ''} already exist in your DB.`,
        color: 'neutral',
        icon: 'i-lucide-check',
      })
    }
  }
  catch (e: any) {
    toast.add({ title: 'Import failed', description: e?.data?.detail ?? 'Could not reach Alots.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { importing.value = false }
}

async function handleImportAll() {
  importingAll.value = true
  showImportModal.value = false
  try {
    const res = await importAllFromAlots()
    toast.add({
      title: `Import complete — ${res.imported} new template${res.imported !== 1 ? 's' : ''} added`,
      description: `${res.skipped} already existed · ${res.failed} failed · ${res.phones_scanned} phone numbers scanned`,
      color: res.imported > 0 ? 'success' : 'neutral',
      icon: 'i-lucide-download',
    })
    if (res.imported > 0) reload()
  }
  catch (e: any) {
    toast.add({ title: 'Import all failed', description: e?.data?.detail ?? 'Something went wrong.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    importingAll.value = false
  }
}

// ── Filters & reload ────────────────────────────────────────────────────────
let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; reload() }, 400)
})
watch([statusFilter, categoryFilter], () => { page.value = 1; reload() })

async function reload() {
  await fetchTemplates({
    status: statusFilter.value,
    category: categoryFilter.value,
    search: search.value,
    page: page.value,
    pageSize: 50,
  })
}

// ── Options ─────────────────────────────────────────────────────────────────
const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
  { label: 'Draft', value: 'draft' },
  { label: 'Rejected', value: 'rejected' },
]

const categoryOptions = [
  { label: 'All categories', value: 'all' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Utility', value: 'UTILITY' },
  { label: 'Authentication', value: 'AUTHENTICATION' },
]

const accountOptions = computed(() => [
  { label: 'All accounts', value: 'all' },
  ...accounts.value.map(a => ({ label: a.name, value: a.id })),
])

// ── Stats (from visible set) ────────────────────────────────────────────────
const stats = computed(() => ({
  approved: visibleTemplates.value.filter(t => t.status === 'approved').length,
  pending: visibleTemplates.value.filter(t => t.status === 'pending').length,
  draft: visibleTemplates.value.filter(t => t.status === 'draft').length,
  rejected: visibleTemplates.value.filter(t => t.status === 'rejected').length,
}))

type StatusColor = 'success' | 'warning' | 'neutral' | 'error'
function statusColor(s: string): StatusColor {
  return s === 'approved' ? 'success' : s === 'pending' ? 'warning' : s === 'rejected' ? 'error' : 'neutral'
}

// ── Table ────────────────────────────────────────────────────────────────────
const columns: ColumnDef<any>[] = [
  { accessorKey: 'name', header: 'Template name' },
  { accessorKey: 'account', header: 'Account' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'language', header: 'Lang' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'body_text', header: 'Body preview' },
  { accessorKey: 'updated_at', header: 'Updated' },
  { accessorKey: 'actions', header: '' },
]

const deletingId = ref<string | null>(null)
const syncingId = ref<string | null>(null)

async function handleDelete(id: string, name: string) {
  deletingId.value = id
  try {
    await deleteTemplate(id)
    toast.add({ title: 'Template deleted', description: `"${name}" has been removed.`, color: 'success', icon: 'i-lucide-trash-2' })
    reload()
  }
  catch (e: any) {
    toast.add({ title: 'Delete failed', description: e?.data?.detail ?? 'Could not delete template.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { deletingId.value = null }
}

async function handleSync(id: string) {
  syncingId.value = id
  try {
    const updated = await syncTemplate(id)
    const idx = templates.value.findIndex(t => t.id === id)
    if (idx !== -1) templates.value[idx] = updated
    toast.add({ title: 'Status synced', color: 'success', icon: 'i-lucide-refresh-cw' })
  }
  catch {
    toast.add({ title: 'Sync failed', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { syncingId.value = null }
}

const loading = computed(() => templatesLoading.value || phonesLoading.value || accountsLoading.value)
const isFirstLoad = computed(() => loading.value && templates.value.length === 0)
</script>

<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">WhatsApp Templates</h1>
        <p class="text-sm text-muted mt-0.5">Meta-approved message templates for WhatsApp outreach</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-download" color="neutral" variant="subtle" :loading="importing" @click="showImportModal = true">
          Import from Alots
        </UButton>
        <NuxtLink to="/whatsapp/templates/create">
          <UButton icon="i-lucide-plus" color="primary">New Template</UButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 px-4 py-3 bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800 rounded-xl text-sm text-error-600 dark:text-error-400">
      {{ error }}
    </div>

    <!-- Centered first-load spinner -->
    <div v-if="isFirstLoad" class="flex flex-col items-center justify-center min-h-105 gap-5">
      <div class="relative">
        <div class="w-16 h-16 rounded-full border-4 border-primary/20" />
        <div class="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
      <div class="text-center">
        <p class="text-sm font-medium text-highlighted">Loading templates</p>
        <p class="text-xs text-muted mt-1">Fetching accounts and templates…</p>
      </div>
    </div>

    <template v-else>

    <!-- Stats row -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div
        v-for="stat in [
          { label: 'Approved', count: stats.approved, color: 'text-success-600' },
          { label: 'Pending Review', count: stats.pending, color: 'text-warning-600' },
          { label: 'Draft', count: stats.draft, color: 'text-muted' },
          { label: 'Rejected', count: stats.rejected, color: 'text-error-600' },
        ]"
        :key="stat.label"
        class="bg-default border border-default rounded-xl px-4 py-3"
      >
        <p class="text-xs text-muted">{{ stat.label }}</p>
        <p class="text-2xl font-bold mt-0.5" :class="stat.color">{{ stat.count }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search templates…" class="w-56" />
      <USelect v-model="accountFilter" :items="accountOptions" value-key="value" label-key="label" class="w-44" />
      <USelect v-model="statusFilter" :items="statusOptions" value-key="value" label-key="label" class="w-40" />
      <USelect v-model="categoryFilter" :items="categoryOptions" value-key="value" label-key="label" class="w-44" />
      <span class="text-sm text-muted ml-auto">
        {{ visibleTemplates.length }} template{{ visibleTemplates.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Table -->
    <UCard class="overflow-hidden p-0">
      <UTable :data="visibleTemplates" :columns="columns" :loading="loading && templates.length > 0">

        <template #name-cell="{ row }">
          <NuxtLink :to="`/whatsapp/templates/${row.original.id}`" class="font-mono text-sm text-primary hover:underline">
            {{ row.original.name }}
          </NuxtLink>
        </template>

        <template #account-cell="{ row }">
          <div v-if="row.original.wa_phone_number_id && phoneInfoMap[row.original.wa_phone_number_id]" class="text-xs leading-tight">
            <p class="font-medium text-highlighted">{{ phoneInfoMap[row.original.wa_phone_number_id].accountName }}</p>
            <p class="text-muted">{{ phoneInfoMap[row.original.wa_phone_number_id].label.split(' — ')[1] }}</p>
          </div>
          <span v-else class="text-xs text-muted">—</span>
        </template>

        <template #category-cell="{ row }">
          <span class="text-sm text-default capitalize">{{ row.original.category.toLowerCase() }}</span>
        </template>

        <template #language-cell="{ row }">
          <span class="text-sm font-medium text-default uppercase">{{ row.original.language }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #body_text-cell="{ row }">
          <p class="text-sm text-muted max-w-xs truncate">{{ row.original.body_text }}</p>
        </template>

        <template #updated_at-cell="{ row }">
          <span class="text-sm text-muted">{{ new Date(row.original.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <NuxtLink :to="`/whatsapp/templates/${row.original.id}`">
              <UButton icon="i-lucide-eye" color="neutral" variant="ghost" size="xs" title="View" />
            </NuxtLink>
            <UButton
              v-if="row.original.status === 'pending'"
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              size="xs"
              title="Sync status from Alots"
              :loading="syncingId === row.original.id"
              @click="handleSync(row.original.id)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              title="Delete"
              :loading="deletingId === row.original.id"
              @click="handleDelete(row.original.id, row.original.name)"
            />
          </div>
        </template>

        <template #empty>
          <div class="text-center py-12 text-muted">
            <UIcon name="i-lucide-message-circle-off" class="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p class="text-sm">No templates found.</p>
            <NuxtLink to="/whatsapp/templates/create" class="text-xs text-primary hover:underline mt-1 inline-block">Create your first template</NuxtLink>
          </div>
        </template>

      </UTable>
    </UCard>

    </template>

  </div>

  <!-- Import modal -->
  <UModal v-model:open="showImportModal" title="Import from Alots">
    <template #body>
      <div class="space-y-5">

        <!-- Import all -->
        <div class="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
          <UIcon name="i-lucide-zap" class="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-highlighted">Import from all accounts</p>
            <p class="text-xs text-muted mt-0.5">
              Scans all {{ phones.filter((p: any) => p.is_active).length }} active phone numbers across every account and imports any templates not already in your DB.
            </p>
          </div>
          <UButton size="sm" icon="i-lucide-download" :loading="importingAll" @click="handleImportAll">
            Import All
          </UButton>
        </div>

        <div class="flex items-center gap-3 text-xs text-muted">
          <div class="flex-1 h-px bg-default" />
          or import from one phone number
          <div class="flex-1 h-px bg-default" />
        </div>

        <!-- Single phone picker -->
        <div>
          <USelect
            v-model="importPhoneId"
            :items="activePhoneOptions"
            value-key="value"
            label-key="label"
            placeholder="Select phone number…"
          />
          <p v-if="activePhoneOptions.length === 0" class="text-xs text-warning-600 mt-1">
            No active phone numbers found.
            <NuxtLink to="/whatsapp/accounts" class="underline">Add phone numbers first</NuxtLink>
          </p>
        </div>

      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="showImportModal = false">Cancel</UButton>
        <UButton :disabled="!importPhoneId" :loading="importing" icon="i-lucide-download" @click="handleImport">
          Import selected
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Import all loading overlay -->
  <UModal :open="importingAll" title="Importing from all accounts…" :closable="false">
    <template #body>
      <div class="flex flex-col items-center gap-4 py-4">
        <UIcon name="i-lucide-download" class="w-10 h-10 text-primary animate-pulse" />
        <p class="text-sm text-muted text-center">Scanning all phone numbers and importing templates.<br>This may take a moment…</p>
      </div>
    </template>
  </UModal>

</template>
