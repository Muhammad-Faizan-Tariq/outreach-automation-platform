<script setup lang="ts">
type AILabel = 'Interested' | 'Questions' | 'Not Interested' | 'OOO' | 'Unsubscribe' | null

interface Message {
  id: string
  from: 'us' | 'contact'
  subject: string
  body: string
  timestamp: string
}

interface Conversation {
  id: string
  contactName: string
  contactEmail: string
  contactCountry: string
  contactType: 'owner' | 'tenant' | 'lead'
  campaignName: string
  unread: boolean
  resolved: boolean
  assignedTo: string | null
  label: AILabel
  notes: string
  snippet: string
  timestamp: string
  messages: Message[]
}

const MOCK: Conversation[] = [
  {
    id: '1', contactName: 'Ahmed Al-Rashidi', contactEmail: 'ahmed.alrashidi@gmail.com',
    contactCountry: 'UAE', contactType: 'owner', campaignName: 'Marina Q2 Outreach',
    unread: true, resolved: false, assignedTo: null, label: 'Interested', notes: '',
    snippet: 'What kind of returns are you seeing for similar units in the area?',
    timestamp: '2025-06-09T08:22:00Z',
    messages: [
      { id: 'm1a', from: 'us', subject: 'Maximize Your Dubai Marina Investment', timestamp: '2025-06-08T10:00:00Z',
        body: `Hi Ahmed,\n\nI hope this message finds you well. I noticed you own a beautiful 2BR unit at Marina Gate Tower 1, and given the current market conditions, there may be an excellent opportunity to maximize your rental yield or explore a profitable sale.\n\nOur team specializes in Dubai Marina properties and we have qualified buyers actively looking in your area.\n\nWould you be open to a quick 10-minute call this week?\n\nBest regards,\nDXB PropVault Team` },
      { id: 'm1b', from: 'contact', subject: 'Re: Maximize Your Dubai Marina Investment', timestamp: '2025-06-09T08:22:00Z',
        body: `Thank you for reaching out. I am interested in discussing this further. What kind of returns are you seeing for similar units in the area? I've been thinking about selling but wanted to understand the market better first.\n\nBest,\nAhmed` },
    ],
  },
  {
    id: '2', contactName: 'Sara Al-Mansoori', contactEmail: 'sara.almansoori@outlook.com',
    contactCountry: 'UAE', contactType: 'owner', campaignName: 'Downtown Sellers Q2',
    unread: true, resolved: false, assignedTo: null, label: 'Questions', notes: '',
    snippet: 'Yes, I would like to know more about the rental management service.',
    timestamp: '2025-06-09T07:45:00Z',
    messages: [
      { id: 'm2a', from: 'us', subject: 'Your Downtown Dubai Unit – Rental Opportunity', timestamp: '2025-06-08T14:30:00Z',
        body: `Dear Sara,\n\nI'm reaching out regarding your property in Downtown Dubai. With strong rental demand continuing through 2025, your unit could command premium rates this season.\n\nWe offer full property management at competitive rates — from tenant sourcing to maintenance.\n\nWould you be interested in a free rental valuation?\n\nWarm regards,\nDXB PropVault` },
      { id: 'm2b', from: 'contact', subject: 'Re: Your Downtown Dubai Unit – Rental Opportunity', timestamp: '2025-06-09T07:45:00Z',
        body: `Yes, I would like to know more about the rental management service. What is your management fee and what does it include?\n\nThank you,\nSara` },
    ],
  },
  {
    id: '3', contactName: 'Mohammed Al-Abudhabi', contactEmail: 'mohammed.alabudhabi@outlook.com',
    contactCountry: 'UAE', contactType: 'owner', campaignName: 'Palm Jumeirah VIP',
    unread: false, resolved: false, assignedTo: 'Sarah Al-Mansoori', label: 'Interested', notes: 'Wants call Tuesday 2pm. Budget flexible up to 20M.',
    snippet: 'Can we schedule a call for next Tuesday at 2pm?',
    timestamp: '2025-06-08T16:10:00Z',
    messages: [
      { id: 'm3a', from: 'us', subject: 'Exclusive Buyer Interest – Palm Jumeirah', timestamp: '2025-06-07T09:00:00Z',
        body: `Dear Mohammed,\n\nWe have a high-net-worth client actively seeking luxury villas on Palm Jumeirah with a budget of AED 15–20M.\n\nGiven your portfolio in the area, I wanted to reach out exclusively before listing anything publicly.\n\nAre you open to a confidential conversation?\n\nBest,\nDXB PropVault` },
      { id: 'm3b', from: 'contact', subject: 'Re: Exclusive Buyer Interest – Palm Jumeirah', timestamp: '2025-06-08T16:10:00Z',
        body: `This sounds interesting. Can we schedule a call for next Tuesday at 2pm? I'd like to understand more about the buyer's requirements and budget flexibility.\n\nRegards,\nMohammed` },
    ],
  },
  {
    id: '4', contactName: 'Hind Al-Qasimi', contactEmail: 'hind.alqasimi@outlook.com',
    contactCountry: 'UAE', contactType: 'owner', campaignName: 'JBR Investor Outreach',
    unread: true, resolved: false, assignedTo: null, label: 'Questions', notes: '',
    snippet: 'What is the current asking price range for 2BR units in JBR?',
    timestamp: '2025-06-09T06:55:00Z',
    messages: [
      { id: 'm4a', from: 'us', subject: 'JBR Market Update – Your Unit Could Be Worth More', timestamp: '2025-06-08T09:00:00Z',
        body: `Dear Hind,\n\nThe JBR market has seen a 12% appreciation in Q1 2025. Your unit's value may have increased significantly since purchase.\n\nI'd love to share a no-obligation market appraisal — no commitment required.\n\nBest,\nDXB PropVault` },
      { id: 'm4b', from: 'contact', subject: 'Re: JBR Market Update', timestamp: '2025-06-09T06:55:00Z',
        body: `Thank you for the update. What is the current asking price range for 2BR units in JBR? I'm curious about what my unit might fetch if I were to sell.\n\nHind` },
    ],
  },
  {
    id: '5', contactName: 'Sultan Al-Manei', contactEmail: 'sultan.almanei@outlook.com',
    contactCountry: 'UAE', contactType: 'owner', campaignName: 'Downtown Sellers Q2',
    unread: false, resolved: false, assignedTo: 'Khalid Hassan', label: 'Interested', notes: 'Large portfolio. Priority lead.',
    snippet: 'Please send me the full rental yield analysis report.',
    timestamp: '2025-06-07T14:20:00Z',
    messages: [
      { id: 'm5a', from: 'us', subject: 'Your Downtown Dubai Portfolio – Rental Analysis', timestamp: '2025-06-06T10:00:00Z',
        body: `Dear Sultan,\n\nWith 6 properties in your portfolio, you're in an excellent position to optimize your rental income strategy.\n\nWe've prepared a portfolio-level analysis I'd like to share with you.\n\nInterested?\n\nBest,\nDXB PropVault` },
      { id: 'm5b', from: 'contact', subject: 'Re: Your Downtown Dubai Portfolio', timestamp: '2025-06-07T14:20:00Z',
        body: `Please send me the full rental yield analysis report. I want to review the numbers before we discuss further.\n\nThank you,\nSultan` },
    ],
  },
  {
    id: '6', contactName: 'Nadia Karim', contactEmail: 'nadia.karim@hotmail.com',
    contactCountry: 'UAE', contactType: 'owner', campaignName: 'Marina Q2 Outreach',
    unread: false, resolved: true, assignedTo: null, label: 'Not Interested', notes: 'Has existing agent. Do not re-contact.',
    snippet: 'I already have an agent handling my properties. Thank you.',
    timestamp: '2025-06-08T11:30:00Z',
    messages: [
      { id: 'm6a', from: 'us', subject: 'Maximize Your Dubai Marina Investment', timestamp: '2025-06-07T15:00:00Z',
        body: `Hi Nadia,\n\nI hope you're doing well. I'm reaching out about your properties in Dubai Marina — the market has been particularly active and we have some exciting opportunities.\n\nCould we connect briefly this week?\n\nBest,\nDXB PropVault` },
      { id: 'm6b', from: 'contact', subject: 'Re: Maximize Your Dubai Marina Investment', timestamp: '2025-06-08T11:30:00Z',
        body: `I already have an agent handling my properties. Thank you for reaching out.\n\nNadia` },
    ],
  },
  {
    id: '7', contactName: 'Layla Ahmed', contactEmail: 'layla.ahmed@gmail.com',
    contactCountry: 'UAE', contactType: 'owner', campaignName: 'Marina Q2 Outreach',
    unread: false, resolved: false, assignedTo: null, label: 'Questions', notes: '',
    snippet: 'Could you tell me more about your agency and how long you\'ve been in Dubai?',
    timestamp: '2025-06-06T09:15:00Z',
    messages: [
      { id: 'm7a', from: 'us', subject: 'Maximize Your Dubai Marina Investment', timestamp: '2025-06-05T11:00:00Z',
        body: `Hi Layla,\n\nI hope you're having a great week. I wanted to reach out about your Marina property and share some exciting market insights.\n\nBest,\nDXB PropVault` },
      { id: 'm7b', from: 'contact', subject: 'Re: Maximize Your Dubai Marina Investment', timestamp: '2025-06-06T09:15:00Z',
        body: `I might be interested. Could you tell me more about your agency and how long you've been operating in Dubai?\n\nLayla` },
    ],
  },
  {
    id: '8', contactName: 'Mariam Al-Ketbi', contactEmail: 'mariam.alketbi@gmail.com',
    contactCountry: 'UAE', contactType: 'owner', campaignName: 'JBR Investor Outreach',
    unread: false, resolved: false, assignedTo: null, label: 'Questions', notes: '',
    snippet: 'Do you have experience with short-term rentals (Airbnb)?',
    timestamp: '2025-06-05T16:40:00Z',
    messages: [
      { id: 'm8a', from: 'us', subject: 'JBR Market Update', timestamp: '2025-06-04T14:00:00Z',
        body: `Dear Mariam,\n\nJBR continues to be one of Dubai's most sought-after locations for residents and tourists alike. The rental market remains extremely competitive.\n\nBest,\nDXB PropVault` },
      { id: 'm8b', from: 'contact', subject: 'Re: JBR Market Update', timestamp: '2025-06-05T16:40:00Z',
        body: `Do you have experience with short-term rentals (Airbnb)? My unit is in a good location for tourists and I've been curious about that segment.\n\nMariam` },
    ],
  },
  {
    id: '9', contactName: 'Dalal Al-Shehhi', contactEmail: 'dalal.alshehhi@gmail.com',
    contactCountry: 'UAE', contactType: 'owner', campaignName: 'Downtown Sellers Q2',
    unread: false, resolved: false, assignedTo: null, label: 'OOO', notes: 'Follow up in October when lease ends.',
    snippet: 'My lease ends in October, I might consider selling after that.',
    timestamp: '2025-06-05T10:05:00Z',
    messages: [
      { id: 'm9a', from: 'us', subject: 'Your Downtown Dubai Unit – Rental Opportunity', timestamp: '2025-06-04T09:00:00Z',
        body: `Dear Dalal,\n\nI'm reaching out about your Downtown Dubai property. Given the current market, there may be a great window to either sell or optimize for rental.\n\nBest,\nDXB PropVault` },
      { id: 'm9b', from: 'contact', subject: 'Re: Downtown Opportunity', timestamp: '2025-06-05T10:05:00Z',
        body: `My lease ends in October, I might consider selling after that. Can we talk more closer to that time?\n\nDalal` },
    ],
  },
  {
    id: '10', contactName: 'Rima Saleh', contactEmail: 'rima.saleh@gmail.com',
    contactCountry: 'UAE', contactType: 'owner', campaignName: 'Marina Q2 Outreach',
    unread: false, resolved: true, assignedTo: null, label: 'Unsubscribe', notes: '',
    snippet: 'I am happy with my current tenants and not looking to sell at this time.',
    timestamp: '2025-06-04T13:55:00Z',
    messages: [
      { id: 'm10a', from: 'us', subject: 'Maximize Your Dubai Marina Investment', timestamp: '2025-06-03T10:00:00Z',
        body: `Hi Rima,\n\nQuick note about your Marina property — we've had strong buyer interest in your building recently.\n\nBest,\nDXB PropVault` },
      { id: 'm10b', from: 'contact', subject: 'Re: Dubai Marina', timestamp: '2025-06-04T13:55:00Z',
        body: `I am happy with my current tenants and not looking to sell at this time. Please remove me from your list.\n\nRima` },
    ],
  },
  {
    id: '11', contactName: 'Saif Al-Blooshi', contactEmail: 'saif.alblooshi@gmail.com',
    contactCountry: 'UAE', contactType: 'tenant', campaignName: 'Tenant Upgrade Program',
    unread: true, resolved: false, assignedTo: null, label: 'Interested', notes: '',
    snippet: 'Can you help me find a 3BR in Business Bay under AED 150K/year?',
    timestamp: '2025-06-09T09:30:00Z',
    messages: [
      { id: 'm11a', from: 'us', subject: 'Upgrade Your Living – Premium Units Available', timestamp: '2025-06-08T08:00:00Z',
        body: `Hi Saif,\n\nWe have exclusive listings for tenants looking to upgrade their living situation in Dubai's best communities.\n\nInterested in a no-obligation property tour?\n\nBest,\nDXB PropVault` },
      { id: 'm11b', from: 'contact', subject: 'Re: Upgrade Your Living', timestamp: '2025-06-09T09:30:00Z',
        body: `Can you help me find a 3BR in Business Bay under AED 150K/year? I'm looking to move by end of July.\n\nSaif` },
    ],
  },
  {
    id: '12', contactName: 'Waleed Al-Marri', contactEmail: 'waleed.almarri@gmail.com',
    contactCountry: 'Qatar', contactType: 'owner', campaignName: 'GCC Investor Outreach',
    unread: false, resolved: false, assignedTo: null, label: 'Questions', notes: '',
    snippet: 'I am based in Qatar. Can this all be handled remotely?',
    timestamp: '2025-06-03T17:00:00Z',
    messages: [
      { id: 'm12a', from: 'us', subject: 'Remote Property Management – Dubai', timestamp: '2025-06-02T12:00:00Z',
        body: `Dear Waleed,\n\nManaging a Dubai property from abroad doesn't have to be stressful. We offer full remote management with digital reporting.\n\nBest,\nDXB PropVault` },
      { id: 'm12b', from: 'contact', subject: 'Re: Remote Property Management', timestamp: '2025-06-03T17:00:00Z',
        body: `I am based in Qatar. Can this all be handled remotely? I haven't visited the property in 8 months.\n\nWaleed` },
    ],
  },
]

