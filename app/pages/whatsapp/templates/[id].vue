<script setup lang="ts">
const route = useRoute()
const toast = useToast()

interface WhatsAppTemplate {
  id: string
  name: string
  category: 'marketing' | 'utility' | 'authentication'
  language: 'en' | 'ar'
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  header: { type: 'none' | 'text' | 'image' | 'document'; content: string } | null
  body: string
  footer: string | null
  buttons: Array<{ type: 'quick_reply' | 'url'; text: string; url?: string }>
  variables: Array<{ position: number; field: string; fallback: string }>
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  approvedAt: string | null
  version: number
  parentId: string | null
}

interface VersionEntry {
  version: number
  status: 'approved' | 'rejected' | 'superseded'
  body: string
  createdAt: string
  note: string
}

interface UsageEntry {
  campaignId: string
  campaignName: string
  sentAt: string
  recipients: number
  delivered: number
  read: number
  replied: number
}

const MOCK_TEMPLATES: Record<string, WhatsAppTemplate> = {
  wt1: {
    id: 'wt1',
    name: 'property_selling_intro',
    category: 'marketing',
    language: 'en',
    status: 'approved',
    header: { type: 'text', content: 'Property Opportunity for You' },
    body: 'Hi {{1}}, we noticed you own a property at {{2}} in {{3}}. Are you considering selling? Our team has qualified buyers actively looking in your area.',
    footer: 'DXB PropVault – Dubai\'s Property Experts',
    buttons: [
      { type: 'quick_reply', text: 'Yes, interested' },
      { type: 'quick_reply', text: 'Not right now' },
      { type: 'url', text: 'Learn more', url: 'https://dxbpropvault.com' },
    ],
    variables: [
      { position: 1, field: 'first_name', fallback: 'there' },
      { position: 2, field: 'property_location', fallback: 'your property' },
      { position: 3, field: 'unit_number', fallback: 'Dubai' },
    ],
    rejectionReason: null,
    createdAt: '2025-04-10T08:00:00Z',
    updatedAt: '2025-05-15T10:20:00Z',
    submittedAt: '2025-04-11T09:00:00Z',
    approvedAt: '2025-04-12T14:30:00Z',
    version: 2,
    parentId: 'wt1_v1',
  },
  wt5: {
    id: 'wt5',
    name: 'vip_buyer_interest',
    category: 'marketing',
    language: 'en',
    status: 'pending',
    header: null,
    body: 'Dear {{1}}, we have a high-net-worth buyer interested in properties in {{2}} with a budget of AED {{3}}. Would you be open to a confidential conversation?',
    footer: 'DXB PropVault',
    buttons: [{ type: 'quick_reply', text: 'Yes, tell me more' }, { type: 'quick_reply', text: 'Not interested' }],
    variables: [
      { position: 1, field: 'full_name', fallback: 'Property Owner' },
      { position: 2, field: 'property_location', fallback: 'Dubai' },
      { position: 3, field: 'property_value', fallback: '15–20M' },
    ],
    rejectionReason: null,
    createdAt: '2025-06-01T11:00:00Z',
    updatedAt: '2025-06-01T11:45:00Z',
    submittedAt: '2025-06-01T12:00:00Z',
    approvedAt: null,
    version: 1,
    parentId: null,
  },
  wt7: {
    id: 'wt7',
    name: 'follow_up_no_response',
    category: 'marketing',
    language: 'en',
    status: 'draft',
    header: null,
    body: 'Hi {{1}}, just following up on our previous message about your {{2}} property. Even a quick 5-minute call could be valuable. Are you free this week?',
    footer: null,
    buttons: [],
    variables: [
      { position: 1, field: 'first_name', fallback: 'there' },
      { position: 2, field: 'property_location', fallback: 'your' },
    ],
    rejectionReason: null,
    createdAt: '2025-06-05T14:00:00Z',
    updatedAt: '2025-06-05T15:00:00Z',
    submittedAt: null,
    approvedAt: null,
    version: 1,
    parentId: null,
  },
  wt8: {
    id: 'wt8',
    name: 'document_request',
    category: 'utility',
    language: 'en',
    status: 'rejected',
    header: null,
    body: 'Hi {{1}}, to proceed with the property listing, we need the following documents: {{2}}. Please reply to confirm or call us at {{3}}.',
    footer: 'DXB PropVault',
    buttons: [{ type: 'quick_reply', text: 'I\'ll send them' }],
    variables: [
      { position: 1, field: 'first_name', fallback: 'there' },
      { position: 2, field: 'custom', fallback: 'title deed, passport copy' },
      { position: 3, field: 'custom', fallback: '+971 4 XXX XXXX' },
    ],
    rejectionReason: 'Template contains a phone number variable ({{3}}) which must be a static value or removed. Utility templates with dynamic phone numbers are not permitted. Please replace with a fixed contact number.',
    createdAt: '2025-05-18T10:00:00Z',
    updatedAt: '2025-05-20T12:00:00Z',
    submittedAt: '2025-05-19T09:00:00Z',
    approvedAt: null,
    version: 1,
    parentId: null,
  },
}

