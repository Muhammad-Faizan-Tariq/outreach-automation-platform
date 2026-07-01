<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

import TriggerNode from '~/components/automation/TriggerNode.vue'
import MessageNode from '~/components/automation/MessageNode.vue'
import WaitNode from '~/components/automation/WaitNode.vue'
import ConditionNode from '~/components/automation/ConditionNode.vue'
import ActionNode from '~/components/automation/ActionNode.vue'

import type { Campaign, CampaignTemplateStep } from '~/composables/useCampaigns'
import type { EmailTemplate } from '~/composables/useTemplates'

const route = useRoute()
const toast = useToast()
const { getCampaign, getCampaignTemplates, startCampaign, pauseCampaign, completeCampaign, archiveCampaign, updateCampaign } = useCampaigns()
const { getTemplate } = useTemplates()

const pageLoading = ref(true)
const notFound = ref(false)
const campaign = ref<Campaign | null>(null)
const templateSteps = ref<CampaignTemplateStep[]>([])
const templateDetails = ref<Map<string, EmailTemplate>>(new Map())
const activeTab = ref('overview')
const actionLoading = ref(false)

onMounted(async () => {
  try {
    const id = route.params.id as string
    const [c, steps] = await Promise.all([getCampaign(id), getCampaignTemplates(id)])
    campaign.value = c
    templateSteps.value = steps
    // Load template details in parallel
    const details = await Promise.allSettled(steps.map(s => getTemplate(s.template_id)))
    details.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        templateDetails.value.set(steps[i]!.template_id, res.value)
      }
    })
  }
  catch (e: any) {
    if (e?.status === 404 || e?.statusCode === 404) notFound.value = true
  }
  finally {
    pageLoading.value = false
  }
})

const tabs = [
  { label: 'Overview', value: 'overview', icon: 'i-lucide-layout-dashboard' },
  { label: 'Sequence', value: 'sequence', icon: 'i-lucide-git-branch' },
  { label: 'Contacts', value: 'contacts', icon: 'i-lucide-users' },
  { label: 'Sent Log', value: 'sentlog', icon: 'i-lucide-send' },
  { label: 'Settings', value: 'settings', icon: 'i-lucide-settings' },
]

// ── computed ─────────────────────────────────────────────────────────────
const openRate = computed(() => {
  if (!campaign.value?.total_sent) return '0'
  return ((campaign.value.total_opened / campaign.value.total_sent) * 100).toFixed(1)
})
const replyRate = computed(() => {
  if (!campaign.value?.total_sent) return '0'
  return ((campaign.value.total_replied / campaign.value.total_sent) * 100).toFixed(1)
})
const bounceRate = computed(() => {
  if (!campaign.value?.total_sent) return '0'
  return ((campaign.value.total_bounced / campaign.value.total_sent) * 100).toFixed(1)
})
const progress = computed(() => {
  if (!campaign.value) return 0
  const denom = campaign.value.actual_audience_size ?? campaign.value.total_contacts
  if (!denom) return 0
  return Math.min(100, Math.round((campaign.value.total_sent / denom) * 100))
})

// ── Vue Flow — read-only sequence canvas ─────────────────────────────────
const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  wait: WaitNode,
  condition: ConditionNode,
  action: ActionNode,
}

