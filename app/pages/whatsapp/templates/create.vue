<script setup lang="ts">
const router = useRouter()
const toast = useToast()
const { createTemplate } = useWaTemplates()

type HeaderType = 'none' | 'text' | 'image' | 'document'
type ButtonType = 'quick_reply' | 'url'

interface TemplateButton {
  id: string
  type: ButtonType
  text: string
  url: string
}

interface Variable {
  position: number
  field: string
  fallback: string
}

const CONTACT_FIELDS = [
  { label: 'First Name', value: 'first_name' },
  { label: 'Full Name', value: 'full_name' },
  { label: 'Email', value: 'email' },
  { label: 'Property Location', value: 'property_location' },
  { label: 'Unit Number', value: 'unit_number' },
  { label: 'Property Value', value: 'property_value' },
  { label: 'Country', value: 'country' },
  { label: 'Custom Text', value: 'custom' },
]

const SAMPLE_VALUES: Record<string, string> = {
  first_name: 'Ahmed',
  full_name: 'Ahmed Al-Rashidi',
  email: 'ahmed@gmail.com',
  property_location: 'Dubai Marina',
  unit_number: '2204',
  property_value: '2,800,000',
  country: 'UAE',
  custom: 'Sample',
}

const form = reactive({
  name: '',
  category: 'marketing' as 'marketing' | 'utility' | 'authentication',
  language: 'en' as 'en' | 'ar',
  headerType: 'none' as HeaderType,
  headerText: '',
  body: '',
  footer: '',
  buttons: [] as TemplateButton[],
})

const variables = ref<Variable[]>([])
const saving = ref(false)

const CATEGORIES = [
  { label: 'Marketing', value: 'marketing' },
  { label: 'Utility', value: 'utility' },
  { label: 'Authentication', value: 'authentication' },
]

const LANGUAGES = [
  { label: 'English (en_US)', value: 'en_US' },
  { label: 'Arabic (ar)', value: 'ar' },
]

const HEADER_TYPES = [
  { label: 'None', value: 'none' },
  { label: 'Text', value: 'text' },
  { label: 'Image', value: 'image' },
  { label: 'Document', value: 'document' },
]

function extractVariables(text: string): number[] {
  const matches = [...text.matchAll(/\{\{(\d+)\}\}/g)]
  const nums = [...new Set(matches.map(m => parseInt(m[1]!)))]
  return nums.sort((a, b) => a - b)
}

watch(() => form.body, (body) => {
  const positions = extractVariables(body)
  const existing = new Map(variables.value.map(v => [v.position, v]))
  variables.value = positions.map(pos => existing.get(pos) ?? { position: pos, field: 'first_name', fallback: '' })
})

function resolvedPreview(text: string): string {
  let result = text
  for (const v of variables.value) {
    const sample = v.fallback || SAMPLE_VALUES[v.field] || v.field
    result = result.replaceAll(`{{${v.position}}}`, sample)
  }
  return result
}

const previewBody = computed(() => resolvedPreview(form.body))
const previewHeader = computed(() => form.headerType === 'text' ? resolvedPreview(form.headerText) : '')

function insertVariable() {
  const next = (variables.value.length > 0 ? Math.max(...variables.value.map(v => v.position)) : 0) + 1
  form.body += `{{${next}}}`
}

function addButton() {
  if (form.buttons.length >= 3) return
  form.buttons.push({ id: Date.now().toString(), type: 'quick_reply', text: '', url: '' })
}

function removeButton(id: string) {
  form.buttons = form.buttons.filter(b => b.id !== id)
}

const canSave = computed(() =>
  form.name.trim().length > 0 &&
  /^[a-z0-9_]+$/.test(form.name) &&
  form.body.trim().length > 0 &&
  form.body.length <= 1024
)

