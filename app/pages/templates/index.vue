<script setup lang="ts">
interface Template {
  id: string
  name: string
  category: 'initial' | 'follow_up' | 'closing'
  subject: string
  body: string
  variables: string[]
  usedInCampaigns: number
  createdAt: string
  updatedAt: string
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Marina Q2 – Initial Outreach',
    category: 'initial',
    subject: 'Maximize Your Dubai Marina Investment',
    body: `Hi {{first_name}},\n\nI hope this message finds you well. I noticed you own a beautiful unit at {{property_location}}, and given the current market conditions, there may be an excellent opportunity to maximize your rental yield or explore a profitable sale.\n\nOur team specializes in Dubai Marina properties and we have qualified buyers actively looking in your area.\n\nWould you be open to a quick 10-minute call this week?\n\nBest regards,\nDXB PropVault Team`,
    variables: ['{{first_name}}', '{{property_location}}'],
    usedInCampaigns: 3,
    createdAt: '2025-04-10T10:00:00Z',
    updatedAt: '2025-05-02T14:30:00Z',
  },
  {
    id: '2',
    name: 'Downtown Sellers – First Touch',
    category: 'initial',
    subject: 'Your Downtown Dubai Unit – Rental Opportunity',
    body: `Dear {{first_name}},\n\nI'm reaching out regarding your property in Downtown Dubai. With strong rental demand continuing through 2025, your unit could command premium rates this season.\n\nWe offer full property management at competitive rates — from tenant sourcing to maintenance.\n\nWould you be interested in a free rental valuation?\n\nWarm regards,\nDXB PropVault`,
    variables: ['{{first_name}}'],
    usedInCampaigns: 2,
    createdAt: '2025-04-15T10:00:00Z',
    updatedAt: '2025-05-10T09:00:00Z',
  },
  {
    id: '3',
    name: 'Palm Jumeirah VIP Intro',
    category: 'initial',
    subject: 'Exclusive Buyer Interest – {{property_location}}',
    body: `Dear {{full_name}},\n\nWe have a high-net-worth client actively seeking luxury villas on Palm Jumeirah with a budget of AED 15–20M.\n\nGiven your portfolio in the area, I wanted to reach out exclusively before listing anything publicly.\n\nAre you open to a confidential conversation?\n\nBest,\nDXB PropVault`,
    variables: ['{{full_name}}', '{{property_location}}'],
    usedInCampaigns: 1,
    createdAt: '2025-04-01T10:00:00Z',
    updatedAt: '2025-04-12T10:00:00Z',
  },
  {
    id: '4',
    name: 'General Follow-up #1',
    category: 'follow_up',
    subject: 'Following up – {{property_location}} property opportunity',
    body: `Hi {{first_name}},\n\nI wanted to follow up on my previous message about your {{property_location}} unit.\n\nThe market has been moving quickly and I'd hate for you to miss out on a great opportunity. Even a 15-minute conversation could be valuable.\n\nAre you free for a quick call this week?\n\nBest,\nDXB PropVault`,
    variables: ['{{first_name}}', '{{property_location}}'],
    usedInCampaigns: 5,
    createdAt: '2025-03-20T10:00:00Z',
    updatedAt: '2025-05-15T11:00:00Z',
  },
  {
    id: '5',
    name: 'Final Follow-up (Closing)',
    category: 'closing',
    subject: 'Last note – quick question about your {{property_location}} unit',
    body: `Hi {{first_name}},\n\nI'll keep this short — I've reached out a couple of times about your property and don't want to keep bothering you if the timing isn't right.\n\nIf you're ever thinking of selling or renting your {{property_location}} unit, we'd love to help. Just reply to this email and we'll take it from there.\n\nNo pressure at all.\n\nBest,\nDXB PropVault`,
    variables: ['{{first_name}}', '{{property_location}}'],
    usedInCampaigns: 4,
    createdAt: '2025-03-20T10:00:00Z',
    updatedAt: '2025-04-30T16:00:00Z',
  },
  {
    id: '6',
    name: 'JBR Market Update',
    category: 'initial',
    subject: 'JBR Market Update – Your Unit Could Be Worth More',
    body: `Dear {{first_name}},\n\nThe JBR market has seen a 12% appreciation in Q1 2025. Your unit at {{unit_number}} may have increased significantly in value since your last appraisal.\n\nI'd love to share a no-obligation market report — no commitment required.\n\nBest,\nDXB PropVault`,
    variables: ['{{first_name}}', '{{unit_number}}'],
    usedInCampaigns: 1,
    createdAt: '2025-05-01T10:00:00Z',
    updatedAt: '2025-05-18T12:00:00Z',
  },
  {
    id: '7',
    name: 'Tenant Upgrade Program',
    category: 'initial',
    subject: 'Upgrade Your Living – Premium Units Available',
    body: `Hi {{first_name}},\n\nWe have exclusive listings for tenants looking to upgrade their living situation in Dubai's best communities.\n\nWhether you're looking for more space, a better location, or a nicer building, we have options across Dubai Marina, Downtown, JBR, and Business Bay.\n\nInterested in a no-obligation property tour?\n\nBest,\nDXB PropVault`,
    variables: ['{{first_name}}'],
    usedInCampaigns: 1,
    createdAt: '2025-04-18T10:00:00Z',
    updatedAt: '2025-04-18T10:00:00Z',
  },
  {
    id: '8',
    name: 'GCC Remote Investor',
    category: 'initial',
    subject: 'Remote Property Management – Your Dubai Investment',
    body: `Dear {{full_name}},\n\nManaging a Dubai property from {{country}} doesn't have to be stressful. Our remote management service handles everything — tenant screening, rent collection, maintenance coordination, and monthly reporting.\n\nAll accessible from your phone or laptop, no matter where you are.\n\nWould a 15-minute intro call work for you?\n\nBest,\nDXB PropVault`,
    variables: ['{{full_name}}', '{{country}}'],
    usedInCampaigns: 1,
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
  {
    id: '9',
    name: 'Follow-up with Valuation Offer',
    category: 'follow_up',
    subject: 'Free valuation for your {{property_location}} property',
    body: `Hi {{first_name}},\n\nFollowing up with a specific offer: a free, no-obligation valuation for your unit at {{property_location}}.\n\nKnowing your property's current market value takes 24 hours and costs you nothing. It's worth knowing even if you're not planning to sell.\n\nShall I go ahead?\n\nBest,\nDXB PropVault`,
    variables: ['{{first_name}}', '{{property_location}}'],
    usedInCampaigns: 2,
    createdAt: '2025-04-05T10:00:00Z',
    updatedAt: '2025-05-20T09:00:00Z',
  },
]

