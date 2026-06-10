<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

interface WhatsAppTemplate {
  id: string
  name: string
  category: 'marketing' | 'utility' | 'authentication'
  language: 'en' | 'ar'
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  body: string
  updatedAt: string
  version: number
}

const MOCK_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'wt1',
    name: 'property_selling_intro',
    category: 'marketing',
    language: 'en',
    status: 'approved',
    body: 'Hi {{1}}, we noticed you own a property at {{2}} in {{3}}. Are you considering selling? Our team has qualified buyers actively looking in your area.',
    updatedAt: '2025-05-15T10:20:00Z',
    version: 2,
  },
  {
    id: 'wt2',
    name: 'rental_yield_check',
    category: 'marketing',
    language: 'en',
    status: 'approved',
    body: 'Dear {{1}}, the rental market in {{2}} has seen strong growth. Your unit could command AED {{3}}/year. Would you like a free rental valuation?',
    updatedAt: '2025-05-10T08:00:00Z',
    version: 1,
  },
  {
    id: 'wt3',
    name: 'otp_verification',
    category: 'authentication',
    language: 'en',
    status: 'approved',
    body: 'Your DXB PropVault verification code is {{1}}. This code expires in 10 minutes. Do not share it with anyone.',
    updatedAt: '2025-04-22T14:30:00Z',
    version: 1,
  },
  {
    id: 'wt4',
    name: 'appointment_reminder',
    category: 'utility',
    language: 'en',
    status: 'approved',
    body: 'Hi {{1}}, this is a reminder about your property viewing at {{2}} tomorrow at {{3}}. Reply YES to confirm or NO to reschedule.',
    updatedAt: '2025-05-01T09:00:00Z',
    version: 1,
  },
  {
    id: 'wt5',
    name: 'vip_buyer_interest',
    category: 'marketing',
    language: 'en',
    status: 'pending',
    body: 'Dear {{1}}, we have a high-net-worth buyer interested in properties in {{2}} with a budget of AED {{3}}. Would you be open to a confidential conversation?',
    updatedAt: '2025-06-01T11:45:00Z',
    version: 1,
  },
  {
    id: 'wt6',
    name: 'market_update_arabic',
    category: 'marketing',
    language: 'ar',
    status: 'pending',
    body: 'مرحباً {{1}}، شهد سوق {{2}} ارتفاعاً بنسبة 12% في الربع الأول من 2025. قد تكون قيمة وحدتك قد ارتفعت بشكل ملحوظ. هل تودّ تقييماً مجانياً؟',
    updatedAt: '2025-06-02T07:30:00Z',
    version: 1,
  },
  {
    id: 'wt7',
    name: 'follow_up_no_response',
    category: 'marketing',
    language: 'en',
    status: 'draft',
    body: 'Hi {{1}}, just following up on our previous message about your {{2}} property. Even a quick 5-minute call could be valuable. Are you free this week?',
    updatedAt: '2025-06-05T15:00:00Z',
    version: 1,
  },
  {
    id: 'wt8',
    name: 'document_request',
    category: 'utility',
    language: 'en',
    status: 'rejected',
    body: 'Hi {{1}}, to proceed with the property listing, we need the following documents: {{2}}. Please reply to confirm or call us at {{3}}.',
    updatedAt: '2025-05-20T12:00:00Z',
    version: 1,
  },
]

const search = ref('')
const statusFilter = ref<string>('all')
const categoryFilter = ref<string>('all')

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
  { label: 'Draft', value: 'draft' },
  { label: 'Rejected', value: 'rejected' },
]

const categoryOptions = [
  { label: 'All categories', value: 'all' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Utility', value: 'utility' },
  { label: 'Authentication', value: 'authentication' },
]

const filtered = computed(() => {
  let list = MOCK_TEMPLATES
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t => t.name.includes(q) || t.body.toLowerCase().includes(q))
  }
  if (statusFilter.value !== 'all') list = list.filter(t => t.status === statusFilter.value)
  if (categoryFilter.value !== 'all') list = list.filter(t => t.category === categoryFilter.value)
  return list
})

