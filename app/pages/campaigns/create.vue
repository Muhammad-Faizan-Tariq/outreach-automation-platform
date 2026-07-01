<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
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

import type { EmailTemplate } from '~/composables/useTemplates'
import type { AudiencePreview } from '~/composables/useCampaigns'

const router = useRouter()
const toast = useToast()
const { createCampaign, previewAudience } = useCampaigns()
const { templates, loading: templatesLoading, fetchTemplates, previewTemplate } = useTemplates()

// ── Step state ────────────────────────────────────────────────────────────────
const step = ref(1)
const totalSteps = 4

const stepTitles = [
  { n: 1, label: 'Campaign info', icon: 'i-lucide-settings-2' },
  { n: 2, label: 'Audience', icon: 'i-lucide-users' },
  { n: 3, label: 'Sequence', icon: 'i-lucide-git-branch' },
  { n: 4, label: 'Schedule', icon: 'i-lucide-calendar' },
]

// ── Form ──────────────────────────────────────────────────────────────────────
const form = reactive({
  name: '',
  description: '',
  campaign_type: 'owner_sell' as 'owner_sell' | 'owner_rent_out',
  locations: '',
  daily_volume_cap: 200,
  send_window_start: '08:00',
  send_window_end: '18:00',
  send_days_of_week: [1, 2, 3, 4, 5] as number[],
  timezone: 'Asia/Dubai',
})

const CAMPAIGN_TYPES = [
  { label: 'Owner – Sell', value: 'owner_sell' },
  { label: 'Owner – Rent out', value: 'owner_rent_out' },
]

const WEEKDAYS = [
  { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }, { label: 'Sun', value: 0 },
]

// ── Audience preview ──────────────────────────────────────────────────────────
const audiencePreview = ref<AudiencePreview | null>(null)
const previewLoading = ref(false)

function buildAudienceFilter(): Record<string, unknown> {
  const locs = form.locations.split(',').map(s => s.trim()).filter(Boolean)
  return locs.length ? { locations: locs } : {}
}