const flowNodes = computed(() => {
  const steps = templateSteps.value
  if (!steps.length) return []
  const ns: any[] = []
  let y = 40

  ns.push({ id: 'n-trigger', type: 'trigger', position: { x: 260, y }, data: { label: 'Lead Enrolled' } })
  y += 140

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const tpl = templateDetails.value.get(step.template_id)
    const label = tpl?.subject ?? `Step ${step.step_number}`

    ns.push({ id: `n-msg-${i}`, type: 'message', position: { x: 210, y }, data: { label, template: step.template_id } })
    y += 140

    const condY = y
    ns.push({ id: `n-cond-${i}`, type: 'condition', position: { x: 180, y: condY }, data: { label: 'Did they reply?' } })
    y += 150

    ns.push({ id: `n-qual-${i}`, type: 'action', position: { x: 60, y }, data: { label: 'Mark Qualified' } })

    if (i < steps.length - 1) {
      const nextDelay = steps[i + 1]!.delay_days
      ns.push({ id: `n-wait-${i}`, type: 'wait', position: { x: 330, y }, data: { label: `${nextDelay} day${nextDelay !== 1 ? 's' : ''}`, delay: nextDelay, unit: 'days' } })
      y += 150
    }
    else {
      ns.push({ id: 'n-dead', type: 'action', position: { x: 360, y }, data: { label: 'Mark as Dead' } })
      y += 150
    }
  }
  return ns
})

const flowEdges = computed(() => {
  const steps = templateSteps.value
  if (!steps.length) return []
  const es: any[] = []

  es.push({ id: 'e-t0', source: 'n-trigger', target: 'n-msg-0', animated: true })

  for (let i = 0; i < steps.length; i++) {
    es.push({ id: `e-mc-${i}`, source: `n-msg-${i}`, target: `n-cond-${i}`, animated: true })
    es.push({ id: `e-yes-${i}`, source: `n-cond-${i}`, sourceHandle: 'yes', target: `n-qual-${i}`, label: 'Yes', style: { stroke: '#22c55e' }, labelStyle: { fill: '#22c55e', fontWeight: 600 } })
    if (i < steps.length - 1) {
      es.push({ id: `e-no-${i}`, source: `n-cond-${i}`, sourceHandle: 'no', target: `n-wait-${i}`, label: 'No', style: { stroke: '#ef4444' }, labelStyle: { fill: '#ef4444', fontWeight: 600 } })
      es.push({ id: `e-wm-${i}`, source: `n-wait-${i}`, target: `n-msg-${i + 1}`, animated: true })
    }
    else {
      es.push({ id: 'e-dead', source: `n-cond-${i}`, sourceHandle: 'no', target: 'n-dead', label: 'No', style: { stroke: '#ef4444' }, labelStyle: { fill: '#ef4444', fontWeight: 600 } })
    }
  }
  return es
})

// ── status helpers ───────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const STATUS_COLOR: Record<string, BadgeColor> = {
  running: 'success', paused: 'warning', draft: 'neutral', completed: 'info', archived: 'neutral', scheduled: 'info',
}
function statusColor(s: string): BadgeColor { return (STATUS_COLOR[s] ?? 'neutral') as BadgeColor }
function displayStatus(s: string) { return s === 'running' ? 'active' : s }

function pct(num: number, den: number) {
  if (!den) return '—'
  return `${((num / den) * 100).toFixed(1)}%`
}

