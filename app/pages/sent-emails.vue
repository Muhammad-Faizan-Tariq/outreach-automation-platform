<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface SentEmail {
  id: string
  to: string
  toName: string
  subject: string
  body: string
  campaign: string
  inbox: string
  status: 'delivered' | 'opened' | 'replied' | 'bounced' | 'failed'
  openCount: number
  sentAt: string
  openedAt: string | null
  repliedAt: string | null
  step: number
}

const MOCK: SentEmail[] = [
  {
    id: 'e1', to: 'ahmed.alrashidi@gmail.com', toName: 'Ahmed Al-Rashidi',
    subject: 'Maximize Your Dubai Marina Investment',
    body: `Hi Ahmed,\n\nI hope this message finds you well. I noticed you own a beautiful 2BR unit at Marina Gate Tower 1, and given the current market conditions, there may be an excellent opportunity to maximize your rental yield or explore a profitable sale.\n\nOur team specializes in Dubai Marina properties and we have qualified buyers actively looking in your area. Units in your building have recently transacted between AED 2.6M – AED 3.1M, with rental yields of 5.8–6.5%.\n\nWould you be open to a quick 10-minute call this week? There's absolutely no obligation — just a brief conversation to see if there's an opportunity worth exploring.\n\nBest regards,\nDXB PropVault Team`,
    campaign: 'Marina Q2 Outreach', inbox: 'outreach1@dxbpropvault.com', status: 'replied', openCount: 3,
    sentAt: '2025-06-08T10:00:00Z', openedAt: '2025-06-08T14:22:00Z', repliedAt: '2025-06-09T08:22:00Z', step: 1,
  },
  {
    id: 'e2', to: 'sara.almansoori@outlook.com', toName: 'Sara Al-Mansoori',
    subject: 'Your Downtown Dubai Unit – Rental Opportunity',
    body: `Dear Sara,\n\nI'm reaching out regarding your property in Downtown Dubai. With strong rental demand continuing through 2025, your unit could command premium rates this season.\n\nWe offer full property management at competitive rates — from tenant sourcing to maintenance, including:\n• Professional photography and listing\n• Tenant vetting and contracts\n• Rent collection and quarterly reporting\n• 24/7 maintenance coordination\n\nWould you be interested in a free rental valuation? We can have an estimate to you within 24 hours.\n\nWarm regards,\nDXB PropVault`,
    campaign: 'Downtown Sellers Q2', inbox: 'outreach2@dxbpropvault.com', status: 'replied', openCount: 2,
    sentAt: '2025-06-08T14:30:00Z', openedAt: '2025-06-09T07:30:00Z', repliedAt: '2025-06-09T07:45:00Z', step: 1,
  },
  {
    id: 'e3', to: 'khalid.hassan@gmail.com', toName: 'Khalid Hassan',
    subject: 'Maximize Your Dubai Marina Investment',
    body: `Hi Khalid,\n\nI hope you're doing well. I'm reaching out about your property in Dubai Marina — the market has seen strong activity recently and I wanted to make sure you're aware of the opportunities available.\n\nWe currently have qualified buyers actively seeking properties in your area, and I'd love to share what similar units have been achieving.\n\nWould you be open to a brief conversation this week?\n\nBest,\nDXB PropVault Team`,
    campaign: 'Marina Q2 Outreach', inbox: 'outreach1@dxbpropvault.com', status: 'opened', openCount: 1,
    sentAt: '2025-06-08T10:05:00Z', openedAt: '2025-06-08T18:10:00Z', repliedAt: null, step: 1,
  },
  {
    id: 'e4', to: 'fatima.alali@yahoo.com', toName: 'Fatima Al-Ali',
    subject: 'Maximize Your Dubai Marina Investment',
    body: `Hi Fatima,\n\nI hope this message finds you well. I noticed you own a property in Dubai Marina and I wanted to reach out with some market insights.\n\nThe Marina market has been performing exceptionally well in 2025, with prices up 9% year-to-date. Your unit's value may have appreciated significantly since purchase.\n\nWould you be interested in a free market valuation?\n\nBest regards,\nDXB PropVault Team`,
    campaign: 'Marina Q2 Outreach', inbox: 'outreach3@dxbpropvault.com', status: 'delivered', openCount: 0,
    sentAt: '2025-06-09T08:00:00Z', openedAt: null, repliedAt: null, step: 1,
  },
  {
    id: 'e5', to: 'hind.alqasimi@outlook.com', toName: 'Hind Al-Qasimi',
    subject: 'JBR Market Update – Your Unit Could Be Worth More',
    body: `Dear Hind,\n\nThe JBR market has seen a 12% appreciation in Q1 2025. Your unit's value may have increased significantly since purchase.\n\nWith tourist and residential demand at record highs in JBR, we're seeing strong buyer interest at premium prices. 2BR units similar to yours are currently transacting at AED 2.8M–3.4M.\n\nI'd love to share a no-obligation market appraisal — no commitment required, just a detailed picture of what your property could achieve today.\n\nBest,\nDXB PropVault`,
    campaign: 'JBR Investor Outreach', inbox: 'outreach4@dxbpropvault.com', status: 'replied', openCount: 2,
    sentAt: '2025-06-08T09:00:00Z', openedAt: '2025-06-08T11:00:00Z', repliedAt: '2025-06-09T06:55:00Z', step: 1,
  },
  {
    id: 'e6', to: 'sultan.almanei@outlook.com', toName: 'Sultan Al-Manei',
    subject: 'Your Downtown Dubai Portfolio – Rental Analysis',
    body: `Dear Sultan,\n\nWith 6 properties in your portfolio, you're in an excellent position to optimize your rental income strategy across Downtown Dubai.\n\nWe've prepared a portfolio-level analysis that looks at:\n• Current rental yields vs. market benchmark\n• Vacancy optimization opportunities\n• Short-term vs. long-term rental comparisons\n• Tax and yield structuring considerations\n\nI'd like to share this analysis with you — it could identify significant upside you may not be aware of.\n\nAre you available for a 20-minute call this week?\n\nBest,\nDXB PropVault`,
    campaign: 'Downtown Sellers Q2', inbox: 'outreach2@dxbpropvault.com', status: 'replied', openCount: 4,
    sentAt: '2025-06-06T10:00:00Z', openedAt: '2025-06-06T13:00:00Z', repliedAt: '2025-06-07T14:20:00Z', step: 1,
  },
  {
    id: 'e7', to: 'nadia.karim@hotmail.com', toName: 'Nadia Karim',
    subject: 'Maximize Your Dubai Marina Investment',
    body: `Hi Nadia,\n\nI hope you're doing well. I'm reaching out about your properties in Dubai Marina — the market has been particularly active and we have some exciting opportunities for property owners in your area.\n\nWe've recently closed several successful deals in your building and have a pipeline of qualified buyers still looking.\n\nCould we connect briefly this week — just 10 minutes to share what's happening in the market?\n\nBest,\nDXB PropVault`,
    campaign: 'Marina Q2 Outreach', inbox: 'outreach1@dxbpropvault.com', status: 'replied', openCount: 1,
    sentAt: '2025-06-07T15:00:00Z', openedAt: '2025-06-07T17:00:00Z', repliedAt: '2025-06-08T11:30:00Z', step: 1,
  },
  {
    id: 'e8', to: 'hassan.ibrahim@gmail.com', toName: 'Hassan Ibrahim',
    subject: 'Maximize Your Dubai Marina Investment',
    body: `Hi Hassan,\n\nI'm reaching out about your property in Dubai Marina. Given the current market momentum, I wanted to share some insights that could be valuable for a property owner in your area.\n\nWould you be open to a brief conversation?\n\nBest,\nDXB PropVault`,
    campaign: 'Marina Q2 Outreach', inbox: 'outreach3@dxbpropvault.com', status: 'bounced', openCount: 0,
    sentAt: '2025-06-05T14:00:00Z', openedAt: null, repliedAt: null, step: 1,
  },
  {
    id: 'e9', to: 'layla.ahmed@gmail.com', toName: 'Layla Ahmed',
    subject: 'Following up – Marina property opportunity',
    body: `Hi Layla,\n\nI wanted to follow up on my previous message about your Marina property. I know you're busy, so I'll keep this brief.\n\nWe've had strong buyer interest in properties in your area over the past two weeks, and I didn't want you to miss out on current market conditions.\n\nIs there a better time to connect — even just 5 minutes?\n\nBest,\nDXB PropVault`,
    campaign: 'Marina Q2 Outreach', inbox: 'outreach4@dxbpropvault.com', status: 'opened', openCount: 2,
    sentAt: '2025-06-07T10:00:00Z', openedAt: '2025-06-08T09:10:00Z', repliedAt: null, step: 2,
  },
  {
    id: 'e10', to: 'mariam.alketbi@gmail.com', toName: 'Mariam Al-Ketbi',
    subject: 'JBR Market Update – Your Unit Could Be Worth More',
    body: `Dear Mariam,\n\nJBR continues to be one of Dubai's most sought-after locations for residents and tourists alike. The rental market remains extremely competitive, with short-term rental yields reaching 8–10% for well-positioned units.\n\nGiven the location of your property, I believe there's significant upside worth exploring — both on the sale side and rental optimization.\n\nWould you be open to a brief conversation?\n\nBest,\nDXB PropVault`,
    campaign: 'JBR Investor Outreach', inbox: 'outreach4@dxbpropvault.com', status: 'opened', openCount: 1,
    sentAt: '2025-06-04T14:00:00Z', openedAt: '2025-06-05T09:00:00Z', repliedAt: null, step: 1,
  },
  {
    id: 'e11', to: 'ali.hussain@gmail.com', toName: 'Ali Hussain',
    subject: 'Your Downtown Dubai Unit – Rental Opportunity',
    body: `Dear Ali,\n\nI hope this note finds you well. I'm reaching out about your property in Downtown Dubai — the rental market has been very active this season and your unit is in a prime position.\n\nWould you like a complimentary rental valuation?\n\nBest,\nDXB PropVault`,
    campaign: 'Downtown Sellers Q2', inbox: 'outreach2@dxbpropvault.com', status: 'delivered', openCount: 0,
    sentAt: '2025-06-09T07:30:00Z', openedAt: null, repliedAt: null, step: 1,
  },
  {
    id: 'e12', to: 'tariq.almutairi@gmail.com', toName: 'Tariq Al-Mutairi',
    subject: 'Exclusive Buyer Interest – Palm Jumeirah',
    body: `Dear Tariq,\n\nI wanted to reach out with a confidential opportunity. We have a high-net-worth buyer actively seeking luxury properties on Palm Jumeirah with a confirmed budget of AED 12–15M.\n\nGiven your portfolio in the area, I wanted to reach out exclusively before listing anything publicly.\n\nThis is a genuine, pre-qualified buyer — not a speculative inquiry.\n\nAre you open to a confidential conversation?\n\nBest,\nDXB PropVault`,
    campaign: 'Palm Jumeirah VIP', inbox: 'outreach1@dxbpropvault.com', status: 'delivered', openCount: 0,
    sentAt: '2025-06-09T09:00:00Z', openedAt: null, repliedAt: null, step: 1,
  },
  {
    id: 'e13', to: 'rima.saleh@gmail.com', toName: 'Rima Saleh',
    subject: 'Following up – Marina property opportunity',
    body: `Hi Rima,\n\nJust a quick follow-up to my earlier message about your Marina property. I understand if the timing isn't right, but I wanted to make sure you had the information.\n\nIf you'd prefer not to hear from us again, just reply and I'll remove you from our list immediately.\n\nOtherwise, we'd love to connect when the time is right.\n\nBest,\nDXB PropVault`,
    campaign: 'Marina Q2 Outreach', inbox: 'outreach3@dxbpropvault.com', status: 'delivered', openCount: 0,
    sentAt: '2025-06-07T10:10:00Z', openedAt: null, repliedAt: null, step: 2,
  },
  {
    id: 'e14', to: 'waleed.almarri@gmail.com', toName: 'Waleed Al-Marri',
    subject: 'Remote Property Management – Your Dubai Investment',
    body: `Dear Waleed,\n\nManaging a Dubai property from abroad doesn't have to be stressful. Many of our clients manage their investments entirely remotely with our full-service management.\n\nWe handle everything digitally:\n• Monthly statements and rent collection\n• Maintenance coordination with photo updates\n• Tenant management and contract renewals\n• Annual RERA compliance\n\nAre you currently handling this yourself, or do you have a local manager? I'd love to share how we compare.\n\nBest,\nDXB PropVault`,
    campaign: 'GCC Investor Outreach', inbox: 'outreach2@dxbpropvault.com', status: 'replied', openCount: 1,
    sentAt: '2025-06-02T12:00:00Z', openedAt: '2025-06-03T08:00:00Z', repliedAt: '2025-06-03T17:00:00Z', step: 1,
  },
  {
    id: 'e15', to: 'amira.hassan@gmail.com', toName: 'Amira Hassan',
    subject: 'JBR Market Update – Your Unit Could Be Worth More',
    body: `Dear Amira,\n\nI wanted to share some exciting market data for JBR that I think you'll find valuable as a property owner in the area.\n\nPlease let me know if you'd like to discuss further.\n\nBest,\nDXB PropVault`,
    campaign: 'JBR Investor Outreach', inbox: 'outreach4@dxbpropvault.com', status: 'failed', openCount: 0,
    sentAt: '2025-06-09T08:30:00Z', openedAt: null, repliedAt: null, step: 1,
  },
]

