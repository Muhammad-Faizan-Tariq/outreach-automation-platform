<script setup lang="ts">
const router = useRouter()

const flows = ref([
  { id: '1', name: 'Palm Jumeirah Email Sequence', status: 'active', steps: 4, enrolled: 89, replied: 21, created_at: '2026-06-05' },
])

type StatusColor = 'success' | 'neutral' | 'warning'
function statusColor(s: string): StatusColor {
  return s === 'active' ? 'success' : s === 'paused' ? 'warning' : 'neutral'
}

// ── Create modal ──────────────────────────────────────────────────────────────
const showModal = ref(false)
const form = reactive({ name: '', description: '' })
const startMode = ref<'blank' | 'template'>('blank')
const saving = ref(false)
const canSave = computed(() => form.name.trim().length > 0)

function openModal() {
  form.name = ''
  form.description = ''
  startMode.value = 'blank'
  showModal.value = true
}

async function create() {
  if (!canSave.value) return
  saving.value = true
  await new Promise(r => setTimeout(r, 300))
  const newId = Date.now().toString()
  saving.value = false
  showModal.value = false
  const query = startMode.value === 'blank' ? '?blank=1' : ''
  router.push(`/automation/flows/email/${newId}${query}`)
}
</script>

<template>
  <div class="px-6 py-8 max-w-6xl mx-auto">

    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Email Flows
        </h1>
        <p class="text-sm text-muted mt-0.5">
          Automated follow-up sequences sent via Email
        </p>
      </div>
      <UButton icon="i-lucide-plus" @click="openModal">
        New Flow
      </UButton>
    </div>

    <div v-if="flows.length === 0" class="text-center py-24">
      <UIcon name="i-lucide-git-branch-plus" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-lg font-semibold text-highlighted mb-1">
        No flows yet
      </p>
      <p class="text-sm text-muted mb-4">
        Create your first automated email follow-up sequence
      </p>
      <UButton icon="i-lucide-plus" @click="openModal">
        Create Flow
      </UButton>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <NuxtLink
        v-for="flow in flows"
        :key="flow.id"
        :to="`/automation/flows/email/${flow.id}`"
        class="block"
      >
        <UCard class="hover:border-primary/50 transition-colors cursor-pointer h-full">
          <div class="space-y-4">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-git-branch-plus" class="w-4 h-4 text-blue-600" />
                </div>
                <p class="font-semibold text-highlighted truncate">
                  {{ flow.name }}
                </p>
              </div>
              <UBadge :color="statusColor(flow.status)" variant="subtle" size="xs" class="capitalize shrink-0">
                {{ flow.status }}
              </UBadge>
            </div>
            <div class="grid grid-cols-3 gap-2 pt-1 border-t border-default">
              <div class="text-center">
                <p class="text-lg font-bold text-highlighted">
                  {{ flow.steps }}
                </p>
                <p class="text-[10px] text-muted uppercase tracking-wide">
                  Steps
                </p>
              </div>
              <div class="text-center border-x border-default">
                <p class="text-lg font-bold text-highlighted">
                  {{ flow.enrolled }}
                </p>
                <p class="text-[10px] text-muted uppercase tracking-wide">
                  Enrolled
                </p>
              </div>
              <div class="text-center">
                <p class="text-lg font-bold text-success-600">
                  {{ flow.replied }}
                </p>
                <p class="text-[10px] text-muted uppercase tracking-wide">
                  Replied
                </p>
              </div>
            </div>
            <p class="text-xs text-muted">
              Created {{ new Date(flow.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
            </p>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Create flow modal -->
    <UModal v-model:open="showModal" title="New Email Flow" :ui="{ width: 'sm:max-w-lg' }">
      <template #body>
        <div class="space-y-5 p-1">

          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Flow name <span class="text-error-500">*</span>
            </label>
            <UInput
              v-model="form.name"
              placeholder="e.g. Palm Jumeirah Email Sequence"
              autofocus
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Description <span class="text-muted font-normal normal-case">(optional)</span>
            </label>
            <UTextarea v-model="form.description" :rows="2" placeholder="What is this flow for?" />
          </div>

          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-2.5">
              Starting point
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="flex flex-col items-start gap-2 p-3.5 rounded-xl border-2 transition-colors text-left"
                :class="startMode === 'blank' ? 'border-primary bg-primary/5' : 'border-default bg-elevated hover:border-muted'"
                @click="startMode = 'blank'"
              >
                <div class="w-7 h-7 rounded-md flex items-center justify-center" :class="startMode === 'blank' ? 'bg-primary/15' : 'bg-muted/10'">
                  <UIcon name="i-lucide-square-dashed" class="w-3.5 h-3.5" :class="startMode === 'blank' ? 'text-primary' : 'text-muted'" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-highlighted">
                    Blank canvas
                  </p>
                  <p class="text-xs text-muted mt-0.5">
                    Build from scratch
                  </p>
                </div>
              </button>
              <button
                type="button"
                class="flex flex-col items-start gap-2 p-3.5 rounded-xl border-2 transition-colors text-left"
                :class="startMode === 'template' ? 'border-primary bg-primary/5' : 'border-default bg-elevated hover:border-muted'"
                @click="startMode = 'template'"
              >
                <div class="w-7 h-7 rounded-md flex items-center justify-center" :class="startMode === 'template' ? 'bg-primary/15' : 'bg-muted/10'">
                  <UIcon name="i-lucide-layout-template" class="w-3.5 h-3.5" :class="startMode === 'template' ? 'text-primary' : 'text-muted'" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-highlighted">
                    From template
                  </p>
                  <p class="text-xs text-muted mt-0.5">
                    3-step follow-up
                  </p>
                </div>
              </button>
            </div>
          </div>

        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="subtle" @click="showModal = false">
            Cancel
          </UButton>
          <UButton
            icon="i-lucide-arrow-right"
            :disabled="!canSave"
            :loading="saving"
            @click="create"
          >
            Create & Open Builder
          </UButton>
        </div>
      </template>
    </UModal>

  </div>
</template>