type StatusColor = 'success' | 'warning' | 'neutral' | 'error'
function statusColor(s: WhatsAppTemplate['status']): StatusColor {
  return s === 'approved' ? 'success' : s === 'pending' ? 'warning' : s === 'rejected' ? 'error' : 'neutral'
}

function categoryLabel(c: WhatsAppTemplate['category']) {
  return c === 'marketing' ? 'Marketing' : c === 'utility' ? 'Utility' : 'Authentication'
}

const columns: ColumnDef<WhatsAppTemplate>[] = [
  { accessorKey: 'name', header: 'Template name' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'language', header: 'Language' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'body', header: 'Body preview' },
  { accessorKey: 'updatedAt', header: 'Last updated' },
  { accessorKey: 'actions', header: '' },
]

const toast = useToast()

function duplicate(t: WhatsAppTemplate) {
  toast.add({ title: 'Template duplicated', description: `"${t.name}_copy" created as draft.`, color: 'success', icon: 'i-lucide-copy' })
}

function submitForApproval(t: WhatsAppTemplate) {
  t.status = 'pending'
  toast.add({ title: 'Submitted for approval', description: `"${t.name}" sent to Meta for review.`, color: 'info', icon: 'i-lucide-send' })
}
</script>

<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">WhatsApp Templates</h1>
        <p class="text-sm text-muted mt-0.5">Manage Meta-approved message templates for WhatsApp outreach</p>
      </div>
      <NuxtLink to="/whatsapp/templates/create">
        <UButton icon="i-lucide-plus" color="primary">New Template</UButton>
      </NuxtLink>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div
        v-for="stat in [
          { label: 'Approved', count: MOCK_TEMPLATES.filter(t => t.status === 'approved').length, color: 'text-success-600' },
          { label: 'Pending Review', count: MOCK_TEMPLATES.filter(t => t.status === 'pending').length, color: 'text-warning-600' },
          { label: 'Draft', count: MOCK_TEMPLATES.filter(t => t.status === 'draft').length, color: 'text-muted' },
          { label: 'Rejected', count: MOCK_TEMPLATES.filter(t => t.status === 'rejected').length, color: 'text-error-600' },
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
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search templates…"
        class="w-64"
      />
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        value-key="value"
        label-key="label"
        class="w-44"
      />
      <USelect
        v-model="categoryFilter"
        :items="categoryOptions"
        value-key="value"
        label-key="label"
        class="w-44"
      />
      <span class="text-sm text-muted ml-auto">{{ filtered.length }} template{{ filtered.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Table -->
    <UCard class="overflow-hidden p-0">
      <UTable :data="filtered" :columns="columns">

        <template #name-cell="{ row }">
          <NuxtLink :to="`/whatsapp/templates/${row.original.id}`" class="font-mono text-sm text-primary hover:underline">
            {{ row.original.name }}
          </NuxtLink>
          <p class="text-xs text-muted mt-0.5">v{{ row.original.version }}</p>
        </template>

        <template #category-cell="{ row }">
          <span class="text-sm text-default">{{ categoryLabel(row.original.category) }}</span>
        </template>

        <template #language-cell="{ row }">
          <span class="text-sm font-medium text-default uppercase">{{ row.original.language }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #body-cell="{ row }">
          <p class="text-sm text-muted max-w-xs truncate">{{ row.original.body }}</p>
        </template>

        <template #updatedAt-cell="{ row }">
          <span class="text-sm text-muted">{{ new Date(row.original.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <NuxtLink :to="`/whatsapp/templates/${row.original.id}`">
              <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" title="Edit" />
            </NuxtLink>
            <UButton icon="i-lucide-copy" color="neutral" variant="ghost" size="xs" title="Duplicate" @click="duplicate(row.original)" />
            <UButton
              v-if="row.original.status === 'draft'"
              icon="i-lucide-send"
              color="neutral"
              variant="ghost"
              size="xs"
              title="Submit for approval"
              @click="submitForApproval(row.original)"
            />
          </div>
        </template>

      </UTable>
    </UCard>

  </div>
</template>