// ── state ──────────────────────────────────────────────────────────────
const convos = ref(MOCK.map(c => ({ ...c, messages: [...c.messages] })))
const search = ref('')
const filter = ref<'all' | 'unread'>('all')
const labelFilter = ref<AILabel | 'all'>('all')
const selectedId = ref<string | null>(null)
const replyText = ref('')
const threadRef = ref<HTMLElement | null>(null)
const reclassifyOpen = ref(false)
const reclassifyLabel = ref<AILabel>(null)
const notesText = ref('')

const AGENTS = ['Unassigned', 'Sarah Al-Mansoori', 'Khalid Hassan', 'Nadia Karim']

const LABEL_FILTERS = [
  { label: 'All', value: 'all' as const },
  { label: 'Interested', value: 'Interested' as AILabel },
  { label: 'Questions', value: 'Questions' as AILabel },
  { label: 'Not Interested', value: 'Not Interested' as AILabel },
  { label: 'OOO', value: 'OOO' as AILabel },
  { label: 'Unsubscribe', value: 'Unsubscribe' as AILabel },
]

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const LABEL_COLOR: Record<string, BadgeColor> = {
  'Interested': 'success',
  'Questions': 'info',
  'Not Interested': 'neutral',
  'OOO': 'warning',
  'Unsubscribe': 'error',
}
const TYPE_COLOR: Record<string, BadgeColor> = { owner: 'primary', tenant: 'info', lead: 'neutral' }

