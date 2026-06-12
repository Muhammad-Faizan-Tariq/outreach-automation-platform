<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ContactDetail, Property } from '~/composables/useContacts'

const route = useRoute()
const { getContact } = useContacts()

const contact = ref<ContactDetail | null>(null)
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  try {
    contact.value = await getContact(route.params.id as string)
  }
  catch (e: any) {
    if (e?.status === 404 || e?.statusCode === 404) notFound.value = true
  }
  finally {
    loading.value = false
  }
})

const propertyColumns: TableColumn<Property>[] = [
  { accessorKey: 'location', header: 'Location' },
  { accessorKey: 'project_name', header: 'Project' },
  { accessorKey: 'unit_number', header: 'Unit' },
  { accessorKey: 'rooms', header: 'Rooms' },
  { id: 'size', header: 'Size (sqft)' },
  { id: 'value', header: 'Value' },
]

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const STATUS_COLOR: Record<string, BadgeColor> = {
  active: 'success',
  unsubscribed: 'neutral',
  bounced: 'error',
  complained: 'warning',
  do_not_contact: 'error',
  deleted: 'neutral',
}
const TYPE_COLOR: Record<string, BadgeColor> = {
  owner: 'primary',
  tenant: 'info',
  lead: 'neutral',
}

function typeColor(t: string): BadgeColor { return (TYPE_COLOR[t] ?? 'neutral') as BadgeColor }
function statusColor(s: string): BadgeColor { return (STATUS_COLOR[s] ?? 'neutral') as BadgeColor }

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtNum(n: string | null, currency: string) {
  if (!n) return '—'
  return `${Number(n).toLocaleString()} ${currency}`
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-8">

    <!-- Back -->
    <NuxtLink
      to="/contacts"
      class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to contacts
    </NuxtLink>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="h-8 w-64 bg-elevated rounded-lg animate-pulse" />
      <div class="h-48 bg-elevated rounded-xl animate-pulse" />
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="text-center py-24">
      <UIcon name="i-lucide-user-x" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-lg font-semibold text-highlighted mb-1">Contact not found</p>
      <NuxtLink to="/contacts" class="text-sm text-primary hover:underline">Return to contacts</NuxtLink>
    </div>

    <template v-else-if="contact">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-highlighted">{{ contact.full_name ?? contact.email }}</h1>
          <p class="mt-0.5 text-sm text-muted">{{ contact.email }}</p>
        </div>
        <div class="flex items-center gap-2">
          <UBadge :color="typeColor(contact.contact_type)" variant="subtle" class="capitalize">
            {{ contact.contact_type }}
          </UBadge>
          <UBadge :color="statusColor(contact.status)" variant="subtle" class="capitalize">
            {{ contact.status.replace('_', ' ') }}
          </UBadge>
        </div>
      </div>

      <!-- Info grid -->
      <UCard class="mb-6">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
          <div>
            <p class="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Country</p>
            <p class="text-sm text-default">{{ contact.country ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Language</p>
            <p class="text-sm text-default uppercase">{{ contact.language }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Added</p>
            <p class="text-sm text-default">{{ fmt(contact.created_at) }}</p>
          </div>
          <div v-if="contact.mobile1">
            <p class="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Mobile</p>
            <p class="text-sm text-default font-mono">{{ contact.mobile1 }}</p>
          </div>
          <div v-if="contact.mobile2">
            <p class="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Mobile 2</p>
            <p class="text-sm text-default font-mono">{{ contact.mobile2 }}</p>
          </div>
          <div v-if="contact.mobile3">
            <p class="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Mobile 3</p>
            <p class="text-sm text-default font-mono">{{ contact.mobile3 }}</p>
          </div>
        </div>
      </UCard>

      <!-- Email stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <UCard class="text-center">
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Emails Sent</p>
          <p class="text-3xl font-semibold text-highlighted tabular-nums">{{ contact.total_emails_sent }}</p>
        </UCard>
        <UCard class="text-center">
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Replies</p>
          <p class="text-3xl font-semibold text-success-600 tabular-nums">{{ contact.total_replies }}</p>
        </UCard>
        <UCard class="text-center">
          <p class="text-xs text-muted uppercase tracking-wide mb-1">Last Contacted</p>
          <p class="text-sm font-semibold text-highlighted mt-2">{{ fmt(contact.last_contacted_at) }}</p>
        </UCard>
      </div>

      <!-- Properties -->
      <div>
        <h2 class="text-base font-semibold text-highlighted mb-3">
          Properties
          <span class="ml-1.5 text-sm font-normal text-muted">({{ contact.properties.length }})</span>
        </h2>

        <div v-if="contact.properties.length === 0" class="text-sm text-muted py-6 text-center">
          No properties linked to this contact.
        </div>

        <UCard v-else :ui="{ body: 'p-0' }">
          <UTable :data="contact.properties" :columns="propertyColumns">
            <template #location-cell="{ row }">
              <span class="text-sm font-medium text-default">{{ row.original.location }}</span>
            </template>
            <template #project_name-cell="{ row }">
              <span class="text-sm text-muted">{{ row.original.project_name ?? '—' }}</span>
            </template>
            <template #unit_number-cell="{ row }">
              <span class="text-sm text-muted font-mono">{{ row.original.unit_number ?? '—' }}</span>
            </template>
            <template #rooms-cell="{ row }">
              <span class="text-sm text-muted tabular-nums">{{ row.original.rooms ?? '—' }}</span>
            </template>
            <template #size-cell="{ row }">
              <span class="text-sm text-muted tabular-nums">
                {{ row.original.size_sqft ? Number(row.original.size_sqft).toLocaleString() : '—' }}
              </span>
            </template>
            <template #value-cell="{ row }">
              <span class="text-sm text-muted tabular-nums">
                {{ fmtNum(row.original.transaction_value, row.original.currency) }}
              </span>
            </template>
          </UTable>
        </UCard>
      </div>
    </template>

  </div>
</template>
