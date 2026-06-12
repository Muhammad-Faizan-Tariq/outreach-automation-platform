<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const { getTemplate, updateTemplate, previewTemplate, getAllowedVariables } = useTemplates()

const editorRef = ref<{ insertContent: (t: string) => void } | null>(null)

const pageLoading = ref(true)
const notFound = ref(false)
const source = ref<{ name: string; subject: string; body_html: string; step_number: number; campaign_type: string } | null>(null)

const form = reactive({
  name: '',
  subject: '',
  body: '',
})

onMounted(async () => {
  try {
    const [t, vars] = await Promise.allSettled([
      getTemplate(route.params.id as string),
      getAllowedVariables(),
    ])
    if (t.status === 'fulfilled') {
      source.value = { name: t.value.name, subject: t.value.subject, body_html: t.value.body_html, step_number: t.value.step_number, campaign_type: t.value.campaign_type }
      form.name = t.value.name
      form.subject = t.value.subject
      form.body = t.value.body_html
    }
    else {
      if ((t.reason as any)?.status === 404 || (t.reason as any)?.statusCode === 404) notFound.value = true
    }
    if (vars.status === 'fulfilled') allowedVars.value = vars.value
  }
  finally {
    pageLoading.value = false
  }
})

const saving = ref(false)
const previewOpen = ref(false)
const hasChanges = ref(false)
const previewLoading = ref(false)
const previewHtml = ref('')
const previewSubjectText = ref('')

watch(form, () => { hasChanges.value = true }, { deep: true })

const LABEL_MAP: Record<string, string> = {
  first_name: 'First name', full_name: 'Full name', email: 'Email',
  property_location: 'Location', unit_number: 'Unit #',
  property_value: 'Value', country: 'Country',
}
function varLabel(v: string) {
  return LABEL_MAP[v] ?? v.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
}
const allowedVars = ref<string[]>([])
const VARIABLES = computed(() => allowedVars.value.map(v => ({ label: varLabel(v), value: `{{${v}}}` })))

const SAMPLE: Record<string, string> = {
  first_name: 'Ahmed',
  full_name: 'Ahmed Al-Rashidi',
  email: 'ahmed.alrashidi@gmail.com',
  property_location: 'Dubai Marina',
  unit_number: '2204',
  property_value: 'AED 2,800,000',
  country: 'UAE',
}

function stepLabel(n: number) {
  if (n === 1) return 'Initial email'
  if (n === 2) return 'Follow-up'
  return 'Closing email'
}

async function openPreview() {
  previewOpen.value = true
  previewLoading.value = true
  try {
    const res = await previewTemplate(route.params.id as string, SAMPLE)
    previewHtml.value = res.body_html
    previewSubjectText.value = res.subject
  }
  catch {
    let html = form.body
    let subj = form.subject
    for (const [k, v] of Object.entries(SAMPLE)) {
      const tag = `<mark class="bg-primary/20 text-primary rounded px-0.5">${v}</mark>`
      html = html.replaceAll(`{{${k}}}`, tag)
      subj = subj.replaceAll(`{{${k}}}`, v)
    }
    previewHtml.value = html
    previewSubjectText.value = subj
  }
  finally {
    previewLoading.value = false
  }
}

const canSave = computed(() => form.name.trim() && form.subject.trim() && form.body.trim())

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