function labelColor(l: AILabel): BadgeColor { return l ? (LABEL_COLOR[l] ?? 'neutral') as BadgeColor : 'neutral' }
function typeColor(t: string): BadgeColor { return (TYPE_COLOR[t] ?? 'neutral') as BadgeColor }

const filtered = computed(() => {
  let list = convos.value
  if (filter.value === 'unread') list = list.filter(c => c.unread)
  if (labelFilter.value !== 'all') list = list.filter(c => c.label === labelFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(c =>
      c.contactName.toLowerCase().includes(q)
      || c.contactEmail.toLowerCase().includes(q)
      || c.snippet.toLowerCase().includes(q),
    )
  }
  return list
})

const selected = computed(() => convos.value.find(c => c.id === selectedId.value) ?? null)
const unreadCount = computed(() => convos.value.filter(c => c.unread).length)

watch(filtered, (list) => {
  if (!list.find(c => c.id === selectedId.value)) {
    selectedId.value = list[0]?.id ?? null
  }
}, { immediate: true })

watch(selected, async (conv) => {
  notesText.value = conv?.notes ?? ''
  await nextTick()
  if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
})

function select(id: string) {
  selectedId.value = id
  const c = convos.value.find(x => x.id === id)
  if (c) c.unread = false
}

function sendReply() {
  if (!replyText.value.trim() || !selected.value) return
  const lastMsg = selected.value.messages.at(-1)
  selected.value.messages.push({
    id: `sent-${Date.now()}`,
    from: 'us',
    subject: lastMsg?.subject.startsWith('Re:') ? lastMsg.subject : `Re: ${lastMsg?.subject ?? ''}`,
    body: replyText.value,
    timestamp: new Date().toISOString(),
  })
  replyText.value = ''
  nextTick(() => {
    if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
  })
}

