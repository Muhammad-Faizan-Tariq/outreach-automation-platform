<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

const { templates, total, loading, error, fetchTemplates, deleteTemplate, syncTemplate, syncAll, importFromAlots } = useWaTemplates()
const toast = useToast()

const search = ref('')
const statusFilter = ref('all')
const categoryFilter = ref('all')
const page = ref(1)
const syncing = ref(false)
const importing = ref(false)

async function handleImport() {
  importing.value = true
  try {
    const res = await importFromAlots()
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

onMounted(reload)

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

const stats = computed(() => ({
  approved: templates.value.filter(t => t.status === 'approved').length,
  pending: templates.value.filter(t => t.status === 'pending').length,
  draft: templates.value.filter(t => t.status === 'draft').length,
  rejected: templates.value.filter(t => t.status === 'rejected').length,
}))

type StatusColor = 'success' | 'warning' | 'neutral' | 'error'
function statusColor(s: string): StatusColor {
  return s === 'approved' ? 'success' : s === 'pending' ? 'warning' : s === 'rejected' ? 'error' : 'neutral'
}

const columns: ColumnDef<any>[] = [
  { accessorKey: 'name', header: 'Template name' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'language', header: 'Language' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'body_text', header: 'Body preview' },
  { accessorKey: 'updated_at', header: 'Last updated' },
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
  finally {
    deletingId.value = null
  }
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
  finally {
    syncingId.value = null
  }
}

async function handleSyncAll() {
  syncing.value = true
  try {
    const res = await syncAll()
    toast.add({ title: `Synced ${res.synced} templates`, description: `${res.updated} status(es) updated.`, color: 'success', icon: 'i-lucide-refresh-cw' })
    reload()
  }
  catch {
    toast.add({ title: 'Sync all failed', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    syncing.value = false
  }
}

const isFirstLoad = computed(() => loading.value && templates.value.length === 0)
</script>

<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">WhatsApp Templates</h1>
        <p class="text-sm text-muted mt-0.5">Manage Meta-approved message templates for WhatsApp outreach</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-download" color="neutral" variant="subtle" :loading="importing" @click="handleImport">
          Import from Alots
        </UButton>
        <UButton icon="i-lucide-refresh-cw" color="neutral" variant="subtle" :loading="syncing" @click="handleSyncAll">
          Sync All
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

    <!-- Stats row skeleton -->
    <div v-if="isFirstLoad" class="grid grid-cols-4 gap-4 mb-6">
      <USkeleton v-for="i in 4" :key="i" class="h-16 rounded-xl" />
    </div>

    <!-- Stats row -->
    <div v-else class="grid grid-cols-4 gap-4 mb-6">
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
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search templates…" class="w-64" />
      <USelect v-model="statusFilter" :items="statusOptions" value-key="value" label-key="label" class="w-44" />
      <USelect v-model="categoryFilter" :items="categoryOptions" value-key="value" label-key="label" class="w-44" />
      <span class="text-sm text-muted ml-auto">{{ total }} template{{ total !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Table skeleton -->
    <div v-if="isFirstLoad" class="space-y-2">
      <USkeleton v-for="i in 8" :key="i" class="h-12 rounded-xl" />
    </div>

    <!-- Table -->
    <UCard v-else class="overflow-hidden p-0">
      <UTable :data="templates" :columns="columns" :loading="loading && templates.length > 0">

        <template #name-cell="{ row }">
          <NuxtLink :to="`/whatsapp/templates/${row.original.id}`" class="font-mono text-sm text-primary hover:underline">
            {{ row.original.name }}
          </NuxtLink>
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
              title="Sync status"
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

  </div>
</template>