// ── state ─────────────────────────────────────────────────────────────
const search = ref('')
const statusFilter = ref('all')
const campaignFilter = ref('all')
const page = ref(1)
const pageSize = 25
const previewEmail = ref<SentEmail | null>(null)
const previewOpen = ref(false)

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Replied', value: 'replied' },
  { label: 'Opened', value: 'opened' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Bounced', value: 'bounced' },
  { label: 'Failed', value: 'failed' },
]

const CAMPAIGN_OPTIONS = computed(() => [
  { label: 'All campaigns', value: 'all' },
  ...Array.from(new Set(MOCK.map(e => e.campaign))).map(c => ({ label: c, value: c })),
])

const filtered = computed(() => {
  let list = MOCK
  if (statusFilter.value !== 'all') list = list.filter(e => e.status === statusFilter.value)
  if (campaignFilter.value !== 'all') list = list.filter(e => e.campaign === campaignFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(e =>
      e.to.toLowerCase().includes(q)
      || e.toName.toLowerCase().includes(q)
      || e.subject.toLowerCase().includes(q),
    )
  }
  return list
})

watch([search, statusFilter, campaignFilter], () => { page.value = 1 })

function openPreview(email: SentEmail) {
  previewEmail.value = email
  previewOpen.value = true
}

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const STATUS_COLOR: Record<string, BadgeColor> = {
  replied: 'success', opened: 'info', delivered: 'neutral', bounced: 'error', failed: 'error',
}
const STATUS_ICON: Record<string, string> = {
  replied: 'i-lucide-reply', opened: 'i-lucide-mail-open', delivered: 'i-lucide-send',
  bounced: 'i-lucide-ban', failed: 'i-lucide-x-circle',
}