function openReclassify() {
  reclassifyLabel.value = selected.value?.label ?? null
  reclassifyOpen.value = true
}

function applyReclassify() {
  if (selected.value) selected.value.label = reclassifyLabel.value
  reclassifyOpen.value = false
}

function toggleResolved() {
  if (selected.value) selected.value.resolved = !selected.value.resolved
}

function assignTo(agent: string) {
  if (selected.value) selected.value.assignedTo = agent === 'Unassigned' ? null : agent
}

function fmt(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtFull(ts: string) {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}
</script>

<template>
  <!-- Full-height 3-column layout, no outer scroll -->
  <div class="flex h-full overflow-hidden border-t border-default">

    <!-- ── LEFT: conversation list (288px) ─────────────────────────── -->
    <div class="w-72 border-r border-default flex flex-col shrink-0 bg-default">

      <!-- List header -->
      <div class="px-3 pt-3 pb-2 border-b border-default space-y-2 shrink-0">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-sm font-semibold text-highlighted flex items-center gap-2">
            Replies
            <UBadge v-if="unreadCount > 0" color="primary" variant="solid" size="xs">{{ unreadCount }}</UBadge>
          </h2>
        </div>
        <UInput v-model="search" icon="i-lucide-search" placeholder="Search conversations…" size="sm" />
        <!-- Unread filter -->
        <div class="flex gap-1">
          <UButton
            size="xs"
            :color="filter === 'all' ? 'primary' : 'neutral'"
            :variant="filter === 'all' ? 'solid' : 'ghost'"
            @click="filter = 'all'"
          >
            All
          </UButton>
          <UButton
            size="xs"
            :color="filter === 'unread' ? 'primary' : 'neutral'"
            :variant="filter === 'unread' ? 'solid' : 'ghost'"
            @click="filter = 'unread'"
          >
            Unread
          </UButton>
        </div>
        <!-- AI label filter -->
        <div class="flex flex-wrap gap-1">
          <button
            v-for="lf in LABEL_FILTERS"
            :key="String(lf.value)"
            class="text-xs px-2 py-0.5 rounded-full border transition-colors"
            :class="labelFilter === lf.value
              ? 'bg-primary text-white border-primary'
              : 'border-default text-muted hover:text-highlighted hover:border-highlighted'"
            @click="labelFilter = lf.value"
          >
            {{ lf.label }}
          </button>
        </div>
      </div>

      <!-- Conversation list -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="filtered.length === 0" class="px-4 py-10 text-center">
          <UIcon name="i-lucide-inbox" class="w-8 h-8 text-muted mx-auto mb-2" />
          <p class="text-sm text-muted">No conversations</p>
        </div>

        <button
          v-for="conv in filtered"
          :key="conv.id"
          class="w-full text-left px-3 py-3 border-b border-default transition-colors"
          :class="selectedId === conv.id
            ? 'bg-primary/10 border-l-2 border-l-primary'
            : 'hover:bg-elevated'"
          @click="select(conv.id)"
        >
          <div class="flex items-start gap-2">
            <!-- Unread indicator -->
            <div
              class="mt-1.5 w-2 h-2 rounded-full shrink-0"
              :class="conv.unread ? 'bg-primary' : 'bg-transparent'"
            />
            <!-- Avatar -->
            <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
              {{ initials(conv.contactName) }}
            </div>
            <!-- Body -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-0.5">
                <p
                  class="text-sm truncate"
                  :class="conv.unread ? 'font-semibold text-highlighted' : 'font-medium text-default'"
                >
                  {{ conv.contactName }}
                </p>
                <span class="text-xs text-muted shrink-0">{{ fmt(conv.timestamp) }}</span>
              </div>
              <p class="text-xs text-muted truncate leading-relaxed">{{ conv.snippet }}</p>
              <div class="flex items-center gap-1.5 mt-1">
                <UBadge v-if="conv.label" :color="labelColor(conv.label)" variant="subtle" size="xs">
                  {{ conv.label }}
                </UBadge>
                <UBadge v-if="conv.resolved" color="neutral" variant="subtle" size="xs">Resolved</UBadge>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- ── MIDDLE: thread view (flex-1) ────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden bg-default min-w-0">

      <!-- Empty state -->
      <div v-if="!selected" class="flex-1 flex flex-col items-center justify-center text-center gap-3">
        <div class="w-16 h-16 rounded-full bg-elevated flex items-center justify-center">
          <UIcon name="i-lucide-inbox" class="w-8 h-8 text-muted" />
        </div>
        <div>
          <p class="text-base font-semibold text-highlighted">No conversation selected</p>
          <p class="text-sm text-muted mt-0.5">Choose a conversation from the list to view the thread.</p>
        </div>
      </div>

      <template v-else>
        <!-- Thread header -->
        <div class="px-6 py-4 border-b border-default shrink-0 bg-default">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 class="text-base font-semibold text-highlighted truncate">
                  {{ selected.messages[0]?.subject }}
                </h3>
                <UBadge v-if="selected.label" :color="labelColor(selected.label)" variant="subtle" size="sm">
                  {{ selected.label }}
                </UBadge>
                <UBadge v-if="selected.resolved" color="success" variant="subtle" size="sm">Resolved</UBadge>
              </div>
              <p class="text-xs text-muted">
                {{ selected.messages.length }} messages &middot; {{ selected.campaignName }}
              </p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <UButton
                size="xs"
                color="neutral"
                variant="subtle"
                icon="i-lucide-tag"
                @click="openReclassify"
              >
                Re-classify
              </UButton>
              <UButton
                :icon="selected.resolved ? 'i-lucide-rotate-ccw' : 'i-lucide-check-circle'"
                size="xs"
                :color="selected.resolved ? 'neutral' : 'success'"
                variant="subtle"
                @click="toggleResolved"
              >
                {{ selected.resolved ? 'Reopen' : 'Resolve' }}
              </UButton>
              <UTooltip text="Mark unread">
                <UButton icon="i-lucide-mail" color="neutral" variant="ghost" size="xs"
                  @click="() => { const c = convos.find(x => x.id === selected?.id); if(c) c.unread = true }" />
              </UTooltip>
            </div>
          </div>
        </div>

        <!-- Messages scroll area -->
        <div ref="threadRef" class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div
            v-for="msg in selected.messages"
            :key="msg.id"
            class="flex gap-3"
            :class="msg.from === 'us' ? 'flex-row-reverse' : 'flex-row'"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              :class="msg.from === 'us'
                ? 'bg-primary text-white'
                : 'bg-elevated text-highlighted'"
            >
              {{ msg.from === 'us' ? 'Us' : initials(selected.contactName) }}
            </div>

            <div
              class="max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm"
              :class="msg.from === 'us'
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-elevated text-default rounded-tl-sm border border-default'"
            >
              <div class="whitespace-pre-wrap leading-relaxed">{{ msg.body }}</div>
              <div
                class="text-xs mt-2 text-right"
                :class="msg.from === 'us' ? 'text-white/60' : 'text-muted'"
              >
                {{ fmtFull(msg.timestamp) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Reply compose bar -->
        <div class="px-6 py-4 border-t border-default bg-default shrink-0">
          <div class="flex gap-3 items-end">
            <div class="flex-1">
              <UTextarea
                v-model="replyText"
                placeholder="Type your reply…"
                :rows="3"
                autoresize
                class="w-full"
                @keydown.ctrl.enter.prevent="sendReply"
              />
            </div>
            <UButton
              icon="i-lucide-send-horizontal"
              :disabled="!replyText.trim()"
              class="shrink-0"
              @click="sendReply"
            >
              Send
            </UButton>
          </div>
          <p class="text-xs text-muted mt-1.5">Press <kbd class="px-1 py-0.5 rounded bg-elevated text-xs font-mono border border-default">Ctrl+Enter</kbd> to send</p>
        </div>
      </template>
    </div>

    <!-- ── RIGHT: contact info panel (256px) ───────────────────────── -->
    <div class="hidden lg:flex w-64 border-l border-default flex-col overflow-y-auto bg-default shrink-0">

      <div v-if="!selected" class="flex-1" />

      <template v-else>
        <!-- Contact card -->
        <div class="px-4 py-5 border-b border-default">
          <div class="flex flex-col items-center text-center mb-3">
            <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-base font-bold mb-2">
              {{ initials(selected.contactName) }}
            </div>
            <p class="text-sm font-semibold text-highlighted">{{ selected.contactName }}</p>
            <p class="text-xs text-muted mt-0.5 truncate w-full">{{ selected.contactEmail }}</p>
          </div>
          <div class="flex justify-center gap-1.5">
            <UBadge :color="typeColor(selected.contactType)" variant="subtle" size="xs" class="capitalize">
              {{ selected.contactType }}
            </UBadge>
            <UBadge color="neutral" variant="subtle" size="xs">{{ selected.contactCountry }}</UBadge>
          </div>
        </div>

        <!-- AI Label -->
        <div class="px-4 py-4 border-b border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">AI Classification</p>
          <UBadge v-if="selected.label" :color="labelColor(selected.label)" variant="subtle" size="sm">
            {{ selected.label }}
          </UBadge>
          <span v-else class="text-xs text-muted italic">Unclassified</span>
        </div>

        <!-- Assign to agent -->
        <div class="px-4 py-4 border-b border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">Assigned To</p>
          <UDropdownMenu
            :items="[AGENTS.map(a => ({
              label: a,
              icon: a === 'Unassigned' ? 'i-lucide-user-x' : 'i-lucide-user',
              onSelect: () => assignTo(a),
            }))]"
          >
            <button class="w-full flex items-center gap-2 text-sm text-default hover:text-highlighted transition-colors">
              <UIcon name="i-lucide-user-round" class="w-3.5 h-3.5 text-muted shrink-0" />
              <span class="flex-1 text-left truncate">{{ selected.assignedTo ?? 'Unassigned' }}</span>
              <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-muted shrink-0" />
            </button>
          </UDropdownMenu>
        </div>

        <!-- Campaign -->
        <div class="px-4 py-4 border-b border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">Campaign</p>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-send" class="w-3.5 h-3.5 text-primary shrink-0" />
            <p class="text-sm text-default font-medium truncate">{{ selected.campaignName }}</p>
          </div>
        </div>

        <!-- Thread info -->
        <div class="px-4 py-4 border-b border-default space-y-2 text-sm">
          <p class="text-xs font-medium text-muted uppercase tracking-wide">Thread</p>
          <div class="flex justify-between">
            <span class="text-muted">Messages</span>
            <span class="font-medium text-default tabular-nums">{{ selected.messages.length }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Last reply</span>
            <span class="font-medium text-default">{{ fmt(selected.timestamp) }}</span>
          </div>
        </div>

        <!-- Notes -->
        <div class="px-4 py-4 border-b border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">Notes</p>
          <UTextarea
            v-model="notesText"
            placeholder="Add internal notes…"
            :rows="3"
            class="w-full text-xs"
            @blur="() => { if (selected) selected.notes = notesText }"
          />
        </div>

        <!-- Actions -->
        <div class="px-4 py-4 space-y-2">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-3">Actions</p>
          <UButton
            block size="xs" color="neutral" variant="subtle"
            icon="i-lucide-user" :to="`/contacts/${selected.id}`"
          >
            View contact
          </UButton>
          <UButton
            block size="xs" color="neutral" variant="subtle"
            icon="i-lucide-tag"
            @click="openReclassify"
          >
            Re-classify
          </UButton>
          <UButton
            block size="xs" :color="selected.resolved ? 'neutral' : 'success'" variant="subtle"
            :icon="selected.resolved ? 'i-lucide-rotate-ccw' : 'i-lucide-check-circle'"
            @click="toggleResolved"
          >
            {{ selected.resolved ? 'Reopen' : 'Mark resolved' }}
          </UButton>
          <UButton
            block size="xs" color="error" variant="subtle"
            icon="i-lucide-shield-x"
          >
            Do not contact
          </UButton>
        </div>
      </template>
    </div>

    <!-- Re-classify modal -->
    <UModal v-model:open="reclassifyOpen">
      <template #content>
        <UCard class="max-w-sm w-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-highlighted">Re-classify reply</h3>
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="reclassifyOpen = false" />
            </div>
          </template>
          <div class="space-y-2">
            <button
              v-for="lf in LABEL_FILTERS.slice(1)"
              :key="String(lf.value)"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-sm"
              :class="reclassifyLabel === lf.value
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-default hover:bg-elevated text-default'"
              @click="reclassifyLabel = lf.value"
            >
              <UBadge :color="labelColor(lf.value)" variant="subtle" size="xs" class="shrink-0 w-24 justify-center">
                {{ lf.label }}
              </UBadge>
              <span class="text-xs text-muted">
                <span v-if="lf.value === 'Interested'">Ready to engage / buy / sell</span>
                <span v-else-if="lf.value === 'Questions'">Needs more information</span>
                <span v-else-if="lf.value === 'Not Interested'">Declined, has existing agent</span>
                <span v-else-if="lf.value === 'OOO'">Out of office / contact later</span>
                <span v-else-if="lf.value === 'Unsubscribe'">Requested removal</span>
              </span>
            </button>
          </div>
          <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-default">
            <UButton color="neutral" variant="ghost" size="sm" @click="reclassifyOpen = false">Cancel</UButton>
            <UButton size="sm" @click="applyReclassify">Apply</UButton>
          </div>
        </UCard>
      </template>
    </UModal>

  </div>
</template>