async function saveTemplate(submit: boolean) {
  if (!canSave.value) return
  saving.value = true
  try {
    const headerFormat = form.headerType === 'none' ? null : form.headerType.toUpperCase()
    await createTemplate({
      name: form.name,
      language: form.language,
      category: form.category.toUpperCase(),
      header_format: headerFormat,
      header_text: form.headerType === 'text' ? form.headerText : null,
      body_text: form.body,
      footer_text: form.footer || null,
      buttons: form.buttons.map(b => ({ type: b.type.toUpperCase(), text: b.text, url: b.url || undefined })),
    })
    if (submit) {
      toast.add({ title: 'Template submitted', description: `"${form.name}" sent to Meta for review. Approval usually takes 24–48h.`, color: 'success', icon: 'i-lucide-check-circle' })
    }
    else {
      toast.add({ title: 'Template created', description: `"${form.name}" saved.`, color: 'success', icon: 'i-lucide-save' })
    }
    router.push('/whatsapp/templates')
  }
  catch (e: any) {
    toast.add({ title: 'Failed to save', description: e?.data?.detail ?? 'Something went wrong.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    saving.value = false
  }
}

const bodyLength = computed(() => form.body.length)
</script>

<template>
  <div class="px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/whatsapp/templates" class="text-muted hover:text-highlighted transition-colors">
          <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-semibold text-highlighted">New WhatsApp Template</h1>
          <p class="text-sm text-muted mt-0.5">Build a Meta-approved message template</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="subtle" :loading="saving" @click="saveTemplate(false)">
          Save as Draft
        </UButton>
        <UButton :disabled="!canSave" :loading="saving" @click="saveTemplate(true)">
          Save &amp; Submit for Approval
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-5 gap-6">

      <!-- Left: form (3 cols) -->
      <div class="xl:col-span-3 space-y-5">

        <!-- Basic info -->
        <UCard class="space-y-4">
          <h3 class="text-sm font-semibold text-highlighted">Template information</h3>

          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Template name <span class="text-error-500">*</span></label>
            <UInput v-model="form.name" placeholder="e.g. property_selling_intro" />
            <p class="text-xs text-muted mt-1">Lowercase letters, numbers, underscores only. This is the internal Meta identifier.</p>
            <p v-if="form.name && !/^[a-z0-9_]+$/.test(form.name)" class="text-xs text-error-500 mt-1">
              Only lowercase letters, numbers, and underscores allowed.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Category</label>
              <USelect v-model="form.category" :items="CATEGORIES" value-key="value" label-key="label" />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Language</label>
              <USelect v-model="form.language" :items="LANGUAGES" value-key="value" label-key="label" />
            </div>
          </div>
        </UCard>

        <!-- Header -->
        <UCard class="space-y-4">
          <h3 class="text-sm font-semibold text-highlighted">Header <span class="text-xs font-normal text-muted">(optional)</span></h3>
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Header type</label>
            <div class="flex gap-2">
              <button
                v-for="ht in HEADER_TYPES"
                :key="ht.value"
                class="flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors"
                :class="form.headerType === ht.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-default text-muted hover:bg-elevated'"
                @click="form.headerType = ht.value as HeaderType"
              >
                {{ ht.label }}
              </button>
            </div>
          </div>

          <div v-if="form.headerType === 'text'">
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Header text</label>
            <UInput v-model="form.headerText" placeholder="e.g. Property Opportunity" :maxlength="60" />
            <p class="text-xs text-muted mt-1">{{ form.headerText.length }}/60 characters</p>
          </div>

          <div v-if="form.headerType === 'image'" class="flex items-center gap-3 p-4 bg-elevated rounded-lg border border-dashed border-default">
            <UIcon name="i-lucide-image" class="w-8 h-8 text-muted" />
            <div>
              <p class="text-sm text-default font-medium">Image URL or file</p>
              <p class="text-xs text-muted">JPEG/PNG, max 5MB. Provide a public URL or upload in campaign.</p>
            </div>
          </div>

          <div v-if="form.headerType === 'document'" class="flex items-center gap-3 p-4 bg-elevated rounded-lg border border-dashed border-default">
            <UIcon name="i-lucide-file-text" class="w-8 h-8 text-muted" />
            <div>
              <p class="text-sm text-default font-medium">Document URL or file</p>
              <p class="text-xs text-muted">PDF/DOCX, max 100MB. Provide a public URL or upload in campaign.</p>
            </div>
          </div>
        </UCard>

        <!-- Body -->
        <UCard class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-highlighted">Body <span class="text-error-500">*</span></h3>
            <UButton icon="i-lucide-braces" color="neutral" variant="ghost" size="xs" @click="insertVariable">
              Insert &#123;&#123;variable&#125;&#125;
            </UButton>
          </div>

          <div>
            <UTextarea
              v-model="form.body"
              :rows="5"
              placeholder="Hi {{1}}, we noticed you own a property at {{2}} in {{3}}. Are you considering selling?"
              :maxlength="1024"
            />
            <div class="flex justify-between mt-1">
              <p class="text-xs text-muted">Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;, &#123;&#123;3&#125;&#125; for personalisation variables</p>
              <p class="text-xs" :class="bodyLength > 900 ? 'text-warning-600' : 'text-muted'">{{ bodyLength }}/1024</p>
            </div>
          </div>

          <!-- Variable mapping -->
          <div v-if="variables.length > 0" class="space-y-2">
            <p class="text-xs font-semibold text-highlighted uppercase tracking-wide">Variable mapping</p>
            <div class="bg-elevated rounded-lg overflow-hidden border border-default">
              <div class="grid grid-cols-12 gap-0 px-3 py-2 border-b border-default text-xs font-semibold text-muted uppercase tracking-wide">
                <span class="col-span-2">Var</span>
                <span class="col-span-5">Contact field</span>
                <span class="col-span-5">Fallback value</span>
              </div>
              <div v-for="v in variables" :key="v.position" class="grid grid-cols-12 gap-2 px-3 py-2 border-b border-default last:border-0 items-center">
                <span class="col-span-2 font-mono text-xs text-primary font-semibold">&#123;&#123;{{ v.position }}&#125;&#125;</span>
                <div class="col-span-5">
                  <USelect
                    v-model="v.field"
                    :items="CONTACT_FIELDS"
                    value-key="value"
                    label-key="label"
                    size="xs"
                  />
                </div>
                <div class="col-span-5">
                  <UInput v-model="v.fallback" :placeholder="SAMPLE_VALUES[v.field] || 'Fallback…'" size="xs" />
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Footer -->
        <UCard class="space-y-3">
          <h3 class="text-sm font-semibold text-highlighted">Footer <span class="text-xs font-normal text-muted">(optional)</span></h3>
          <UInput v-model="form.footer" placeholder="e.g. DXB PropVault – Dubai's Property Experts" :maxlength="60" />
          <p class="text-xs text-muted">{{ form.footer.length }}/60 characters. Shown in grey below the message body.</p>
        </UCard>

        <!-- Buttons -->
        <UCard class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-highlighted">Buttons <span class="text-xs font-normal text-muted">(optional, max 3)</span></h3>
            </div>
            <UButton
              v-if="form.buttons.length < 3"
              icon="i-lucide-plus"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="addButton"
            >
              Add button
            </UButton>
          </div>

          <div v-if="form.buttons.length === 0" class="text-center py-6 text-sm text-muted">
            No buttons. Add up to 3 quick reply or URL buttons.
          </div>

          <div v-for="btn in form.buttons" :key="btn.id" class="flex items-start gap-3 p-3 bg-elevated rounded-lg border border-default">
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <div class="flex gap-2">
                  <button
                    class="px-2.5 py-1 rounded text-xs font-medium border transition-colors"
                    :class="btn.type === 'quick_reply' ? 'bg-primary/10 border-primary text-primary' : 'border-default text-muted hover:bg-default'"
                    @click="btn.type = 'quick_reply'"
                  >
                    Quick reply
                  </button>
                  <button
                    class="px-2.5 py-1 rounded text-xs font-medium border transition-colors"
                    :class="btn.type === 'url' ? 'bg-primary/10 border-primary text-primary' : 'border-default text-muted hover:bg-default'"
                    @click="btn.type = 'url'"
                  >
                    URL
                  </button>
                </div>
              </div>
              <UInput v-model="btn.text" placeholder="Button label" size="sm" :maxlength="25" />
              <UInput v-if="btn.type === 'url'" v-model="btn.url" placeholder="https://dxbpropvault.com/..." size="sm" />
            </div>
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="removeButton(btn.id)" />
          </div>
        </UCard>

      </div>

      <!-- Right: phone mockup (2 cols) -->
      <div class="xl:col-span-2">
        <div class="sticky top-8">
          <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-3 text-center">Live preview</p>

          <!-- Phone frame -->
          <div class="mx-auto" style="max-width: 300px;">
            <div class="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border-4 border-gray-700">
              <!-- Notch -->
              <div class="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full z-10" />

              <!-- Screen -->
              <div class="bg-[#0b1320] rounded-[2rem] overflow-hidden" style="min-height: 580px;">

                <!-- WhatsApp header bar -->
                <div class="bg-[#1f2c34] px-3 pt-8 pb-3 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    WA
                  </div>
                  <div>
                    <p class="text-white text-xs font-semibold">DXB PropVault</p>
                    <p class="text-[#8696a0] text-[10px]">Business Account</p>
                  </div>
                </div>

                <!-- Chat area -->
                <div class="bg-[#0d1b23] flex-1 p-3 space-y-2" style="background-image: url('data:image/svg+xml,<svg/>'); min-height: 440px;">

                  <!-- Timestamp -->
                  <div class="text-center">
                    <span class="text-[#8696a0] text-[10px] bg-[#1f2c34] px-2 py-0.5 rounded-full">Today</span>
                  </div>

                  <!-- Message bubble -->
                  <div class="flex justify-end">
                    <div class="bg-[#005c4b] text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm">

                      <!-- Header preview -->
                      <div v-if="form.headerType === 'text' && previewHeader" class="font-bold text-xs mb-1 leading-tight">
                        {{ previewHeader }}
                      </div>
                      <div v-else-if="form.headerType === 'image'" class="bg-[#004438] rounded-lg h-20 flex items-center justify-center mb-2">
                        <UIcon name="i-lucide-image" class="w-6 h-6 text-[#8696a0]" />
                        <span class="text-[#8696a0] text-xs ml-1">Image</span>
                      </div>
                      <div v-else-if="form.headerType === 'document'" class="bg-[#004438] rounded-lg px-2 py-1.5 flex items-center gap-2 mb-2">
                        <UIcon name="i-lucide-file-text" class="w-4 h-4 text-[#8696a0]" />
                        <span class="text-[#8696a0] text-[10px]">Document</span>
                      </div>

                      <!-- Body -->
                      <p class="text-[11px] leading-relaxed whitespace-pre-wrap break-words">
                        {{ previewBody || 'Your message body will appear here…' }}
                      </p>

                      <!-- Footer -->
                      <p v-if="form.footer" class="text-[#8696a0] text-[10px] mt-1 leading-snug">{{ form.footer }}</p>

                      <!-- Timestamp -->
                      <div class="flex justify-end mt-1">
                        <span class="text-[#8696a0] text-[9px]">10:42 AM ✓✓</span>
                      </div>
                    </div>
                  </div>

                  <!-- Buttons preview -->
                  <div v-if="form.buttons.length > 0" class="flex flex-col gap-1 mt-1">
                    <button
                      v-for="btn in form.buttons"
                      :key="btn.id"
                      class="w-full text-center text-xs text-[#53bdeb] bg-[#1f2c34] rounded-lg py-2 px-3 border border-[#2a3942]"
                    >
                      <UIcon v-if="btn.type === 'url'" name="i-lucide-external-link" class="w-3 h-3 inline mr-1" />
                      {{ btn.text || 'Button label' }}
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </div>

          <!-- Variable summary -->
          <div v-if="variables.length > 0" class="mt-4 p-3 bg-elevated border border-default rounded-xl">
            <p class="text-xs font-semibold text-highlighted mb-2">Variables detected</p>
            <div v-for="v in variables" :key="v.position" class="flex items-center justify-between text-xs py-0.5">
              <span class="font-mono text-primary">&#123;&#123;{{ v.position }}&#125;&#125;</span>
              <span class="text-muted">→ {{ CONTACT_FIELDS.find(f => f.value === v.field)?.label }}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>