function relDate(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function stepLabel(n: number) {
  if (n === 1) return 'Initial email'
  if (n === 2) return 'Follow-up'
  return 'Closing email'
}

// ── actions ──────────────────────────────────────────────────────────────
async function doStart() {
  if (!campaign.value) return
  actionLoading.value = true
  try {
    campaign.value = await startCampaign(campaign.value.id)
    toast.add({ title: 'Campaign started', color: 'success', icon: 'i-lucide-play-circle' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to start', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { actionLoading.value = false }
}

async function doPause() {
  if (!campaign.value) return
  actionLoading.value = true
  try {
    campaign.value = await pauseCampaign(campaign.value.id)
    toast.add({ title: 'Campaign paused', color: 'neutral', icon: 'i-lucide-pause-circle' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to pause', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { actionLoading.value = false }
}

async function doComplete() {
  if (!campaign.value) return
  actionLoading.value = true
  try {
    campaign.value = await completeCampaign(campaign.value.id)
    toast.add({ title: 'Campaign marked complete', color: 'info', icon: 'i-lucide-check-circle' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { actionLoading.value = false }
}

async function doArchive() {
  if (!campaign.value) return
  actionLoading.value = true
  try {
    campaign.value = await archiveCampaign(campaign.value.id)
    toast.add({ title: 'Campaign archived', color: 'neutral', icon: 'i-lucide-archive' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { actionLoading.value = false }
}

function fmtVar(v: string): string { return ['{{', v, '}}'].join('') }

// ── edit modal ────────────────────────────────────────────────────────
const editOpen = ref(false)
const editSaving = ref(false)
const editForm = reactive({
  name: '',
  description: '',
  daily_volume_cap: 200,
  ends_at: '',
})

function openEdit() {
  if (!campaign.value) return
  editForm.name = campaign.value.name
  editForm.description = campaign.value.description ?? ''
  editForm.daily_volume_cap = campaign.value.daily_volume_cap
  editForm.ends_at = campaign.value.ends_at ? campaign.value.ends_at.slice(0, 10) : ''
  editOpen.value = true
}

async function saveEdit() {
  if (!campaign.value) return
  editSaving.value = true
  try {
    const isDraft = campaign.value.status === 'draft'
    const payload: Record<string, unknown> = {
      daily_volume_cap: editForm.daily_volume_cap,
      ends_at: editForm.ends_at || null,
    }
    if (isDraft) {
      payload.name = editForm.name
      payload.description = editForm.description || null
    }
    campaign.value = await updateCampaign(campaign.value.id, payload)
    editOpen.value = false
    toast.add({ title: 'Campaign updated', color: 'success', icon: 'i-lucide-check-circle' })
  }
  catch (e: any) {
    toast.add({ title: 'Update failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { editSaving.value = false }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <NuxtLink to="/campaigns" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to campaigns
    </NuxtLink>

    <AppPageLoader v-if="pageLoading" label="Loading campaign…" />

    <div v-else-if="notFound" class="text-center py-24">
      <UIcon name="i-lucide-send" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-lg font-semibold text-highlighted mb-1">Campaign not found</p>
      <NuxtLink to="/campaigns" class="text-sm text-primary hover:underline">Back to campaigns</NuxtLink>
    </div>

    <template v-else-if="campaign">

      <!-- Header -->
      <div class="flex items-start justify-between mb-6 gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-2xl font-semibold text-highlighted truncate">{{ campaign.name }}</h1>
            <UBadge :color="statusColor(campaign.status)" variant="subtle" class="capitalize shrink-0">
              {{ displayStatus(campaign.status) }}
            </UBadge>
          </div>
          <p class="text-sm text-muted capitalize">
            {{ campaign.campaign_type.replace('_', ' ') }} ·
            {{ campaign.daily_volume_cap }} emails/day limit ·
            <span v-if="campaign.started_at">Started {{ relDate(campaign.started_at) }}</span>
            <span v-else>Not started</span>
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton
            v-if="campaign.status === 'running'"
            icon="i-lucide-pause"
            color="neutral"
            variant="subtle"
            :loading="actionLoading"
            @click="doPause"
          >
            Pause
          </UButton>
          <UButton
            v-if="campaign.status === 'paused' || campaign.status === 'draft'"
            icon="i-lucide-play"
            :loading="actionLoading"
            @click="doStart"
          >
            {{ campaign.status === 'draft' ? 'Launch' : 'Resume' }}
          </UButton>
          <UDropdownMenu :items="[[
            { label: 'Edit', icon: 'i-lucide-pencil', onSelect: openEdit },
            { label: 'Mark complete', icon: 'i-lucide-check-circle', onSelect: doComplete, disabled: campaign.status === 'draft' || campaign.status === 'completed' || campaign.status === 'archived' },
            { label: 'Archive', icon: 'i-lucide-archive', onSelect: doArchive, disabled: campaign.status === 'archived' },
          ]]">
            <UButton icon="i-lucide-more-horizontal" color="neutral" variant="subtle" />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-0 border-b border-default mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
          :class="activeTab === tab.value
            ? 'border-primary text-primary'
            : 'border-transparent text-muted hover:text-highlighted'"
          @click="activeTab = tab.value"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>

      <!-- ══ OVERVIEW ══ -->
      <template v-if="activeTab === 'overview'">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <UCard>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">Sent</p>
            <p class="text-3xl font-semibold text-highlighted tabular-nums">{{ campaign.total_sent.toLocaleString() }}</p>
            <div class="mt-2">
              <div class="flex justify-between text-xs text-muted mb-1">
                <span>Progress</span><span>{{ progress }}%</span>
              </div>
              <div class="h-1.5 bg-elevated rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full" :style="{ width: `${progress}%` }" />
              </div>
            </div>
          </UCard>
          <UCard>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">Open Rate</p>
            <p
              class="text-3xl font-semibold tabular-nums"
              :class="Number(openRate) >= 30 ? 'text-success-600' : Number(openRate) >= 15 ? 'text-warning-600' : 'text-error-600'"
            >
              {{ openRate }}%
            </p>
            <p class="text-xs text-muted mt-1">{{ campaign.total_opened.toLocaleString() }} opened</p>
          </UCard>
          <UCard>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">Reply Rate</p>
            <p
              class="text-3xl font-semibold tabular-nums"
              :class="Number(replyRate) >= 8 ? 'text-success-600' : Number(replyRate) >= 3 ? 'text-warning-600' : 'text-muted'"
            >
              {{ replyRate }}%
            </p>
            <p class="text-xs text-muted mt-1">{{ campaign.total_replied.toLocaleString() }} replies</p>
          </UCard>
          <UCard>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">Bounce Rate</p>
            <p
              class="text-3xl font-semibold tabular-nums"
              :class="Number(bounceRate) >= 5 ? 'text-error-600' : Number(bounceRate) >= 2 ? 'text-warning-600' : 'text-success-600'"
            >
              {{ bounceRate }}%
            </p>
            <p class="text-xs text-muted mt-1">{{ campaign.total_bounced.toLocaleString() }} bounced</p>
          </UCard>
        </div>

        <!-- Campaign details -->
        <UCard class="max-w-2xl">
          <h3 class="text-sm font-semibold text-highlighted mb-4">Campaign details</h3>
          <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Type</p>
              <p class="text-default capitalize">{{ campaign.campaign_type.replace('_', ' ') }}</p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Daily cap</p>
              <p class="text-default">{{ campaign.daily_volume_cap.toLocaleString() }} emails</p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Send window</p>
              <p class="text-default">{{ campaign.send_window_start }} – {{ campaign.send_window_end }}</p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Timezone</p>
              <p class="text-default">{{ campaign.timezone }}</p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Started</p>
              <p class="text-default">{{ relDate(campaign.started_at) }}</p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">Audience</p>
              <p class="text-default">{{ (campaign.actual_audience_size ?? campaign.estimated_audience_size ?? 0).toLocaleString() }} contacts</p>
            </div>
          </div>
        </UCard>
      </template>

      <!-- ══ SEQUENCE ══ -->
      <template v-else-if="activeTab === 'sequence'">
        <div v-if="templateSteps.length === 0" class="py-16 text-center">
          <UIcon name="i-lucide-git-branch" class="w-10 h-10 text-muted mx-auto mb-3" />
          <p class="text-sm font-semibold text-highlighted mb-1">No sequence configured</p>
          <p class="text-xs text-muted">This campaign has no email sequence yet.</p>
        </div>
        <div v-else class="h-170 rounded-xl overflow-hidden border border-default">
          <VueFlow
            :nodes="flowNodes"
            :edges="flowEdges"
            :node-types="nodeTypes"
            fit-view-on-init
            :nodes-draggable="false"
            :nodes-connectable="false"
            :elements-selectable="false"
            :min-zoom="0.25"
            :max-zoom="1.5"
          >
            <Background pattern-color="#374151" :gap="20" :size="1" />
            <Controls />
          </VueFlow>
        </div>
      </template>

      <!-- ══ CONTACTS ══ -->
      <template v-else-if="activeTab === 'contacts'">
        <div class="py-16 text-center">
          <UIcon name="i-lucide-users" class="w-10 h-10 text-muted mx-auto mb-3" />
          <p class="text-sm font-semibold text-highlighted mb-1">Contact-level data not yet available</p>
          <p class="text-xs text-muted">Per-contact campaign history will be shown here when the API is ready.</p>
        </div>
      </template>

      <!-- ══ SENT LOG ══ -->
      <template v-else-if="activeTab === 'sentlog'">
        <div class="py-16 text-center">
          <UIcon name="i-lucide-send" class="w-10 h-10 text-muted mx-auto mb-3" />
          <p class="text-sm font-semibold text-highlighted mb-1">Sent log not yet available</p>
          <p class="text-xs text-muted">Individual send events will appear here when the API is ready.</p>
        </div>
      </template>

      <!-- ══ SETTINGS ══ -->
      <template v-else-if="activeTab === 'settings'">
        <UCard class="max-w-2xl space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Campaign name</label>
              <UInput :model-value="campaign.name" readonly />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Type</label>
              <UInput :model-value="campaign.campaign_type.replace('_', ' ')" readonly class="capitalize" />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Daily send cap</label>
              <UInput :model-value="String(campaign.daily_volume_cap)" readonly />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Max follow-ups</label>
              <UInput :model-value="String(campaign.max_follow_ups)" readonly />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Send window</label>
              <UInput :model-value="`${campaign.send_window_start} – ${campaign.send_window_end}`" readonly />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Timezone</label>
              <UInput :model-value="campaign.timezone" readonly />
            </div>
          </div>
          <p class="text-xs text-muted">Settings are read-only. To modify, pause the campaign first.</p>
        </UCard>
      </template>

      <!-- Edit modal -->
      <UModal v-model:open="editOpen">
        <template #content>
          <UCard class="max-w-md w-full">
            <template #header>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-semibold text-highlighted">Edit campaign</h3>
                  <p class="text-xs text-muted mt-0.5">
                    {{ campaign.status === 'draft' ? 'All fields editable while in draft.' : 'Only daily cap and end date can be changed while running.' }}
                  </p>
                </div>
                <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="editOpen = false" />
              </div>
            </template>

            <div class="space-y-4">
              <div v-if="campaign.status === 'draft'">
                <label class="block text-sm font-medium text-highlighted mb-1.5">Name</label>
                <UInput v-model="editForm.name" placeholder="Campaign name" />
              </div>
              <div v-if="campaign.status === 'draft'">
                <label class="block text-sm font-medium text-highlighted mb-1.5">Description <span class="text-muted font-normal">(optional)</span></label>
                <UInput v-model="editForm.description" placeholder="Internal notes…" />
              </div>
              <div>
                <label class="block text-sm font-medium text-highlighted mb-1.5">Daily volume cap</label>
                <div class="flex items-center gap-2">
                  <UInput v-model="editForm.daily_volume_cap" type="number" :min="1" :max="10000" class="w-32" />
                  <span class="text-sm text-muted">emails / day</span>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-highlighted mb-1.5">End date <span class="text-muted font-normal">(optional)</span></label>
                <UInput v-model="editForm.ends_at" type="date" />
                <p class="text-xs text-muted mt-1">Leave blank for no end date.</p>
              </div>
              <UButton block :loading="editSaving" :disabled="!editForm.name.trim()" @click="saveEdit">
                Save changes
              </UButton>
            </div>
          </UCard>
        </template>
      </UModal>

    </template>
  </div>
</template>
