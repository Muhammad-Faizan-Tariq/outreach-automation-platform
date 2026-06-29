<script setup lang="ts">
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
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

const route = useRoute()
const flowName = ref('Palm Jumeirah Email Sequence')

const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  wait: WaitNode,
  condition: ConditionNode,
  action: ActionNode,
}

const demoNodes = [
  { id: '1', type: 'trigger', position: { x: 250, y: 40 }, data: { label: 'Lead Enrolled' } },
  { id: '2', type: 'message', position: { x: 200, y: 160 }, data: { label: 'Initial Email', template: 'palm_intro_v1' } },
  { id: '3', type: 'wait', position: { x: 220, y: 300 }, data: { label: '3 days', delay: 3, unit: 'days' } },
  { id: '4', type: 'condition', position: { x: 170, y: 430 }, data: { label: 'Did they reply?' } },
  { id: '5', type: 'action', position: { x: 60, y: 570 }, data: { label: 'Mark Qualified' } },
  { id: '6', type: 'message', position: { x: 300, y: 570 }, data: { label: 'Follow-up Email', template: 'palm_followup_v1' } },
  { id: '7', type: 'action', position: { x: 300, y: 700 }, data: { label: 'Mark as Dead' } },
]

const demoEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
  { id: 'e4-5', source: '4', sourceHandle: 'yes', target: '5', label: 'Yes', style: { stroke: '#22c55e' }, labelStyle: { fill: '#22c55e', fontWeight: 600 } },
  { id: 'e4-6', source: '4', sourceHandle: 'no', target: '6', label: 'No', style: { stroke: '#ef4444' }, labelStyle: { fill: '#ef4444', fontWeight: 600 } },
  { id: 'e6-7', source: '6', target: '7', animated: true },
]

const isBlank = route.query.blank === '1'
const nodes = ref(isBlank ? [{ id: '1', type: 'trigger', position: { x: 260, y: 80 }, data: { label: 'Lead Enrolled' } }] : [...demoNodes])
const edges = ref(isBlank ? [] : [...demoEdges])

// ── Vue Flow composable — called ONCE ────────────────────────────────────────
const { onConnect, addEdges, addNodes, findNode, removeNodes, screenToFlowCoordinate } = useVueFlow()
onConnect(params => addEdges(params))

const selectedNode = ref<any>(null)
function onNodeClick({ node }: { node: any }) {
  selectedNode.value = { ...node, data: { ...node.data } }
}
function closePanel() {
  selectedNode.value = null
}

let nodeIdCounter = 20

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
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const type = event.dataTransfer?.getData('application/vue-flow-type')
  if (!type) return

  const position = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY,
  })

  const defaultData: Record<string, any> = {
    message: { label: 'Send Email', template: '' },
    wait: { label: '3 days', delay: 3, unit: 'days' },
    condition: { label: 'Condition' },
    action: { label: 'Mark Qualified' },
  }

  addNodes([{
    id: `node-${nodeIdCounter++}`,
    type,
    position,
    data: defaultData[type] ?? { label: type },
  }])
}

function saveNodeConfig() {
  if (!selectedNode.value) return
  const node = findNode(selectedNode.value.id)
  if (node) {
    node.data = { ...selectedNode.value.data }
  }
  closePanel()
}

function deleteNode() {
  if (!selectedNode.value) return
  removeNodes([selectedNode.value.id])
  closePanel()
}