function statusColor(s: string): BadgeColor { return (STATUS_COLOR[s] ?? 'neutral') as BadgeColor }
function statusIcon(s: string): string { return STATUS_ICON[s] ?? 'i-lucide-mail' }

function relTime(ts: string | null) {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

function fmtFull(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const columns: TableColumn<SentEmail>[] = [
  { id: 'recipient', header: 'Recipient' },
  { id: 'subject', header: 'Subject' },
  { id: 'campaign', header: 'Campaign' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'opens', header: 'Opens' },
  { id: 'sentAt', header: 'Sent' },
]
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Sent Emails</h1>
        <p class="mt-0.5 text-sm text-muted">{{ filtered.length.toLocaleString() }} emails</p>
      </div>
      <UButton icon="i-lucide-download" color="neutral" variant="subtle">Export CSV</UButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search by email, name, or subject…" class="max-w-xs" />
      <USelect v-model="statusFilter" :items="STATUS_OPTIONS" value-key="value" label-key="label" class="w-40" />
      <USelect v-model="campaignFilter" :items="CAMPAIGN_OPTIONS" value-key="value" label-key="label" class="w-52" />
    </div>

    <!-- Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable
        :data="filtered"
        :columns="columns"
        class="[&_tr]:cursor-pointer"
        @select="openPreview($event.original)"
      >

        <template #recipient-cell="{ row }">
          <div>
            <p class="text-sm font-medium text-highlighted">{{ row.original.toName }}</p>
            <p class="text-xs text-muted font-mono">{{ row.original.to }}</p>
          </div>
        </template>

        <template #subject-cell="{ row }">
          <p class="text-sm text-default truncate max-w-xs">{{ row.original.subject }}</p>
          <p class="text-xs text-muted">Step {{ row.original.step }} · {{ row.original.inbox }}</p>
        </template>

        <template #campaign-cell="{ row }">
          <NuxtLink :to="`/campaigns/1`" class="text-xs text-primary hover:underline" @click.stop>
            {{ row.original.campaign }}
          </NuxtLink>
        </template>

        <template #status-cell="{ row }">
          <div class="flex items-center gap-1.5">
            <UIcon :name="statusIcon(row.original.status)" class="w-3.5 h-3.5 shrink-0" :class="`text-${statusColor(row.original.status) === 'success' ? 'success' : statusColor(row.original.status) === 'info' ? 'info' : statusColor(row.original.status) === 'error' ? 'error' : 'muted'}-500`" />
            <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm" class="capitalize">
              {{ row.original.status }}
            </UBadge>
          </div>
          <p v-if="row.original.repliedAt" class="text-xs text-muted mt-0.5">Replied {{ relTime(row.original.repliedAt) }}</p>
        </template>

        <template #opens-cell="{ row }">
          <div class="flex items-center gap-1 text-sm">
            <UIcon v-if="row.original.openCount > 0" name="i-lucide-eye" class="w-3.5 h-3.5 text-info-500" />
            <span :class="row.original.openCount > 0 ? 'text-info-600 font-medium' : 'text-muted'">
              {{ row.original.openCount > 0 ? row.original.openCount : '—' }}
            </span>
          </div>
          <p v-if="row.original.openedAt" class="text-xs text-muted">{{ relTime(row.original.openedAt) }}</p>
        </template>

        <template #sentAt-cell="{ row }">
          <span class="text-sm text-muted">{{ relTime(row.original.sentAt) }}</span>
        </template>

      </UTable>

      <div v-if="filtered.length === 0" class="py-16 text-center">
        <UIcon name="i-lucide-send-horizontal" class="w-10 h-10 text-muted mx-auto mb-3" />
        <p class="text-sm font-semibold text-highlighted">No emails found</p>
        <p class="text-xs text-muted mt-1">Try adjusting your filters.</p>
      </div>
    </UCard>

    <div v-if="filtered.length > pageSize" class="flex justify-center mt-5">
      <UPagination v-model:page="page" :total="filtered.length" :page-size="pageSize" />
    </div>

    <!-- Email preview modal -->
    <UModal v-model:open="previewOpen" :ui="{ content: 'max-w-2xl w-full' }">
      <template #content>
        <UCard v-if="previewEmail" class="w-full">
          <template #header>
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <h3 class="text-base font-semibold text-highlighted truncate">{{ previewEmail.subject }}</h3>
                <p class="text-xs text-muted mt-0.5">
                  To {{ previewEmail.toName }} &lt;{{ previewEmail.to }}&gt;
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <UBadge :color="statusColor(previewEmail.status)" variant="subtle" size="sm" class="capitalize">
                  {{ previewEmail.status }}
                </UBadge>
                <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="previewOpen = false" />
              </div>
            </div>
          </template>

          <!-- Metadata row -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 pb-5 border-b border-default text-sm">
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Sent</p>
              <p class="text-default font-medium">{{ fmtFull(previewEmail.sentAt) }}</p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Opened</p>
              <p :class="previewEmail.openedAt ? 'text-info-600 font-medium' : 'text-muted'">
                {{ previewEmail.openedAt ? fmtFull(previewEmail.openedAt) : '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Replied</p>
              <p :class="previewEmail.repliedAt ? 'text-success-600 font-medium' : 'text-muted'">
                {{ previewEmail.repliedAt ? fmtFull(previewEmail.repliedAt) : '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Inbox</p>
              <p class="text-default font-mono text-xs">{{ previewEmail.inbox }}</p>
            </div>
          </div>

          <!-- Email body -->
          <div class="bg-elevated rounded-xl px-5 py-4">
            <p class="text-sm font-semibold text-highlighted mb-3 pb-2 border-b border-default">
              Subject: {{ previewEmail.subject }}
            </p>
            <div class="text-sm text-default whitespace-pre-wrap leading-relaxed">{{ previewEmail.body }}</div>
          </div>

          <!-- Footer info -->
          <div class="flex items-center justify-between mt-4 pt-3 border-t border-default text-xs text-muted">
            <span>{{ previewEmail.campaign }} · Step {{ previewEmail.step }}</span>
            <span>
              <span v-if="previewEmail.openCount > 0" class="text-info-600">
                {{ previewEmail.openCount }} open{{ previewEmail.openCount > 1 ? 's' : '' }}
              </span>
              <span v-else>Not opened</span>
            </span>
          </div>
        </UCard>
      </template>
    </UModal>

  </div>
</template>
