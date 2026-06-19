<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

const { campaigns, total, loading, error, fetchCampaigns, startCampaign, pauseCampaign, deleteCampaign } = useWaCampaigns()
const toast = useToast()

const search = ref('')
const statusFilter = ref('all')
const page = ref(1)

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; reload() }, 400)
})
watch(statusFilter, () => { page.value = 1; reload() })

async function reload() {
  await fetchCampaigns({ status: statusFilter.value, search: search.value, page: page.value, pageSize: 50 })
}

onMounted(reload)

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Running', value: 'running' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
]

const stats = computed(() => ({
  total: campaigns.value.length,
  running: campaigns.value.filter(c => c.status === 'running').length,
  completed: campaigns.value.filter(c => c.status === 'completed').length,
  draft: campaigns.value.filter(c => c.status === 'draft').length,
}))

type StatusColor = 'success' | 'warning' | 'neutral' | 'error' | 'info'
function statusColor(s: string): StatusColor {
  const map: Record<string, StatusColor> = { running: 'success', paused: 'warning', completed: 'info', failed: 'error', draft: 'neutral' }
  return map[s] ?? 'neutral'
}

const columns: ColumnDef<any>[] = [
  { accessorKey: 'name', header: 'Campaign' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'total_contacts', header: 'Contacts' },
  { accessorKey: 'total_sent', header: 'Sent' },
  { accessorKey: 'total_delivered', header: 'Delivered' },
  { accessorKey: 'total_read', header: 'Read' },
  { accessorKey: 'started_at', header: 'Started' },
  { accessorKey: 'actions', header: '' },
]

const actionId = ref<string | null>(null)

async function handleStart(id: string) {
  actionId.value = id
  try {
    const updated = await startCampaign(id)
    const idx = campaigns.value.findIndex(c => c.id === id)
    if (idx !== -1) campaigns.value[idx] = updated
    toast.add({ title: 'Campaign started', color: 'success', icon: 'i-lucide-play' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to start', description: e?.data?.detail ?? 'Error.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { actionId.value = null }
}

async function handlePause(id: string) {
  actionId.value = id
  try {
    const updated = await pauseCampaign(id)
    const idx = campaigns.value.findIndex(c => c.id === id)
    if (idx !== -1) campaigns.value[idx] = updated
    toast.add({ title: 'Campaign paused', color: 'warning', icon: 'i-lucide-pause' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to pause', description: e?.data?.detail ?? 'Error.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { actionId.value = null }
}

async function handleDelete(id: string, name: string) {
  actionId.value = id
  try {
    await deleteCampaign(id)
    toast.add({ title: 'Campaign deleted', description: `"${name}" removed.`, color: 'success', icon: 'i-lucide-trash-2' })
    reload()
  }
  catch (e: any) {
    toast.add({ title: 'Delete failed', description: e?.data?.detail ?? 'Error.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { actionId.value = null }
}

const isFirstLoad = computed(() => loading.value && campaigns.value.length === 0)

function deliveryRate(c: any) {
  return c.total_sent ? Math.round(c.total_delivered / c.total_sent * 100) : 0
}
function readRate(c: any) {
  return c.total_sent ? Math.round(c.total_read / c.total_sent * 100) : 0
}
</script>

<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">WhatsApp Campaigns</h1>
        <p class="text-sm text-muted mt-0.5">Send WhatsApp template messages to your contacts</p>
      </div>
      <NuxtLink to="/whatsapp/campaigns/create">
        <UButton icon="i-lucide-plus" color="primary">New Campaign</UButton>
      </NuxtLink>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 px-4 py-3 bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800 rounded-xl text-sm text-error-600 dark:text-error-400">
      {{ error }}
    </div>

    <!-- Stats skeleton -->
    <div v-if="isFirstLoad" class="grid grid-cols-4 gap-4 mb-6">
      <USkeleton v-for="i in 4" :key="i" class="h-16 rounded-xl" />
    </div>

    <!-- Stats -->
    <div v-else class="grid grid-cols-4 gap-4 mb-6">
      <div
        v-for="stat in [
          { label: 'Total', count: total, color: 'text-highlighted' },
          { label: 'Running', count: stats.running, color: 'text-success-600' },
          { label: 'Completed', count: stats.completed, color: 'text-info-600' },
          { label: 'Draft', count: stats.draft, color: 'text-muted' },
        ]"
        :key="stat.label"
        class="bg-default border border-default rounded-xl px-4 py-3"
      >
        <p class="text-xs text-muted">{{ stat.label }}</p>
        <p class="text-2xl font-bold mt-0.5" :class="stat.color">{{ stat.count }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-4">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search campaigns…" class="w-64" />
      <USelect v-model="statusFilter" :items="statusOptions" value-key="value" label-key="label" class="w-44" />
      <span class="text-sm text-muted ml-auto">{{ total }} campaign{{ total !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Table skeleton -->
    <div v-if="isFirstLoad" class="space-y-2">
      <USkeleton v-for="i in 6" :key="i" class="h-12 rounded-xl" />
    </div>

    <!-- Table -->
    <UCard v-else class="overflow-hidden p-0">
      <UTable :data="campaigns" :columns="columns" :loading="loading && campaigns.length > 0">

        <template #name-cell="{ row }">
          <div>
            <p class="text-sm font-medium text-highlighted">{{ row.original.name }}</p>
            <p v-if="row.original.description" class="text-xs text-muted truncate max-w-xs">{{ row.original.description }}</p>
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #total_contacts-cell="{ row }">
          <span class="text-sm text-default">{{ row.original.total_contacts.toLocaleString() }}</span>
        </template>

        <template #total_sent-cell="{ row }">
          <span class="text-sm text-default">{{ row.original.total_sent.toLocaleString() }}</span>
        </template>

        <template #total_delivered-cell="{ row }">
          <div>
            <span class="text-sm text-default">{{ row.original.total_delivered.toLocaleString() }}</span>
            <span v-if="row.original.total_sent" class="text-xs text-success-600 ml-1">{{ deliveryRate(row.original) }}%</span>
          </div>
        </template>

        <template #total_read-cell="{ row }">
          <div>
            <span class="text-sm text-default">{{ row.original.total_read.toLocaleString() }}</span>
            <span v-if="row.original.total_sent" class="text-xs text-info-600 ml-1">{{ readRate(row.original) }}%</span>
          </div>
        </template>

        <template #started_at-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.started_at ? new Date(row.original.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—' }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <UButton
              v-if="row.original.status === 'draft' || row.original.status === 'paused'"
              icon="i-lucide-play"
              color="success"
              variant="ghost"
              size="xs"
              title="Start"
              :loading="actionId === row.original.id"
              @click="handleStart(row.original.id)"
            />
            <UButton
              v-if="row.original.status === 'running'"
              icon="i-lucide-pause"
              color="warning"
              variant="ghost"
              size="xs"
              title="Pause"
              :loading="actionId === row.original.id"
              @click="handlePause(row.original.id)"
            />
            <UButton
              v-if="row.original.status === 'draft'"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              title="Delete"
              :loading="actionId === row.original.id"
              @click="handleDelete(row.original.id, row.original.name)"
            />
          </div>
        </template>

        <template #empty>
          <div class="text-center py-12 text-muted">
            <UIcon name="i-lucide-megaphone-off" class="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p class="text-sm">No campaigns yet.</p>
            <NuxtLink to="/whatsapp/campaigns/create" class="text-xs text-primary hover:underline mt-1 inline-block">Create your first campaign</NuxtLink>
          </div>
        </template>

      </UTable>
    </UCard>

  </div>
</template>
