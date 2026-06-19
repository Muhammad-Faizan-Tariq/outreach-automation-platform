<script setup lang="ts">
const router = useRouter()
const toast = useToast()
const { createCampaign } = useWaCampaigns()
const { fetchTemplates, templates } = useWaTemplates()

onMounted(() => fetchTemplates({ status: 'approved', pageSize: 200 }))

const form = reactive({
  name: '',
  description: '',
  wa_template_id: '',
})

const saving = ref(false)

const selectedTemplate = computed(() => templates.value.find(t => t.id === form.wa_template_id) ?? null)

const templateOptions = computed(() =>
  templates.value.map(t => ({ label: t.name, value: t.id })),
)

const bodyVariables = computed<number[]>(() => {
  if (!selectedTemplate.value) return []
  const matches = [...selectedTemplate.value.body_text.matchAll(/\{\{(\d+)\}\}/g)]
  const nums = [...new Set(matches.map(m => parseInt(m[1]!)))]
  return nums.sort((a, b) => a - b)
})

const variableValues = ref<Record<number, string>>({})
watch(bodyVariables, (nums) => {
  const fresh: Record<number, string> = {}
  for (const n of nums) fresh[n] = variableValues.value[n] ?? ''
  variableValues.value = fresh
})

const canSave = computed(() => form.name.trim().length > 0 && form.wa_template_id.length > 0)

async function save() {
  if (!canSave.value) return
  saving.value = true
  try {
    const body_variables = bodyVariables.value.map(n => variableValues.value[n] ?? '')
    await createCampaign({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      wa_template_id: form.wa_template_id,
      body_variables,
    })
    toast.add({ title: 'Campaign created', description: `"${form.name}" is ready. Add contacts and launch.`, color: 'success', icon: 'i-lucide-check-circle' })
    router.push('/whatsapp/campaigns')
  }
  catch (e: any) {
    toast.add({ title: 'Failed to create', description: e?.data?.detail ?? 'Something went wrong.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="px-6 py-8 max-w-3xl mx-auto">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-8">
      <NuxtLink to="/whatsapp/campaigns" class="text-muted hover:text-highlighted transition-colors">
        <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">New WA Campaign</h1>
        <p class="text-sm text-muted mt-0.5">Select an approved template and configure your campaign</p>
      </div>
    </div>

    <div class="space-y-5">

      <!-- Basic info -->
      <UCard class="space-y-4">
        <h3 class="text-sm font-semibold text-highlighted">Campaign details</h3>

        <div>
          <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Campaign name <span class="text-error-500">*</span></label>
          <UInput v-model="form.name" placeholder="e.g. Dubai Marina Q3 Sellers" />
        </div>

        <div>
          <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Description <span class="text-muted font-normal">(optional)</span></label>
          <UTextarea v-model="form.description" :rows="2" placeholder="Internal notes about this campaign…" />
        </div>
      </UCard>

      <!-- Template selection -->
      <UCard class="space-y-4">
        <h3 class="text-sm font-semibold text-highlighted">Template <span class="text-error-500">*</span></h3>
        <p class="text-xs text-muted -mt-2">Only approved templates can be used in campaigns.</p>

        <div v-if="templates.length === 0 && !selectedTemplate" class="text-sm text-muted py-2">
          Loading approved templates…
        </div>

        <div v-else-if="templates.length === 0" class="text-sm text-warning-600 py-2">
          No approved templates found.
          <NuxtLink to="/whatsapp/templates/create" class="text-primary hover:underline">Create one first.</NuxtLink>
        </div>

        <USelect
          v-else
          v-model="form.wa_template_id"
          :items="templateOptions"
          value-key="value"
          label-key="label"
          placeholder="Select a template…"
        />

        <!-- Template preview -->
        <div v-if="selectedTemplate" class="bg-elevated rounded-xl border border-default p-4 space-y-2">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-sm text-primary font-semibold">{{ selectedTemplate.name }}</span>
            <UBadge color="neutral" variant="subtle" size="xs">{{ selectedTemplate.category.toLowerCase() }}</UBadge>
            <UBadge color="neutral" variant="outline" size="xs">{{ selectedTemplate.language }}</UBadge>
          </div>
          <p class="text-sm text-default leading-relaxed">{{ selectedTemplate.body_text }}</p>
          <p v-if="selectedTemplate.footer_text" class="text-xs text-muted">{{ selectedTemplate.footer_text }}</p>
        </div>
      </UCard>

      <!-- Variable values -->
      <UCard v-if="bodyVariables.length > 0" class="space-y-4">
        <h3 class="text-sm font-semibold text-highlighted">Variable defaults</h3>
        <p class="text-xs text-muted -mt-2">Default values used when a contact field is empty.</p>

        <div class="space-y-3">
          <div v-for="n in bodyVariables" :key="n" class="flex items-center gap-3">
            <span class="font-mono text-xs text-primary font-semibold w-10 shrink-0">&#123;&#123;{{ n }}&#125;&#125;</span>
            <UInput v-model="variableValues[n]" :placeholder="`Fallback for variable ${n}…`" class="flex-1" size="sm" />
          </div>
        </div>
      </UCard>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <NuxtLink to="/whatsapp/campaigns">
          <UButton color="neutral" variant="subtle">Cancel</UButton>
        </NuxtLink>
        <UButton :disabled="!canSave" :loading="saving" icon="i-lucide-check" @click="save">
          Create Campaign
        </UButton>
      </div>

    </div>
  </div>
</template>