async function save() {
  if (!canSave.value) return
  saving.value = true
  try {
    await updateTemplate(route.params.id as string, {
      name: form.name,
      subject: form.subject,
      body_html: form.body,
      body_text: stripHtml(form.body),
    })
    hasChanges.value = false
    if (source.value) {
      source.value.name = form.name
      source.value.subject = form.subject
      source.value.body_html = form.body
    }
    toast.add({ title: 'Template saved', description: `"${form.name}" updated.`, color: 'success', icon: 'i-lucide-check-circle' })
  }
  catch (e: any) {
    toast.add({ title: 'Save failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    saving.value = false
  }
}

function discard() {
  if (!source.value) return
  form.name = source.value.name
  form.subject = source.value.subject
  form.body = source.value.body_html
  hasChanges.value = false
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-8">

    <NuxtLink to="/templates" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to templates
    </NuxtLink>

    <div v-if="pageLoading" class="space-y-4">
      <div class="h-8 w-72 bg-elevated rounded-lg animate-pulse" />
      <div class="h-64 bg-elevated rounded-xl animate-pulse" />
    </div>

    <div v-else-if="notFound" class="text-center py-24">
      <UIcon name="i-lucide-file-x" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-lg font-semibold text-highlighted mb-1">Template not found</p>
      <NuxtLink to="/templates" class="text-sm text-primary hover:underline">Back to templates</NuxtLink>
    </div>

    <template v-else>
      <div class="flex items-center justify-between mb-6 gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold text-highlighted truncate">{{ form.name || 'Untitled template' }}</h1>
          <div class="flex items-center gap-2 mt-0.5">
            <p v-if="source" class="text-xs text-muted">
              {{ stepLabel(source.step_number) }} · {{ source.campaign_type.replace('_', ' ') }}
            </p>
            <p v-if="hasChanges" class="text-xs text-warning-600 flex items-center gap-1">
              <UIcon name="i-lucide-circle-dot" class="w-3 h-3" />
              Unsaved changes
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton v-if="hasChanges" color="neutral" variant="ghost" size="sm" @click="discard">Discard</UButton>
          <UButton
            icon="i-lucide-eye"
            color="neutral"
            variant="subtle"
            :disabled="!form.body.trim()"
            @click="openPreview"
          >
            Preview
          </UButton>
          <UButton
            icon="i-lucide-save"
            :loading="saving"
            :disabled="!canSave || (!hasChanges && !saving)"
            @click="save"
          >
            Save changes
          </UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div class="space-y-4">
          <UCard class="space-y-4">
            <h3 class="text-sm font-semibold text-highlighted">Template info</h3>

            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Name</label>
              <UInput v-model="form.name" placeholder="Template name" />
            </div>

            <div v-if="source">
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Type</label>
              <p class="text-sm text-default">{{ stepLabel(source.step_number) }}</p>
              <p class="text-xs text-muted mt-0.5 capitalize">{{ source.campaign_type.replace('_', ' ') }} · not editable after creation</p>
            </div>
          </UCard>

          <UCard class="space-y-3">
            <div>
              <h3 class="text-sm font-semibold text-highlighted mb-0.5">Insert variable</h3>
              <p class="text-xs text-muted">Click to insert at cursor position.</p>
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

        <div class="lg:col-span-2 space-y-4">
          <UCard class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Subject line</label>
              <UInput v-model="form.subject" placeholder="e.g. Maximize Your {{property_location}} Investment" />
            </div>
          </UCard>

          <UCard class="space-y-3">
            <label class="block text-xs font-medium text-muted uppercase tracking-wide">Body</label>
            <AppTiptapEditor
              ref="editorRef"
              v-model="form.body"
              placeholder="Write your email here…"
              min-height="320px"
            />
            <p class="text-xs text-muted">
              Variables in <span class="font-mono text-primary">&#123;&#123;variable&#125;&#125;</span> are replaced when emails are sent.
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
                <div>
                  <h3 class="text-base font-semibold text-highlighted">Email preview</h3>
                  <p class="text-xs text-muted mt-0.5">Variables shown with sample data</p>
                </div>
                <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="previewOpen = false" />
              </div>
            </template>

            <div v-if="previewLoading" class="space-y-3 py-4">
              <div class="h-8 bg-elevated rounded animate-pulse" />
              <div class="h-40 bg-elevated rounded animate-pulse" />
            </div>
            <div v-else class="space-y-4">
              <div class="bg-elevated rounded-lg px-4 py-3">
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">Subject</p>
                <p class="text-sm font-semibold text-highlighted">{{ previewSubjectText }}</p>
              </div>
              <div class="border-t border-default pt-4">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div class="text-sm text-default leading-relaxed preview-body" v-html="previewHtml" />
              </div>
            </div>
          </UCard>
        </template>
      </UModal>
    </template>

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
