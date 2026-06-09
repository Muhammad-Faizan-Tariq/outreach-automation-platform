<script setup lang="ts">
const router = useRouter()
const toast = useToast()

const editorRef = ref<{ insertContent: (t: string) => void } | null>(null)

const form = reactive({
  name: '',
  category: 'initial' as 'initial' | 'follow_up' | 'closing',
  subject: '',
  body: '',
})

const saving = ref(false)
const previewOpen = ref(false)

const CATEGORIES = [
  { label: 'Initial email', value: 'initial' },
  { label: 'Follow-up', value: 'follow_up' },
  { label: 'Closing email', value: 'closing' },
]

const VARIABLES = [
  { label: 'First name', value: '{{first_name}}' },
  { label: 'Full name', value: '{{full_name}}' },
  { label: 'Email', value: '{{email}}' },
  { label: 'Location', value: '{{property_location}}' },
  { label: 'Unit #', value: '{{unit_number}}' },
  { label: 'Value', value: '{{property_value}}' },
  { label: 'Country', value: '{{country}}' },
]

// Preview: replace variables with sample data
const SAMPLE: Record<string, string> = {
  '{{first_name}}': 'Ahmed',
  '{{full_name}}': 'Ahmed Al-Rashidi',
  '{{email}}': 'ahmed.alrashidi@gmail.com',
  '{{property_location}}': 'Dubai Marina',
  '{{unit_number}}': '2204',
  '{{property_value}}': 'AED 2,800,000',
  '{{country}}': 'UAE',
}

const previewBody = computed(() => {
  let html = form.body
  for (const [key, val] of Object.entries(SAMPLE)) {
    html = html.replaceAll(key, `<mark class="bg-primary/20 text-primary rounded px-0.5">${val}</mark>`)
  }
  return html
})

const previewSubject = computed(() => {
  let s = form.subject
  for (const [key, val] of Object.entries(SAMPLE)) s = s.replaceAll(key, val)
  return s
})

const canSave = computed(() => form.name.trim() && form.subject.trim() && form.body.trim())

async function save() {
  if (!canSave.value) return
  saving.value = true
  await new Promise(r => setTimeout(r, 700))
  saving.value = false
  toast.add({ title: 'Template saved', description: `"${form.name}" has been created.`, color: 'success', icon: 'i-lucide-check-circle' })
  router.push('/templates')
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-8">

    <!-- Back -->
    <NuxtLink to="/templates" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to templates
    </NuxtLink>

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">New template</h1>
        <p class="mt-0.5 text-sm text-muted">Create a reusable email template with personalisation variables.</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-eye"
          color="neutral"
          variant="subtle"
          :disabled="!form.body.trim()"
          @click="previewOpen = true"
        >
          Preview
        </UButton>
        <UButton
          icon="i-lucide-save"
          :loading="saving"
          :disabled="!canSave"
          @click="save"
        >
          Save template
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Left: meta fields -->
      <div class="space-y-4">
        <UCard class="space-y-4">
          <h3 class="text-sm font-semibold text-highlighted">Template info</h3>

          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Name <span class="text-error-500">*</span></label>
            <UInput v-model="form.name" placeholder="e.g. Marina Q2 – Initial Outreach" />
          </div>

          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Category</label>
            <USelect
              v-model="form.category"
              :items="CATEGORIES"
              value-key="value"
              label-key="label"
            />
          </div>
        </UCard>

        <!-- Variable buttons -->
        <UCard class="space-y-3">
          <div>
            <h3 class="text-sm font-semibold text-highlighted mb-0.5">Insert variable</h3>
            <p class="text-xs text-muted">Click to insert at cursor position in the body.</p>
          </div>
          <div class="flex flex-col gap-1.5">
            <button
              v-for="v in VARIABLES"
              :key="v.value"
              class="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-default hover:bg-elevated hover:border-primary/50 transition-colors text-left"
              @click="editorRef?.insertContent(v.value)"
            >
              <span class="text-xs text-muted">{{ v.label }}</span>
              <span class="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{{ v.value }}</span>
            </button>
          </div>
        </UCard>
      </div>

      <!-- Right: subject + body -->
      <div class="lg:col-span-2 space-y-4">

        <UCard class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Subject line <span class="text-error-500">*</span></label>
            <UInput
              v-model="form.subject"
              placeholder="e.g. Maximize Your {{property_location}} Investment"
            />
            <p class="text-xs text-muted mt-1">Variables in the subject are also supported.</p>
          </div>
        </UCard>

        <UCard class="space-y-3">
          <label class="block text-xs font-medium text-muted uppercase tracking-wide">Body <span class="text-error-500">*</span></label>
          <AppTiptapEditor
            ref="editorRef"
            v-model="form.body"
            placeholder="Hi {{first_name}},&#10;&#10;Write your email here…"
            min-height="300px"
          />
          <p class="text-xs text-muted">
            Use the toolbar for formatting. Click variable buttons on the left to personalise.
          </p>
        </UCard>

      </div>
    </div>

    <!-- Preview modal -->
    <UModal v-model:open="previewOpen">
      <template #content>
        <UCard class="max-w-2xl w-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-highlighted">Email preview</h3>
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="previewOpen = false" />
            </div>
            <p class="text-xs text-muted mt-0.5">Variables replaced with sample data</p>
          </template>

          <div class="space-y-4">
            <div class="bg-elevated rounded-lg px-4 py-3">
              <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">Subject</p>
              <p class="text-sm font-semibold text-highlighted">{{ previewSubject }}</p>
            </div>
            <div class="border-t border-default pt-4">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="text-sm text-default leading-relaxed preview-body" v-html="previewBody" />
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

  </div>
</template>

<style>
.preview-body p { margin-bottom: 0.625rem; }
.preview-body strong { font-weight: 600; }
.preview-body em { font-style: italic; }
.preview-body ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.625rem; }
.preview-body ol { list-style: decimal; padding-left: 1.25rem; margin-bottom: 0.625rem; }
.preview-body a { color: var(--ui-primary); text-decoration: underline; }
</style>