const saving = ref(false)
async function saveFlow() {
  saving.value = true
  await new Promise(r => setTimeout(r, 600))
  saving.value = false
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">

    <div class="h-14 shrink-0 flex items-center justify-between px-4 border-b border-default bg-default gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <NuxtLink to="/automation/flows/email" class="text-muted hover:text-highlighted transition-colors shrink-0">
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        </NuxtLink>
        <UIcon name="i-lucide-git-branch-plus" class="w-4 h-4 text-blue-600 shrink-0" />
        <input
          v-model="flowName"
          class="text-sm font-semibold text-highlighted bg-transparent border-none outline-none min-w-0 max-w-64"
        >
        <UBadge color="success" variant="subtle" size="xs">
          Active
        </UBadge>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <UButton color="neutral" variant="subtle" size="sm" icon="i-lucide-users">
          Enroll Contacts
        </UButton>
        <UButton size="sm" icon="i-lucide-save" :loading="saving" @click="saveFlow">
          Save Flow
        </UButton>
      </div>
    </div>

    <div class="flex flex-1 min-h-0">

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
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-grab active:cursor-grabbing bg-elevated hover:border-primary/50 transition-colors select-none"
            :class="item.border"
            @dragstart="onDragStart($event, item.type)"
          >
            <div class="w-6 h-6 rounded-md flex items-center justify-center shrink-0" :class="item.bg">
              <UIcon :name="item.icon" class="w-3.5 h-3.5" :class="item.color" />
            </div>
            <span class="text-xs font-medium text-highlighted">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <div
        class="flex-1 min-w-0 bg-elevated"
        @dragover="onDragOver"
        @drop="onDrop"
      >
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          fit-view-on-init
          :delete-key-code="['Delete', 'Backspace']"
          :min-zoom="0.3"
          :max-zoom="2"
          @node-click="onNodeClick"
        >
          <Background pattern-color="#374151" :gap="20" :size="1" />
          <Controls />
          <Panel position="top-right" class="bg-default border border-default rounded-lg px-3 py-2 text-xs text-muted shadow">
            Click a node to configure · Drag from sidebar to add
          </Panel>
        </VueFlow>
      </div>

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
              <UInput v-model="selectedNode.data.label" placeholder="Node label…" />
            </div>

            <template v-if="selectedNode.type === 'message'">
              <div>
                <label class="block text-xs font-medium text-muted mb-1.5">
                  Email Template
                </label>
                <UInput v-model="selectedNode.data.template" placeholder="template_name…" />
              </div>
            </template>

            <template v-if="selectedNode.type === 'wait'">
              <div>
                <label class="block text-xs font-medium text-muted mb-1.5">
                  Delay amount
                </label>
                <UInput v-model.number="selectedNode.data.delay" type="number" :min="1" />
              </div>
              <div>
                <label class="block text-xs font-medium text-muted mb-1.5">
                  Unit
                </label>
                <USelect
                  v-model="selectedNode.data.unit"
                  :items="[{ label: 'Hours', value: 'hours' }, { label: 'Days', value: 'days' }]"
                  value-key="value"
                  label-key="label"
                />
              </div>
            </template>

            <template v-if="selectedNode.type === 'condition'">
              <div class="bg-elevated rounded-lg p-3 text-xs text-muted space-y-1">
                <p class="font-semibold text-highlighted">
                  Outputs
                </p>
                <p>
                  <span class="text-success-600 font-semibold">Yes</span> — left handle
                </p>
                <p>
                  <span class="text-error-500 font-semibold">No</span> — right handle
                </p>
              </div>
            </template>

            <template v-if="selectedNode.type === 'action'">
              <div>
                <label class="block text-xs font-medium text-muted mb-1.5">
                  Action type
                </label>
                <USelect
                  v-model="selectedNode.data.label"
                  :items="[
                    { label: 'Mark as Qualified', value: 'Mark Qualified' },
                    { label: 'Mark as Dead', value: 'Mark as Dead' },
                    { label: 'Mark as Not Interested', value: 'Not Interested' },
                    { label: 'Assign to Agent', value: 'Assign to Agent' },
                    { label: 'Stop Flow', value: 'Stop Flow' },
                  ]"
                  value-key="value"
                  label-key="label"
                />
              </div>
            </template>
          </div>

          <div class="px-4 py-3 border-t border-default flex gap-2">
            <UButton color="error" variant="subtle" icon="i-lucide-trash-2" @click="deleteNode" />
            <UButton class="flex-1 justify-center" @click="saveNodeConfig">
              Apply Changes
            </UButton>
          </div>
        </div>
      </transition>

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