const MOCK_VERSIONS: Record<string, VersionEntry[]> = {
  wt1: [
    {
      version: 1,
      status: 'superseded',
      body: 'Hi {{1}}, we noticed you own a unit at {{2}}. Are you considering selling?',
      createdAt: '2025-04-10T08:00:00Z',
      note: 'Initial version — simplified body',
    },
    {
      version: 2,
      status: 'approved',
      body: 'Hi {{1}}, we noticed you own a property at {{2}} in {{3}}. Are you considering selling? Our team has qualified buyers actively looking in your area.',
      createdAt: '2025-05-10T09:00:00Z',
      note: 'Added city variable and expanded body for better context',
    },
  ],
}

const MOCK_USAGE: Record<string, UsageEntry[]> = {
  wt1: [
    { campaignId: 'c1', campaignName: 'Dubai Marina Q2 Sellers', sentAt: '2025-05-20T08:00:00Z', recipients: 4200, delivered: 4105, read: 2980, replied: 312 },
    { campaignId: 'c3', campaignName: 'Downtown Sellers June', sentAt: '2025-06-01T09:00:00Z', recipients: 3800, delivered: 3712, read: 2540, replied: 198 },
    { campaignId: 'c5', campaignName: 'JBR Premium Owners', sentAt: '2025-06-05T08:30:00Z', recipients: 1950, delivered: 1901, read: 1310, replied: 88 },
  ],
}

const SAMPLE_VALUES: Record<string, string> = {
  first_name: 'Ahmed',
  full_name: 'Ahmed Al-Rashidi',
  email: 'ahmed@gmail.com',
  property_location: 'Dubai Marina',
  unit_number: '2204',
  property_value: '2,800,000',
  country: 'UAE',
  custom: 'Sample value',
}

const id = route.params.id as string
const template = MOCK_TEMPLATES[id]
const notFound = !template

const activeTab = ref('details')
const tabs = [
  { label: 'Details', value: 'details' },
  { label: 'Version History', value: 'versions' },
  { label: 'Usage History', value: 'usage' },
]

type StatusColor = 'success' | 'warning' | 'neutral' | 'error'
function statusColor(s: string): StatusColor {
  return s === 'approved' ? 'success' : s === 'pending' ? 'warning' : s === 'rejected' ? 'error' : 'neutral'
}

function resolvedBody(body: string, vars: WhatsAppTemplate['variables']): string {
  let result = body
  for (const v of vars) {
    const sample = v.fallback || SAMPLE_VALUES[v.field] || v.field
    result = result.replaceAll(`{{${v.position}}}`, sample)
  }
  return result
}

const previewBodyText = computed(() =>
  template ? resolvedBody(template.body, template.variables) : ''
)

const previewHeaderText = computed(() =>
  template?.header?.type === 'text'
    ? resolvedBody(template.header.content, template.variables)
    : ''
)

const versions = computed(() => MOCK_VERSIONS[id] ?? [])
const usage = computed(() => MOCK_USAGE[id] ?? [])

function submitForApproval() {
  if (!template) return
  template.status = 'pending'
  template.submittedAt = new Date().toISOString()
  toast.add({ title: 'Submitted for approval', description: 'Meta usually reviews templates within 24–48 hours.', color: 'info', icon: 'i-lucide-send' })
}

function duplicate() {
  if (!template) return
  toast.add({ title: 'Template duplicated', description: `"${template.name}_copy" created as a new draft.`, color: 'success', icon: 'i-lucide-copy' })
}
</script>

