<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

const { messages, total, loading, error, fetchInbound, markHandled } = useWaInbound()
const toast = useToast()

const handledFilter = ref<'all' | 'unhandled' | 'handled'>('all')
const search = ref('')
const page = ref(1)

watch(handledFilter, () => { page.value = 1; reload() })

async function reload() {
  const is_handled = handledFilter.value === 'all' ? null : handledFilter.value === 'handled'
  await fetchInbound({ is_handled, page: page.value, pageSize: 50 })
}

onMounted(reload)

const columns: ColumnDef<any>[] = [
  { accessorKey: 'from_phone', header: 'From' },
  { accessorKey: 'message_type', header: 'Type' },
  { accessorKey: 'body', header: 'Message' },
  { accessorKey: 'is_handled', header: 'Status' },
  { accessorKey: 'received_at', header: 'Received' },
  { accessorKey: 'actions', header: '' },
]

const filtered = computed(() => {
  if (!search.value.trim()) return messages.value
  const q = search.value.toLowerCase()
  return messages.value.filter(m =>
    m.from_phone.includes(q) || (m.body ?? '').toLowerCase().includes(q),
  )
})

const handlingId = ref<string | null>(null)

async function toggleHandled(msg: any) {
  handlingId.value = msg.id
  try {
    const updated = await markHandled(msg.id, !msg.is_handled)
    const idx = messages.value.findIndex(m => m.id === msg.id)
    if (idx !== -1) messages.value[idx] = updated
    toast.add({
      title: updated.is_handled ? 'Marked as handled' : 'Marked as unhandled',
      color: 'success',
      icon: updated.is_handled ? 'i-lucide-check-circle' : 'i-lucide-circle',
    })
  }
  catch {
    toast.add({ title: 'Update failed', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    handlingId.value = null
  }
}

const isFirstLoad = computed(() => loading.value && messages.value.length === 0)

const unhandledCount = computed(() => messages.value.filter(m => !m.is_handled).length)
</script>

<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">WA Inbound Messages</h1>
        <p class="text-sm text-muted mt-0.5">Replies and inbound messages from your WhatsApp contacts</p>
      </div>
      <UBadge v-if="unhandledCount > 0" color="warning" variant="subtle">
        {{ unhandledCount }} unhandled
      </UBadge>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 px-4 py-3 bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800 rounded-xl text-sm text-error-600 dark:text-error-400">
      {{ error }}
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search by phone or message…" class="w-64" />

      <div class="flex rounded-lg border border-default overflow-hidden">
        <button
          v-for="opt in [{ label: 'All', value: 'all' }, { label: 'Unhandled', value: 'unhandled' }, { label: 'Handled', value: 'handled' }]"
          :key="opt.value"
          class="px-3 py-1.5 text-sm transition-colors"
          :class="handledFilter === opt.value
            ? 'bg-primary text-white font-medium'
            : 'text-muted hover:bg-elevated'"
          @click="handledFilter = opt.value as any"
        >
          {{ opt.label }}
        </button>
      </div>

      <span class="text-sm text-muted ml-auto">{{ total }} message{{ total !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Skeleton -->
    <div v-if="isFirstLoad" class="space-y-2">
      <USkeleton v-for="i in 8" :key="i" class="h-14 rounded-xl" />
    </div>

    <!-- Table -->
    <UCard v-else class="overflow-hidden p-0">
      <UTable :data="filtered" :columns="columns" :loading="loading && messages.length > 0">

        <template #from_phone-cell="{ row }">
          <span class="font-mono text-sm text-default">{{ row.original.from_phone }}</span>
        </template>

        <template #message_type-cell="{ row }">
          <UBadge color="neutral" variant="subtle" size="xs" class="capitalize">{{ row.original.message_type }}</UBadge>
        </template>

        <template #body-cell="{ row }">
          <p class="text-sm text-muted max-w-sm truncate">{{ row.original.body ?? '—' }}</p>
        </template>

        <template #is_handled-cell="{ row }">
          <UBadge :color="row.original.is_handled ? 'success' : 'warning'" variant="subtle" size="sm">
            {{ row.original.is_handled ? 'Handled' : 'Unhandled' }}
          </UBadge>
        </template>

        <template #received_at-cell="{ row }">
          <span class="text-sm text-muted">
            {{ new Date(row.original.received_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UButton
              :icon="row.original.is_handled ? 'i-lucide-rotate-ccw' : 'i-lucide-check'"
              :color="row.original.is_handled ? 'neutral' : 'success'"
              variant="ghost"
              size="xs"
              :title="row.original.is_handled ? 'Mark unhandled' : 'Mark handled'"
              :loading="handlingId === row.original.id"
              @click="toggleHandled(row.original)"
            />
          </div>
        </template>

        <template #empty>
          <div class="text-center py-12 text-muted">
            <UIcon name="i-lucide-message-square" class="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p class="text-sm">No inbound messages yet.</p>
            <p class="text-xs mt-1">Messages appear here when contacts reply to your campaigns.</p>
          </div>
        </template>

      </UTable>
    </UCard>

  </div>
</template>
