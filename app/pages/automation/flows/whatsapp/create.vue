<script setup lang="ts">
const router = useRouter()

const form = reactive({
  name: '',
  description: '',
})

const startMode = ref<'blank' | 'template'>('blank')

const saving = ref(false)
const canSave = computed(() => form.name.trim().length > 0)

async function create() {
  if (!canSave.value) return
  saving.value = true
  await new Promise(r => setTimeout(r, 400))
  const newId = Date.now().toString()
  saving.value = false
  const query = startMode.value === 'blank' ? '?blank=1' : ''
  router.push(`/automation/flows/whatsapp/${newId}${query}`)
}
</script>

<template>
  <div class="px-6 py-8 max-w-xl mx-auto">

    <div class="flex items-center gap-3 mb-8">
      <NuxtLink to="/automation/flows/whatsapp" class="text-muted hover:text-highlighted transition-colors">
        <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          New WhatsApp Flow
        </h1>
        <p class="text-sm text-muted mt-0.5">
          Give your flow a name then build it on the canvas
        </p>
      </div>
    </div>

    <UCard class="space-y-5">

      <div>
        <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
          Flow name <span class="text-error-500">*</span>
        </label>
        <UInput
          v-model="form.name"
          placeholder="e.g. Dubai Marina Follow-up Sequence"
          autofocus
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
          Description <span class="text-muted font-normal normal-case">(optional)</span>
        </label>
        <UTextarea
          v-model="form.description"
          :rows="2"
          placeholder="What is this flow for?"
        />
      </div>

      <!-- Starting point -->
      <div>
        <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-2.5">
          Starting point
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-colors text-left"
            :class="startMode === 'blank'
              ? 'border-primary bg-primary/5'
              : 'border-default bg-elevated hover:border-default/80'"
            @click="startMode = 'blank'"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="startMode === 'blank' ? 'bg-primary/15' : 'bg-elevated'">
              <UIcon name="i-lucide-square-dashed" class="w-4 h-4" :class="startMode === 'blank' ? 'text-primary' : 'text-muted'" />
            </div>
            <div>
              <p class="text-sm font-semibold text-highlighted">
                Blank canvas
              </p>
              <p class="text-xs text-muted mt-0.5">
                Start from scratch, build your own flow
              </p>
            </div>
          </button>

          <button
            type="button"
            class="flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-colors text-left"
            :class="startMode === 'template'
              ? 'border-primary bg-primary/5'
              : 'border-default bg-elevated hover:border-default/80'"
            @click="startMode = 'template'"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="startMode === 'template' ? 'bg-primary/15' : 'bg-elevated'">
              <UIcon name="i-lucide-layout-template" class="w-4 h-4" :class="startMode === 'template' ? 'text-primary' : 'text-muted'" />
            </div>
            <div>
              <p class="text-sm font-semibold text-highlighted">
                From template
              </p>
              <p class="text-xs text-muted mt-0.5">
                Pre-built 3-step follow-up flow
              </p>
            </div>
          </button>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <NuxtLink to="/automation/flows/whatsapp">
          <UButton color="neutral" variant="subtle">
            Cancel
          </UButton>
        </NuxtLink>
        <UButton
          icon="i-lucide-arrow-right"
          :disabled="!canSave"
          :loading="saving"
          @click="create"
        >
          Create & Open Builder
        </UButton>
      </div>

    </UCard>

  </div>
</template>