<template>
  <div class="px-6 py-8 max-w-6xl mx-auto">

    <!-- Back -->
    <NuxtLink to="/whatsapp/templates" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to templates
    </NuxtLink>

    <!-- Not found -->
    <div v-if="notFound" class="text-center py-24">
      <UIcon name="i-lucide-message-circle-off" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-lg font-semibold text-highlighted mb-1">Template not found</p>
      <NuxtLink to="/whatsapp/templates" class="text-sm text-primary hover:underline">Back to templates</NuxtLink>
    </div>

    <template v-else>

      <!-- Header -->
      <div class="flex items-start justify-between mb-6 gap-4">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-2xl font-semibold text-highlighted font-mono">{{ template.name }}</h1>
            <UBadge :color="statusColor(template.status)" variant="subtle" class="capitalize">
              {{ template.status }}
            </UBadge>
            <UBadge color="neutral" variant="outline" size="sm">v{{ template.version }}</UBadge>
          </div>
          <p class="text-sm text-muted capitalize">
            {{ template.category }} · {{ template.language === 'en' ? 'English' : 'Arabic' }}
            <span v-if="template.approvedAt"> · Approved {{ new Date(template.approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
            <span v-else-if="template.submittedAt"> · Submitted {{ new Date(template.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton color="neutral" variant="subtle" icon="i-lucide-copy" size="sm" @click="duplicate">Duplicate</UButton>
          <NuxtLink v-if="template.status === 'draft' || template.status === 'rejected'" to="/whatsapp/templates/create">
            <UButton icon="i-lucide-pencil" color="neutral" variant="subtle" size="sm">Edit</UButton>
          </NuxtLink>
          <UButton
            v-if="template.status === 'draft'"
            icon="i-lucide-send"
            size="sm"
            @click="submitForApproval"
          >
            Submit for Approval
          </UButton>
        </div>
      </div>

      <!-- Rejection alert -->
      <div v-if="template.status === 'rejected' && template.rejectionReason" class="mb-6 flex gap-3 bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800 rounded-xl px-4 py-3">
        <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-error-500 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-error-700 dark:text-error-400 mb-0.5">Meta rejected this template</p>
          <p class="text-sm text-error-600 dark:text-error-300">{{ template.rejectionReason }}</p>
          <NuxtLink to="/whatsapp/templates/create" class="inline-flex items-center gap-1 text-xs text-error-600 dark:text-error-400 font-medium mt-1.5 hover:underline">
            <UIcon name="i-lucide-edit" class="w-3 h-3" />
            Edit and resubmit
          </NuxtLink>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-0 border-b border-default mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
          :class="activeTab === tab.value
            ? 'border-primary text-primary'
            : 'border-transparent text-muted hover:text-highlighted'"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- DETAILS TAB -->
      <div v-if="activeTab === 'details'" class="grid grid-cols-1 xl:grid-cols-5 gap-6">

        <!-- Left: template info -->
        <div class="xl:col-span-3 space-y-5">

          <!-- Header -->
          <UCard v-if="template.header && template.header.type !== 'none'" class="space-y-2">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Header</p>
            <div v-if="template.header.type === 'text'" class="text-sm font-semibold text-highlighted">{{ template.header.content }}</div>
            <div v-else class="flex items-center gap-2 text-sm text-muted">
              <UIcon :name="template.header.type === 'image' ? 'i-lucide-image' : 'i-lucide-file-text'" class="w-4 h-4" />
              <span class="capitalize">{{ template.header.type }}</span>
            </div>
          </UCard>

          <!-- Body -->
          <UCard class="space-y-3">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Body</p>
            <p class="text-sm text-default leading-relaxed whitespace-pre-wrap">{{ template.body }}</p>
          </UCard>

          <!-- Footer -->
          <UCard v-if="template.footer" class="space-y-2">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Footer</p>
            <p class="text-sm text-muted">{{ template.footer }}</p>
          </UCard>

          <!-- Buttons -->
          <UCard v-if="template.buttons.length > 0" class="space-y-3">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Buttons</p>
            <div class="space-y-2">
              <div v-for="(btn, i) in template.buttons" :key="i" class="flex items-center gap-3 px-3 py-2 bg-elevated rounded-lg border border-default">
                <UBadge :color="btn.type === 'url' ? 'info' : 'neutral'" variant="subtle" size="xs" class="capitalize shrink-0">
                  {{ btn.type === 'quick_reply' ? 'Quick reply' : 'URL' }}
                </UBadge>
                <span class="text-sm text-default font-medium">{{ btn.text }}</span>
                <span v-if="btn.url" class="text-xs text-muted truncate ml-auto">{{ btn.url }}</span>
              </div>
            </div>
          </UCard>

          <!-- Variables -->
          <UCard v-if="template.variables.length > 0" class="space-y-3">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Variable mapping</p>
            <div class="bg-elevated rounded-lg overflow-hidden border border-default">
              <div class="grid grid-cols-3 px-3 py-2 border-b border-default text-xs font-semibold text-muted uppercase tracking-wide">
                <span>Variable</span>
                <span>Contact field</span>
                <span>Fallback</span>
              </div>
              <div v-for="v in template.variables" :key="v.position" class="grid grid-cols-3 px-3 py-2 border-b border-default last:border-0 text-sm">
                <span class="font-mono text-primary font-semibold">&#123;&#123;{{ v.position }}&#125;&#125;</span>
                <span class="text-default capitalize">{{ v.field.replace('_', ' ') }}</span>
                <span class="text-muted">{{ v.fallback || '—' }}</span>
              </div>
            </div>
          </UCard>

        </div>

        <!-- Right: phone mockup -->
        <div class="xl:col-span-2">
          <div class="sticky top-8">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-3 text-center">Preview with sample data</p>
            <div class="mx-auto" style="max-width: 280px;">
              <div class="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border-4 border-gray-700">
                <div class="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full z-10" />
                <div class="bg-[#0b1320] rounded-[2rem] overflow-hidden" style="min-height: 520px;">
                  <div class="bg-[#1f2c34] px-3 pt-8 pb-3 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white text-xs font-bold shrink-0">WA</div>
                    <div>
                      <p class="text-white text-xs font-semibold">DXB PropVault</p>
                      <p class="text-[#8696a0] text-[10px]">Business Account</p>
                    </div>
                  </div>
                  <div class="bg-[#0d1b23] p-3 space-y-2" style="min-height: 400px;">
                    <div class="text-center">
                      <span class="text-[#8696a0] text-[10px] bg-[#1f2c34] px-2 py-0.5 rounded-full">Today</span>
                    </div>
                    <div class="flex justify-end">
                      <div class="bg-[#005c4b] text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm">
                        <div v-if="previewHeaderText" class="font-bold text-[11px] mb-1.5">{{ previewHeaderText }}</div>
                        <div v-else-if="template.header?.type === 'image'" class="bg-[#004438] rounded-lg h-16 flex items-center justify-center mb-2">
                          <UIcon name="i-lucide-image" class="w-5 h-5 text-[#8696a0]" />
                        </div>
                        <p class="text-[11px] leading-relaxed whitespace-pre-wrap break-words">{{ previewBodyText }}</p>
                        <p v-if="template.footer" class="text-[#8696a0] text-[9px] mt-1">{{ template.footer }}</p>
                        <div class="flex justify-end mt-1">
                          <span class="text-[#8696a0] text-[9px]">10:42 AM ✓✓</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="template.buttons.length > 0" class="flex flex-col gap-1">
                      <button
                        v-for="btn in template.buttons"
                        :key="btn.text"
                        class="w-full text-center text-[10px] text-[#53bdeb] bg-[#1f2c34] rounded-lg py-1.5 px-2 border border-[#2a3942]"
                      >
                        <UIcon v-if="btn.type === 'url'" name="i-lucide-external-link" class="w-2.5 h-2.5 inline mr-1" />
                        {{ btn.text }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- VERSION HISTORY TAB -->
      <div v-else-if="activeTab === 'versions'" class="max-w-2xl">
        <div v-if="versions.length === 0" class="text-center py-16 text-muted">
          <UIcon name="i-lucide-history" class="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p class="text-sm">No version history for this template.</p>
        </div>
        <div v-else class="space-y-4">
          <div v-for="v in versions" :key="v.version" class="bg-default border border-default rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-sm text-highlighted">Version {{ v.version }}</span>
                <UBadge :color="statusColor(v.status)" variant="subtle" size="sm" class="capitalize">{{ v.status }}</UBadge>
              </div>
              <span class="text-xs text-muted">{{ new Date(v.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
            </div>
            <p class="text-xs text-muted mb-2 italic">{{ v.note }}</p>
            <div class="bg-elevated rounded-lg px-3 py-2.5 border border-default">
              <p class="text-xs text-default leading-relaxed">{{ v.body }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- USAGE HISTORY TAB -->
      <div v-else-if="activeTab === 'usage'">
        <div v-if="usage.length === 0" class="text-center py-16 text-muted">
          <UIcon name="i-lucide-bar-chart-2" class="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p class="text-sm">This template hasn't been used in any campaigns yet.</p>
          <p v-if="template.status !== 'approved'" class="text-xs text-muted mt-1">Template must be approved before use in campaigns.</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="u in usage" :key="u.campaignId" class="bg-default border border-default rounded-xl px-4 py-4">
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-semibold text-highlighted">{{ u.campaignName }}</p>
              <span class="text-xs text-muted">{{ new Date(u.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div class="text-center">
                <p class="text-xl font-bold text-highlighted">{{ u.recipients.toLocaleString() }}</p>
                <p class="text-xs text-muted">Sent</p>
              </div>
              <div class="text-center">
                <p class="text-xl font-bold text-highlighted">{{ u.delivered.toLocaleString() }}</p>
                <p class="text-xs text-muted">Delivered</p>
                <p class="text-xs text-success-600">{{ Math.round(u.delivered / u.recipients * 100) }}%</p>
              </div>
              <div class="text-center">
                <p class="text-xl font-bold text-highlighted">{{ u.read.toLocaleString() }}</p>
                <p class="text-xs text-muted">Read</p>
                <p class="text-xs text-info-600">{{ Math.round(u.read / u.recipients * 100) }}%</p>
              </div>
              <div class="text-center">
                <p class="text-xl font-bold text-highlighted">{{ u.replied.toLocaleString() }}</p>
                <p class="text-xs text-muted">Replied</p>
                <p class="text-xs text-primary">{{ Math.round(u.replied / u.recipients * 100) }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>