// ── state ──────────────────────────────────────────────────────────────
const templates = ref(MOCK_TEMPLATES)
const search = ref('')
const categoryFilter = ref('all')
const viewMode = ref<'grid' | 'list'>('grid')

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Initial', value: 'initial' },
  { label: 'Follow-up', value: 'follow_up' },
  { label: 'Closing', value: 'closing' },
]

const filtered = computed(() => {
  let list = templates.value
  if (categoryFilter.value !== 'all') list = list.filter(t => t.category === categoryFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      t.name.toLowerCase().includes(q)
      || t.subject.toLowerCase().includes(q),
    )
  }
  return list
})

// ── helpers ────────────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'info' | 'warning' | 'neutral'

const CAT_COLOR: Record<string, BadgeColor> = {
  initial: 'primary',
  follow_up: 'info',
  closing: 'warning',
}
const CAT_LABEL: Record<string, string> = {
  initial: 'Initial',
  follow_up: 'Follow-up',
  closing: 'Closing',
}

function catColor(c: string): BadgeColor { return (CAT_COLOR[c] ?? 'neutral') as BadgeColor }
function catLabel(c: string): string { return CAT_LABEL[c] ?? c }

function bodyPreview(body: string): string {
  return body.replace(/\n/g, ' ').slice(0, 120) + (body.length > 120 ? '…' : '')
}

function relTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function duplicate(t: Template) {
  const copy: Template = {
    ...t,
    id: `copy-${Date.now()}`,
    name: `${t.name} (copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  templates.value.unshift(copy)
}

function remove(id: string) {
  templates.value = templates.value.filter(t => t.id !== id)
}
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Templates</h1>
        <p class="mt-0.5 text-sm text-muted">{{ templates.length }} email templates</p>
      </div>
      <NuxtLink to="/templates/create">
        <UButton icon="i-lucide-plus">New template</UButton>
      </NuxtLink>
    </div>

    <!-- Filters + view toggle -->
    <div class="flex items-center justify-between gap-4 mb-5">
      <div class="flex items-center gap-3 flex-1">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search templates…"
          class="max-w-xs"
        />
        <div class="flex gap-1">
          <UButton
            v-for="cat in CATEGORIES"
            :key="cat.value"
            size="sm"
            :color="categoryFilter === cat.value ? 'primary' : 'neutral'"
            :variant="categoryFilter === cat.value ? 'solid' : 'ghost'"
            @click="categoryFilter = cat.value"
          >
            {{ cat.label }}
          </UButton>
        </div>
      </div>
      <!-- View mode toggle -->
      <div class="flex items-center gap-1 border border-default rounded-lg p-0.5">
        <UButton
          icon="i-lucide-layout-grid"
          size="xs"
          :color="viewMode === 'grid' ? 'primary' : 'neutral'"
          :variant="viewMode === 'grid' ? 'solid' : 'ghost'"
          @click="viewMode = 'grid'"
        />
        <UButton
          icon="i-lucide-list"
          size="xs"
          :color="viewMode === 'list' ? 'primary' : 'neutral'"
          :variant="viewMode === 'list' ? 'solid' : 'ghost'"
          @click="viewMode = 'list'"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filtered.length === 0" class="py-20 text-center">
      <UIcon name="i-lucide-file-text" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-base font-semibold text-highlighted mb-1">No templates found</p>
      <p class="text-sm text-muted mb-4">
        {{ search || categoryFilter !== 'all' ? 'Try a different search or filter.' : 'Create your first email template.' }}
      </p>
      <NuxtLink v-if="!search && categoryFilter === 'all'" to="/templates/create">
        <UButton icon="i-lucide-plus">New template</UButton>
      </NuxtLink>
    </div>

    <!-- ── GRID VIEW ───────────────────────────────────────────────── -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <UCard
        v-for="t in filtered"
        :key="t.id"
        class="flex flex-col group hover:shadow-md transition-shadow"
      >
        <!-- Card header -->
        <div class="flex items-start justify-between gap-2 mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <UBadge :color="catColor(t.category)" variant="subtle" size="xs">
                {{ catLabel(t.category) }}
              </UBadge>
              <span v-if="t.usedInCampaigns > 0" class="text-xs text-muted">
                Used in {{ t.usedInCampaigns }} campaign{{ t.usedInCampaigns !== 1 ? 's' : '' }}
              </span>
            </div>
            <h3 class="text-sm font-semibold text-highlighted truncate">{{ t.name }}</h3>
          </div>
          <!-- Actions dropdown -->
          <UDropdownMenu
            :items="[[
              { label: 'Edit', icon: 'i-lucide-pencil', to: `/templates/${t.id}` },
              { label: 'Duplicate', icon: 'i-lucide-copy', onSelect: () => duplicate(t) },
              { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => remove(t.id) },
            ]]"
          >
            <UButton
              icon="i-lucide-more-horizontal"
              color="neutral"
              variant="ghost"
              size="xs"
              class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            />
          </UDropdownMenu>
        </div>

        <!-- Subject -->
        <div class="mb-3 px-3 py-2 bg-elevated rounded-lg">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">Subject</p>
          <p class="text-sm text-default font-medium leading-snug">{{ t.subject }}</p>
        </div>

        <!-- Body preview -->
        <p class="text-xs text-muted leading-relaxed flex-1 mb-3">
          {{ bodyPreview(t.body) }}
        </p>

        <!-- Variables -->
        <div v-if="t.variables.length > 0" class="flex flex-wrap gap-1 mb-3">
          <span
            v-for="v in t.variables"
            :key="v"
            class="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono"
          >
            {{ v }}
          </span>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-3 border-t border-default">
          <span class="text-xs text-muted">Updated {{ relTime(t.updatedAt) }}</span>
          <NuxtLink :to="`/templates/${t.id}`">
            <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-pencil">
              Edit
            </UButton>
          </NuxtLink>
        </div>
      </UCard>
    </div>

    <!-- ── LIST VIEW ───────────────────────────────────────────────── -->
    <div v-else class="space-y-2">
      <div
        v-for="t in filtered"
        :key="t.id"
        class="flex items-start gap-4 p-4 rounded-xl border border-default bg-default hover:bg-elevated transition-colors group"
      >
        <!-- Category icon -->
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          :class="{
            'bg-primary/10': t.category === 'initial',
            'bg-info-50': t.category === 'follow_up',
            'bg-warning-50': t.category === 'closing',
          }"
        >
          <UIcon
            :name="t.category === 'initial' ? 'i-lucide-mail' : t.category === 'follow_up' ? 'i-lucide-reply' : 'i-lucide-mail-check'"
            class="w-4.5 h-4.5"
            :class="{
              'text-primary': t.category === 'initial',
              'text-info-600': t.category === 'follow_up',
              'text-warning-600': t.category === 'closing',
            }"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <h3 class="text-sm font-semibold text-highlighted truncate">{{ t.name }}</h3>
            <UBadge :color="catColor(t.category)" variant="subtle" size="xs">{{ catLabel(t.category) }}</UBadge>
          </div>
          <p class="text-xs text-muted truncate">{{ t.subject }}</p>
          <div class="flex items-center gap-3 mt-1.5">
            <div class="flex gap-1">
              <span
                v-for="v in t.variables.slice(0, 3)"
                :key="v"
                class="inline-flex px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono"
              >
                {{ v }}
              </span>
              <span v-if="t.variables.length > 3" class="text-xs text-muted">+{{ t.variables.length - 3 }}</span>
            </div>
            <span class="text-xs text-muted">·</span>
            <span class="text-xs text-muted">{{ t.usedInCampaigns }} campaign{{ t.usedInCampaigns !== 1 ? 's' : '' }}</span>
            <span class="text-xs text-muted">·</span>
            <span class="text-xs text-muted">Updated {{ relTime(t.updatedAt) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <NuxtLink :to="`/templates/${t.id}`">
            <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-pencil">Edit</UButton>
          </NuxtLink>
          <UDropdownMenu
            :items="[[
              { label: 'Duplicate', icon: 'i-lucide-copy', onSelect: () => duplicate(t) },
              { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => remove(t.id) },
            ]]"
          >
            <UButton icon="i-lucide-more-horizontal" color="neutral" variant="ghost" size="xs" />
          </UDropdownMenu>
        </div>
      </div>
    </div>

  </div>
</template>