async function runAudiencePreview() {
  previewLoading.value = true
  try {
    audiencePreview.value = await previewAudience({
      campaign_type: form.campaign_type,
      audience_filter: buildAudienceFilter(),
      apply_cooldown: true,
    })
  }
  catch (e: any) {
    toast.add({ title: 'Preview failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    previewLoading.value = false
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────
async function loadTemplates() {
  await fetchTemplates({ campaign_type: form.campaign_type, is_active: true, page_size: 200 })
}

// Reload when campaign type changes
watch(() => form.campaign_type, () => loadTemplates())

// Load immediately on mount — don't wait for step 3
onMounted(() => loadTemplates())

const templateSelectOptions = computed(() => [
  { label: '— Select template —', value: '' },
  ...templates.value.map((t: EmailTemplate) => ({ label: t.name, value: t.id })),
])

// ── Template variable chips ───────────────────────────────────────────────────
const VARIABLE_SOURCES: Record<string, string> = {
  first_name: 'contact',
  last_name: 'contact',
  full_name: 'contact',
  email: 'contact',
  country: 'contact',
  location: 'property',
  project_name: 'property',
  building_name: 'property',
  unit_number: 'property',
  rooms: 'property',
  size_sqft: 'property',
  estimated_value: 'property',
  unsubscribe_url: 'auto',
  tracking_pixel: 'auto'
}

const SAMPLE_VARS: Record<string, string> = {
  first_name: 'Ahmed',
  last_name: 'Al Mansoori',
  full_name: 'Ahmed Al Mansoori',
  email: 'ahmed@example.com',
  country: 'UAE',
  location: 'Palm Jumeirah',
  project_name: 'Signature Villas',
  building_name: 'Frond G',
  unit_number: '14',
  rooms: '5',
  size_sqft: '6500',
  estimated_value: '12,500,000',
  unsubscribe_url: '#unsubscribe',
  tracking_pixel: ''
}

const selectedTemplateObj = computed<EmailTemplate | null>(() =>
  selectedNodeData.template
    ? templates.value.find(t => t.id === selectedNodeData.template) ?? null
    : null
)

// ── Email preview modal ───────────────────────────────────────────────────────
const previewOpen = ref(false)
const emailPreviewLoading = ref(false)
const previewSubject = ref('')
const previewHtml = ref('')
const previewMissing = ref<string[]>([])

async function openPreview() {
  const tid = selectedNodeData.template
  if (!tid) return
  emailPreviewLoading.value = true
  try {
    const result = await previewTemplate(tid, SAMPLE_VARS)
    previewSubject.value = result.subject
    previewHtml.value = result.body_html
    previewMissing.value = result.missing_variables ?? []
    previewOpen.value = true
  } catch (e: unknown) {
    const msg = (e as { data?: { detail?: string } })?.data?.detail ?? 'Error'
    toast.add({ title: 'Preview failed', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    emailPreviewLoading.value = false
  }
}

function varChip(name: string) {
  return '{{' + name + '}}'
}

// ── Step 3 starting point picker ─────────────────────────────────────────────
const sequenceStarted = ref(false)

const builtInNodes = [
  { id: 's1', type: 'trigger', position: { x: 260, y: 40 }, data: { label: 'Lead Enrolled' } },
  { id: 's2', type: 'message', position: { x: 210, y: 180 }, data: { label: 'Initial Email', template: '' } },
  { id: 's3', type: 'wait', position: { x: 230, y: 320 }, data: { label: '3 days', delay: 3, unit: 'days' } },
  { id: 's4', type: 'condition', position: { x: 180, y: 450 }, data: { label: 'Did they reply?' } },
  { id: 's5', type: 'action', position: { x: 60, y: 600 }, data: { label: 'Mark Qualified' } },
  { id: 's6', type: 'message', position: { x: 310, y: 600 }, data: { label: 'Follow-up Email', template: '' } },
  { id: 's7', type: 'wait', position: { x: 320, y: 740 }, data: { label: '5 days', delay: 5, unit: 'days' } },
  { id: 's8', type: 'action', position: { x: 320, y: 870 }, data: { label: 'Mark as Dead' } },
]

const builtInEdges = [
  { id: 'se1', source: 's1', target: 's2', animated: true },
  { id: 'se2', source: 's2', target: 's3', animated: true },
  { id: 'se3', source: 's3', target: 's4', animated: true },
  { id: 'se4', source: 's4', sourceHandle: 'yes', target: 's5', label: 'Yes', style: { stroke: '#22c55e' }, labelStyle: { fill: '#22c55e', fontWeight: 600 } },
  { id: 'se5', source: 's4', sourceHandle: 'no', target: 's6', label: 'No', style: { stroke: '#ef4444' }, labelStyle: { fill: '#ef4444', fontWeight: 600 } },
  { id: 'se6', source: 's6', target: 's7', animated: true },
  { id: 'se7', source: 's7', target: 's8', animated: true },
]

function startWithBlank() {
  nodes.value = [{ id: '1', type: 'trigger', position: { x: 260, y: 60 }, data: { label: 'Lead Enrolled' } }]
  edges.value = []
  sequenceStarted.value = true
}

function startWithTemplate() {
  nodes.value = [...builtInNodes]
  edges.value = [...builtInEdges]
  sequenceStarted.value = true
}

// Reset picker when going back from step 3
watch(step, (val) => {
  if (val !== 3) sequenceStarted.value = false
})

// Clear VueFlow nodes before the page unmounts to prevent null-ref crashes
// from Vue Flow's internal cleanup racing with Vue's DOM teardown
onBeforeUnmount(() => {
  nodes.value = []
  edges.value = []
})

// ── Vue Flow — Step 3 canvas ─────────────────────────────────────────────────
const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  wait: WaitNode,
  condition: ConditionNode,
  action: ActionNode,
}

const nodes = ref([
  { id: '1', type: 'trigger', position: { x: 260, y: 60 }, data: { label: 'Lead Enrolled' } },
])
const edges = ref<any[]>([])

const { onConnect, addEdges, addNodes, findNode, removeNodes, screenToFlowCoordinate } = useVueFlow()
onConnect(params => addEdges(params))

const selectedNode = ref<any>(null)
const selectedNodeData = reactive<Record<string, any>>({})
let nodeIdCounter = 10

const paletteItems = [
  { type: 'message', label: 'Send Email', icon: 'i-lucide-mail', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-400' },
  { type: 'wait', label: 'Wait / Delay', icon: 'i-lucide-clock', color: 'text-orange-500', bg: 'bg-orange-400/10', border: 'border-orange-400' },
  { type: 'condition', label: 'Condition', icon: 'i-lucide-split', color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-400' },
  { type: 'action', label: 'Action', icon: 'i-lucide-tag', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-400' },
]

function onDragStart(event: DragEvent, type: string) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/vue-flow-type', type)
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

const defaultNodeData: Record<string, Record<string, unknown>> = {
  message: { label: 'Send Email', template: '' },
  wait: { label: '3 days', delay: 3, unit: 'days' },
  condition: { label: 'Did they reply?' },
  action: { label: 'Mark Qualified' },
}

function addNodeToCanvas(type: string, position?: { x: number; y: number }) {
  const last = nodes.value[nodes.value.length - 1]
  const pos = position ?? (last ? { x: last.position.x, y: last.position.y + 170 } : { x: 260, y: 220 })
  const data = defaultNodeData[type] ? { ...defaultNodeData[type] } : { label: type }
  addNodes([{ id: `node-${nodeIdCounter++}`, type, position: pos, data }])
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const type = event.dataTransfer?.getData('application/vue-flow-type')
  if (!type) return
  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  addNodeToCanvas(type, position)
}

function onNodeClick({ node }: { node: any }) {
  selectedNode.value = node
  Object.keys(selectedNodeData).forEach(k => delete selectedNodeData[k])
  Object.assign(selectedNodeData, { ...node.data })
}

function closePanel() {
  selectedNode.value = null
}

function saveNodeConfig() {
  if (!selectedNode.value) return
  const node = findNode(selectedNode.value.id)
  if (node) node.data = { ...selectedNodeData }
  closePanel()
}

function deleteNode() {
  if (!selectedNode.value) return
  removeNodes([selectedNode.value.id])
  closePanel()
}

// Walk the canvas graph and build the API payload
function extractTemplatesPayload() {
  const allNodes = nodes.value
  const allEdges = edges.value
  const trigger = allNodes.find(n => n.type === 'trigger')
  if (!trigger) return []

  const result: { step_number: number; template_id: string; delay_days: number }[] = []
  let currentId = trigger.id
  let stepNum = 0
  let pendingDelay = 0
  const visited = new Set<string>()

  while (currentId) {
    if (visited.has(currentId)) break
    visited.add(currentId)
    const node = allNodes.find(n => n.id === currentId)
    if (!node) break

    if (node.type === 'message' && node.data.template) {
      stepNum++
      result.push({ step_number: stepNum, template_id: node.data.template, delay_days: pendingDelay })
      pendingDelay = 0
    }
    else if (node.type === 'wait') {
      pendingDelay += Number(node.data.delay ?? 0)
    }

    const outEdges = allEdges.filter(e => e.source === currentId && !visited.has(e.target))
    if (!outEdges.length) break
    // For condition nodes follow the 'no' branch (follow-up path)
    const nextEdge = node.type === 'condition'
      ? (outEdges.find(e => e.sourceHandle === 'no') ?? outEdges[0])
      : outEdges[0]
    if (!nextEdge) break
    currentId = nextEdge.target
  }

  return result
}

// ── Navigation ────────────────────────────────────────────────────────────────
async function nextStep() {
  if (step.value === 2 && !audiencePreview.value) await runAudiencePreview()
  if (step.value < totalSteps) step.value++
}

function prevStep() {
  if (step.value > 1) step.value--
}

function canProceed(): boolean {
  if (step.value === 1) return !!form.name.trim()
  if (step.value === 2) return true
  if (step.value === 3) return extractTemplatesPayload().length > 0
  return true
}

// ── Launch ────────────────────────────────────────────────────────────────────
const saving = ref(false)

async function launch() {
  saving.value = true
  try {
    const templates_payload = extractTemplatesPayload()
    const campaign = await createCampaign({
      name: form.name,
      description: form.description || null,
      campaign_type: form.campaign_type,
      audience_filter: buildAudienceFilter(),
      templates: templates_payload,
      daily_volume_cap: form.daily_volume_cap,
      send_window_start: form.send_window_start,
      send_window_end: form.send_window_end,
      send_days_of_week: form.send_days_of_week,
      timezone: form.timezone,
      max_follow_ups: templates_payload.length - 1,
    })
    toast.add({ title: 'Campaign created', description: `"${campaign.name}" saved as draft.`, color: 'success', icon: 'i-lucide-check-circle' })
    router.push(`/campaigns/${campaign.id}`)
  }
  catch (e: any) {
    toast.add({ title: 'Create failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- ── STEP 3: Full-screen canvas ── -->
  <div
    v-if="step === 3"
    class="flex flex-col h-screen overflow-hidden"
  >
    <!-- Canvas top bar -->
    <div class="h-14 shrink-0 flex items-center justify-between px-4 border-b border-default bg-default gap-4">
      <div class="flex items-center gap-3">
        <button class="text-muted hover:text-highlighted" @click="prevStep">
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        </button>
        <UIcon name="i-lucide-git-branch" class="w-4 h-4 text-primary shrink-0" />
        <div>
          <p class="text-sm font-semibold text-highlighted leading-none">
            Build email sequence
          </p>
          <p class="text-xs text-muted mt-0.5">
            {{ form.name }}
          </p>
        </div>
      </div>

      <!-- Progress pills -->
      <div class="hidden md:flex items-center gap-0">
        <template v-for="(st, i) in stepTitles" :key="st.n">
          <div
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            :class="step === st.n ? 'bg-primary/10 text-primary font-semibold' : step > st.n ? 'text-success-600' : 'text-muted'"
          >
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="step > st.n ? 'bg-success-500 text-white' : step === st.n ? 'bg-primary text-white' : 'bg-elevated text-muted'"
            >
              <UIcon
                v-if="step > st.n"
                name="i-lucide-check"
                class="w-3 h-3"
              />
              <span v-else>{{ st.n }}</span>
            </div>
            <span class="hidden lg:inline">{{ st.label }}</span>
          </div>
          <div
            v-if="i < stepTitles.length - 1"
            class="w-6 h-px bg-border-default mx-1"
          />
        </template>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <NuxtLink to="/campaigns">
          <UButton color="neutral" variant="ghost" size="sm">
            Cancel
          </UButton>
        </NuxtLink>
        <UButton
          size="sm"
          icon="i-lucide-arrow-right"
          trailing
          :disabled="!canProceed()"
          @click="nextStep"
        >
          Continue
        </UButton>
      </div>
    </div>

    <!-- Canvas body (always rendered so VueFlow is never torn down mid-session) -->
    <div class="flex flex-1 min-h-0 relative">
      <!-- Starting-point picker — absolute overlay, VueFlow stays mounted underneath -->
      <div
        v-if="!sequenceStarted"
        class="absolute inset-0 z-10 flex items-center justify-center bg-elevated"
      >
        <div class="max-w-2xl w-full px-6">
          <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
              <UIcon
                name="i-lucide-git-branch"
                class="w-6 h-6 text-primary"
              />
            </div>
            <h2 class="text-xl font-semibold text-highlighted">
              How do you want to build your sequence?
            </h2>
            <p class="text-sm text-muted mt-1">
              Choose a starting point for your email automation
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <button
              class="group flex flex-col items-start gap-3 p-6 rounded-2xl border-2 border-default bg-default hover:border-primary hover:bg-primary/5 transition-all text-left"
              @click="startWithBlank()"
            >
              <div class="w-10 h-10 rounded-xl bg-elevated group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <UIcon
                  name="i-lucide-square-dashed"
                  class="w-5 h-5 text-muted group-hover:text-primary transition-colors"
                />
              </div>
              <div>
                <p class="text-sm font-semibold text-highlighted">
                  Build from scratch
                </p>
                <p class="text-xs text-muted mt-0.5 leading-relaxed">
                  Start with only a trigger node and wire up your own flow.
                </p>
              </div>
            </button>
            <button
              class="group flex flex-col items-start gap-3 p-6 rounded-2xl border-2 border-default bg-default hover:border-primary hover:bg-primary/5 transition-all text-left"
              @click="startWithTemplate()"
            >
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <UIcon
                  name="i-lucide-layout-template"
                  class="w-5 h-5 text-primary"
                />
              </div>
              <div>
                <p class="text-sm font-semibold text-highlighted">
                  Use built-in template
                </p>
                <p class="text-xs text-muted mt-0.5 leading-relaxed">
                  Pre-built 8-step follow-up flow: initial email, wait, condition, follow-up, and closing action.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Left sidebar — palette -->
      <div class="w-52 shrink-0 border-r border-default bg-default flex flex-col">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-muted px-4 pt-4 pb-2">
          Add Nodes
        </p>
        <p class="text-xs text-muted px-4 pb-3">
          Drag a node onto the canvas
        </p>
        <div class="px-3 space-y-2">
          <div
            v-for="item in paletteItems"
            :key="item.type"
            draggable="true"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer bg-elevated hover:border-primary/50 transition-colors select-none"
            :class="item.border"
            @click="addNodeToCanvas(item.type)"
            @dragstart="onDragStart($event, item.type)"
          >
            <div class="w-6 h-6 rounded-md flex items-center justify-center shrink-0" :class="item.bg">
              <UIcon :name="item.icon" class="w-3.5 h-3.5" :class="item.color" />
            </div>
            <span class="text-xs font-medium text-highlighted">{{ item.label }}</span>
          </div>
        </div>

        <div class="mt-auto px-4 pb-4 pt-6 border-t border-default">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted mb-2">
            Tip
          </p>
          <p class="text-xs text-muted leading-relaxed">
            Connect <strong class="text-default">Send Email</strong> nodes with a template. Add <strong class="text-default">Wait</strong> between steps for delays.
          </p>
          <div v-if="extractTemplatesPayload().length > 0" class="mt-3 p-2.5 bg-success-500/10 rounded-lg">
            <p class="text-xs text-success-600 font-semibold">
              {{ extractTemplatesPayload().length }} step(s) ready
            </p>
          </div>
          <div v-else class="mt-3 p-2.5 bg-warning-500/10 rounded-lg">
            <p class="text-xs text-warning-600">
              Add at least one Send Email node with a template selected
            </p>
          </div>
        </div>
      </div>

      <!-- Canvas -->
      <div
        class="flex-1 min-w-0 bg-elevated"
        @dragover="onDragOver"
        @drop="onDrop"
      >
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :delete-key-code="['Delete', 'Backspace']"
          fit-view-on-init
          :min-zoom="0.3"
          :max-zoom="2"
          @node-click="onNodeClick"
        >
          <Background pattern-color="#374151" :gap="20" :size="1" />
          <Controls />
        </VueFlow>
      </div>

      <!-- Right panel — node config -->
      <transition name="slide">
        <div v-if="selectedNode" class="w-72 shrink-0 border-l border-default bg-default flex flex-col">
          <div class="flex items-center justify-between px-4 py-3 border-b border-default">
            <p class="text-sm font-semibold text-highlighted capitalize">
              Configure {{ selectedNode.type }}
            </p>
            <button class="text-muted hover:text-highlighted" @click="closePanel">
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div>
              <label class="block text-xs font-medium text-muted mb-1.5">
                Label
              </label>
              <UInput v-model="selectedNodeData.label" placeholder="Node label…" />
            </div>

            <!-- Send Email: template picker -->
            <template v-if="selectedNode.type === 'message'">
              <div>
                <label class="block text-xs font-medium text-muted mb-1.5">
                  Email template <span class="text-error-500">*</span>
                </label>
                <div v-if="templatesLoading" class="h-9 bg-elevated rounded-lg animate-pulse" />
                <template v-else-if="templates.length === 0">
                  <p class="text-xs text-error-500">
                    No templates found for this campaign type.
                    <NuxtLink to="/templates/create" class="underline">Create one first.</NuxtLink>
                  </p>
                </template>
                <select
                  v-else
                  v-model="selectedNodeData.template"
                  class="w-full h-9 px-3 rounded-lg border border-default bg-default text-sm text-highlighted focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">
                    — Select template —
                  </option>
                  <option v-for="t in templates" :key="t.id" :value="t.id">
                    {{ t.name }}
                  </option>
                </select>
                <p v-if="templates.length > 0 && !selectedNodeData.template" class="text-xs text-warning-600 mt-1">
                  Select a template to include this step
                </p>
              </div>

              <!-- Variable chips -->
              <div v-if="selectedTemplateObj?.required_variables?.length">
                <p class="text-xs font-medium text-muted mb-2">
                  Variables <span class="font-normal">(auto-filled from contact)</span>
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <div
                    v-for="v in selectedTemplateObj.required_variables"
                    :key="v"
                    class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20"
                  >
                    <span class="text-[11px] font-mono text-primary">{{ varChip(v) }}</span>
                    <span class="text-[10px] text-muted">· {{ VARIABLE_SOURCES[v] ?? 'contact' }}</span>
                  </div>
                </div>
              </div>

              <!-- Preview button -->
              <div v-if="selectedNodeData.template">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-eye"
                  block
                  :loading="emailPreviewLoading"
                  @click="openPreview()"
                >
                  Preview email
                </UButton>
              </div>
            </template>

            <!-- Wait: delay -->
            <template v-if="selectedNode.type === 'wait'">
              <div>
                <label class="block text-xs font-medium text-muted mb-1.5">
                  Delay (days)
                </label>
                <UInput v-model.number="selectedNodeData.delay" type="number" :min="1" />
              </div>
            </template>

            <!-- Condition: info -->
            <template v-if="selectedNode.type === 'condition'">
              <div class="bg-elevated rounded-lg p-3 text-xs text-muted space-y-1">
                <p class="font-semibold text-highlighted">
                  Outputs
                </p>
                <p>
                  <span class="text-success-600 font-semibold">Yes</span> — contact replied
                </p>
                <p>
                  <span class="text-error-500 font-semibold">No</span> — no reply (follow-up path)
                </p>
              </div>
            </template>

            <!-- Action: type -->
            <template v-if="selectedNode.type === 'action'">
              <div>
                <label class="block text-xs font-medium text-muted mb-1.5">
                  Action
                </label>
                <select
                  v-model="selectedNodeData.label"
                  class="w-full h-9 px-3 rounded-lg border border-default bg-default text-sm text-highlighted focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Mark Qualified">
                    Mark as Qualified
                  </option>
                  <option value="Mark as Dead">
                    Mark as Dead
                  </option>
                  <option value="Not Interested">
                    Mark as Not Interested
                  </option>
                  <option value="Stop Flow">
                    Stop Sequence
                  </option>
                </select>
              </div>
            </template>
          </div>

          <div class="px-4 py-3 border-t border-default flex gap-2">
            <UButton color="error" variant="subtle" icon="i-lucide-trash-2" :disabled="selectedNode?.type === 'trigger'" @click="deleteNode" />
            <UButton class="flex-1 justify-center" @click="saveNodeConfig">
              Apply
            </UButton>
          </div>
        </div>
      </transition>
    </div>

    <!-- Email preview modal (opened from node config panel) -->
    <UModal
      v-model:open="previewOpen"
      fullscreen
    >
      <template #content>
        <div class="flex flex-col h-full bg-default">
          <div class="shrink-0 flex items-center justify-between px-6 py-4 border-b border-default">
            <div class="min-w-0">
              <p class="text-xs text-muted uppercase tracking-wide mb-0.5">
                Email preview · sample contact data
              </p>
              <p class="text-base font-semibold text-highlighted truncate">
                {{ previewSubject }}
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="previewOpen = false"
            />
          </div>
          <div v-if="previewMissing.length" class="shrink-0 px-6 py-2 bg-warning-500/10 border-b border-warning-500/20">
            <p class="text-xs text-warning-600">
              <UIcon name="i-lucide-alert-triangle" class="w-3.5 h-3.5 inline mr-1" />
              Missing variables: <span class="font-mono">{{ previewMissing.join(', ') }}</span>
            </p>
          </div>
          <iframe
            v-if="previewHtml"
            :srcdoc="previewHtml"
            class="flex-1 w-full border-0 bg-white"
            sandbox="allow-same-origin"
          />
        </div>
      </template>
    </UModal>
  </div>

  <!-- ── STEPS 1, 2, 4: Narrow wizard layout ── -->
  <div v-else class="max-w-3xl mx-auto px-6 py-8">
    <NuxtLink to="/campaigns" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to campaigns
    </NuxtLink>

    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-highlighted">
        New campaign
      </h1>
      <p class="mt-0.5 text-sm text-muted">
        Set up your outreach campaign in {{ totalSteps }} steps.
      </p>
    </div>

    <!-- Progress -->
    <div class="flex items-center gap-0 mb-8">
      <template v-for="(st, i) in stepTitles" :key="st.n">
        <div
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="step === st.n ? 'bg-primary/10 text-primary font-semibold' : step > st.n ? 'text-success-600' : 'text-muted'"
        >
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            :class="step > st.n ? 'bg-success-500 text-white' : step === st.n ? 'bg-primary text-white' : 'bg-elevated text-muted'"
          >
            <UIcon v-if="step > st.n" name="i-lucide-check" class="w-3 h-3" />
            <span v-else>{{ st.n }}</span>
          </div>
          <span class="hidden sm:inline">{{ st.label }}</span>
        </div>
        <div v-if="i < stepTitles.length - 1" class="flex-1 h-px bg-border-default mx-1" />
      </template>
    </div>

    <!-- ── STEP 1: Campaign info ── -->
    <UCard v-if="step === 1" class="space-y-5">
      <h2 class="text-base font-semibold text-highlighted">
        Campaign information
      </h2>
      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Campaign name <span class="text-error-500">*</span></label>
        <UInput v-model="form.name" placeholder="e.g. Marina Q2 Outreach" />
      </div>
      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Campaign type <span class="text-error-500">*</span></label>
        <USelect v-model="form.campaign_type" :items="CAMPAIGN_TYPES" value-key="value" label-key="label" />
        <p class="text-xs text-muted mt-1">
          Determines which contact segment and templates are available.
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Description <span class="text-muted font-normal">(optional)</span></label>
        <UInput v-model="form.description" placeholder="Internal notes about this campaign…" />
      </div>
    </UCard>

    <!-- ── STEP 2: Audience ── -->
    <UCard v-else-if="step === 2" class="space-y-5">
      <h2 class="text-base font-semibold text-highlighted">
        Audience filter
      </h2>
      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Locations</label>
        <UInput v-model="form.locations" placeholder="e.g. Dubai Marina, Downtown Dubai, Palm Jumeirah" />
        <p class="text-xs text-muted mt-1">
          Comma-separated list of locations. Leave blank to include all contacts.
        </p>
      </div>
      <div class="border-t border-default pt-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-medium text-highlighted">
            Audience estimate
          </p>
          <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-refresh-cw" :loading="previewLoading" @click="runAudiencePreview">
            Refresh
          </UButton>
        </div>
        <div v-if="!audiencePreview && !previewLoading" class="text-sm text-muted text-center py-6">
          Click Refresh to estimate your audience size.
        </div>
        <div v-else-if="previewLoading" class="space-y-2 py-2">
          <div class="h-4 bg-elevated rounded animate-pulse" />
          <div class="h-4 w-2/3 bg-elevated rounded animate-pulse" />
        </div>
        <div v-else-if="audiencePreview" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-elevated rounded-lg px-3 py-2.5 text-center">
            <p class="text-lg font-semibold text-highlighted tabular-nums">
              {{ audiencePreview.total_matching.toLocaleString() }}
            </p>
            <p class="text-xs text-muted">
              Matching
            </p>
          </div>
          <div class="bg-elevated rounded-lg px-3 py-2.5 text-center">
            <p class="text-lg font-semibold text-highlighted tabular-nums">
              {{ audiencePreview.after_suppression.toLocaleString() }}
            </p>
            <p class="text-xs text-muted">
              After suppression
            </p>
          </div>
          <div class="bg-elevated rounded-lg px-3 py-2.5 text-center">
            <p class="text-lg font-semibold text-highlighted tabular-nums">
              {{ audiencePreview.after_cooldown.toLocaleString() }}
            </p>
            <p class="text-xs text-muted">
              After cooldown
            </p>
          </div>
          <div class="bg-elevated rounded-lg px-3 py-2.5 text-center">
            <p class="text-2xl font-bold text-primary tabular-nums">
              {{ audiencePreview.eligible.toLocaleString() }}
            </p>
            <p class="text-xs text-muted font-medium">
              Eligible
            </p>
          </div>
        </div>
        <div v-if="audiencePreview?.sample_contacts.length" class="mt-3">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-2">
            Sample contacts
          </p>
          <div class="space-y-1">
            <div
              v-for="c in audiencePreview.sample_contacts.slice(0, 5)"
              :key="c.id"
              class="flex items-center gap-2 text-xs text-muted"
            >
              <UIcon name="i-lucide-user" class="w-3 h-3 shrink-0" />
              <span>{{ c.full_name ?? c.email }}</span>
              <span class="font-mono">{{ c.email }}</span>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- ── STEP 4: Schedule ── -->
    <UCard v-else-if="step === 4" class="space-y-5">
      <h2 class="text-base font-semibold text-highlighted">
        Sending schedule
      </h2>
      <div>
        <label class="block text-sm font-medium text-highlighted mb-2">Daily volume cap</label>
        <div class="flex items-center gap-3">
          <UInput v-model="form.daily_volume_cap" type="number" :min="1" :max="5000" class="w-28" />
          <span class="text-sm text-muted">emails / day</span>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-highlighted mb-2">Send on days</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="day in WEEKDAYS"
            :key="day.value"
            class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
            :class="form.send_days_of_week.includes(day.value)
              ? 'bg-primary text-white border-primary'
              : 'border-default text-muted hover:border-primary/50'"
            @click="form.send_days_of_week.includes(day.value)
              ? (form.send_days_of_week = form.send_days_of_week.filter(d => d !== day.value))
              : form.send_days_of_week.push(day.value)"
          >
            {{ day.label }}
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-highlighted mb-1.5">Start time</label>
          <UInput v-model="form.send_window_start" type="time" />
        </div>
        <div>
          <label class="block text-sm font-medium text-highlighted mb-1.5">End time</label>
          <UInput v-model="form.send_window_end" type="time" />
        </div>
      </div>
      <p class="text-xs text-muted">
        Times are in {{ form.timezone }}. Emails spread evenly across the window.
      </p>
      <!-- Summary -->
      <div class="border-t border-default pt-4 space-y-2 text-sm">
        <p class="font-semibold text-highlighted mb-2">
          Summary
        </p>
        <div class="flex justify-between">
          <span class="text-muted">Name</span><span class="font-medium text-default">{{ form.name }}</span>
        </div>
        <div class="flex justify-between capitalize">
          <span class="text-muted">Type</span><span class="font-medium text-default">{{ form.campaign_type.replace('_', ' ') }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">Eligible audience</span><span class="font-medium text-default">{{ audiencePreview?.eligible.toLocaleString() ?? '—' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">Sequence steps</span><span class="font-medium text-default">{{ extractTemplatesPayload().length }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">Daily cap</span><span class="font-medium text-default">{{ form.daily_volume_cap.toLocaleString() }}</span>
        </div>
      </div>
      <p class="text-xs text-muted">
        Campaign will be created as <strong>draft</strong> — launch it from the campaign detail page.
      </p>
    </UCard>

    <!-- Navigation -->
    <div class="flex justify-between mt-6">
      <UButton v-if="step > 1" icon="i-lucide-arrow-left" color="neutral" variant="subtle" @click="prevStep">
        Back
      </UButton>
      <div v-else />
      <div class="flex gap-2">
        <NuxtLink to="/campaigns">
          <UButton color="neutral" variant="ghost">
            Cancel
          </UButton>
        </NuxtLink>
        <UButton
          v-if="step < totalSteps"
          icon="i-lucide-arrow-right"
          trailing
          :disabled="!canProceed()"
          :loading="previewLoading"
          @click="nextStep"
        >
          Continue
        </UButton>
        <UButton
          v-else
          icon="i-lucide-check"
          :loading="saving"
          :disabled="!canProceed()"
          @click="launch"
        >
          Create campaign
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
