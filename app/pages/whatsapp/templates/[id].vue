<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const { getTemplate, updateTemplate, deleteTemplate, syncTemplate } = useWaTemplates()

const id = route.params.id as string
const template = ref<any>(null)
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  try {
    template.value = await getTemplate(id)
    editForm.body_text = template.value.body_text
    editForm.footer_text = template.value.footer_text ?? ''
    editForm.header_text = template.value.header_text ?? ''
    editForm.header_media_url = template.value.header_media_url ?? ''
    editForm.buttons = template.value.buttons ? [...template.value.buttons] : []
  }
  catch (e: any) {
    if (e?.status === 404) notFound.value = true
  }
  finally {
    loading.value = false
  }
})

const activeTab = ref('details')
const tabs = [
  { label: 'Details', value: 'details' },
  { label: 'Edit', value: 'edit' },
]

type StatusColor = 'success' | 'warning' | 'neutral' | 'error'
function statusColor(s: string): StatusColor {
  return s === 'approved' ? 'success' : s === 'pending' ? 'warning' : s === 'rejected' ? 'error' : 'neutral'
}

function resolvedBody(text: string): string {
  return text.replace(/\{\{(\d+)\}\}/g, (_, n) => `[var${n}]`)
}

const previewBodyText = computed(() => template.value ? resolvedBody(template.value.body_text) : '')
const previewHeaderText = computed(() =>
  template.value?.header_format === 'TEXT' ? resolvedBody(template.value.header_text || '') : '',
)

// ── Sync ────────────────────────────────────────────────────────────────────
const syncing = ref(false)
async function handleSync() {
  if (!template.value) return
  syncing.value = true
  try {
    template.value = await syncTemplate(id)
    toast.add({ title: 'Status synced from Alots', color: 'success', icon: 'i-lucide-refresh-cw' })
  }
  catch {
    toast.add({ title: 'Sync failed', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { syncing.value = false }
}

// ── Delete ───────────────────────────────────────────────────────────────────
const router = useRouter()
const deleting = ref(false)
async function handleDelete() {
  if (!template.value) return
  deleting.value = true
  try {
    await deleteTemplate(id)
    toast.add({ title: 'Template deleted', color: 'success', icon: 'i-lucide-trash-2' })
    router.push('/whatsapp/templates')
  }
  catch (e: any) {
    toast.add({ title: 'Delete failed', description: e?.data?.detail ?? 'Could not delete.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { deleting.value = false }
}

// ── Edit ─────────────────────────────────────────────────────────────────────
const editForm = reactive({
  body_text: '',
  footer_text: '',
  header_text: '',
  header_media_url: '',
  buttons: [] as Array<{ type: string; text: string; url: string }>,
})

const saving = ref(false)

function addButton() {
  if (editForm.buttons.length >= 3) return
  editForm.buttons.push({ type: 'QUICK_REPLY', text: '', url: '' })
}
function removeButton(i: number) {
  editForm.buttons.splice(i, 1)
}

const editBodyLength = computed(() => editForm.body_text.length)

async function saveEdit() {
  if (!editForm.body_text.trim()) return
  saving.value = true
  try {
    template.value = await updateTemplate(id, {
      body_text: editForm.body_text,
      footer_text: editForm.footer_text || null,
      header_text: template.value?.header_format === 'TEXT' ? editForm.header_text : undefined,
      header_media_url: ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(template.value?.header_format)
        ? editForm.header_media_url || undefined
        : undefined,
      buttons: editForm.buttons.filter(b => b.text).map(b => ({
        type: b.type,
        text: b.text,
        url: b.url || undefined,
      })),
    })
    toast.add({ title: 'Template updated', description: 'Changes submitted for Alots review.', color: 'success', icon: 'i-lucide-check-circle' })
    activeTab.value = 'details'
  }
  catch (e: any) {
    toast.add({ title: 'Update failed', description: e?.data?.detail ?? 'Something went wrong.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { saving.value = false }
}
</script>

<template>
  <div class="px-6 py-8 max-w-6xl mx-auto">

    <NuxtLink to="/whatsapp/templates" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to templates
    </NuxtLink>

    <AppPageLoader v-if="loading" label="Loading template…" />

    <!-- Not found -->
    <div v-else-if="notFound" class="text-center py-24">
      <UIcon name="i-lucide-message-circle-off" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-lg font-semibold text-highlighted mb-1">Template not found</p>
      <NuxtLink to="/whatsapp/templates" class="text-sm text-primary hover:underline">Back to templates</NuxtLink>
    </div>

    <template v-else-if="template">

      <!-- Header -->
      <div class="flex items-start justify-between mb-6 gap-4">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-2xl font-semibold text-highlighted font-mono">{{ template.name }}</h1>
            <UBadge :color="statusColor(template.status)" variant="subtle" class="capitalize">{{ template.status }}</UBadge>
          </div>
          <p class="text-sm text-muted capitalize">
            {{ template.category.toLowerCase() }} · {{ template.language }}
            · Updated {{ new Date(template.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton v-if="template.status === 'pending'" icon="i-lucide-refresh-cw" color="neutral" variant="subtle" size="sm" :loading="syncing" @click="handleSync">
            Sync Status
          </UButton>
          <UButton icon="i-lucide-trash-2" color="error" variant="subtle" size="sm" :loading="deleting" @click="handleDelete">
            Delete
          </UButton>
        </div>
      </div>

      <!-- Rejection alert -->
      <div v-if="template.status === 'rejected' && template.rejection_reason" class="mb-6 flex gap-3 bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800 rounded-xl px-4 py-3">
        <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-error-500 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-error-700 dark:text-error-400 mb-0.5">Meta rejected this template</p>
          <p class="text-sm text-error-600 dark:text-error-300">{{ template.rejection_reason }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-0 border-b border-default mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
          :class="activeTab === tab.value ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-highlighted'"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- DETAILS TAB -->
      <div v-if="activeTab === 'details'" class="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div class="xl:col-span-3 space-y-5">

          <UCard v-if="template.header_format && template.header_format !== 'NONE'" class="space-y-2">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Header</p>
            <div v-if="template.header_format === 'TEXT'" class="text-sm font-semibold text-highlighted">{{ template.header_text }}</div>
            <div v-else class="flex items-center gap-2 text-sm text-muted">
              <UIcon :name="template.header_format === 'IMAGE' ? 'i-lucide-image' : 'i-lucide-file-text'" class="w-4 h-4" />
              <span class="capitalize">{{ template.header_format.toLowerCase() }}</span>
              <span v-if="template.header_media_url" class="text-xs truncate max-w-xs">{{ template.header_media_url }}</span>
            </div>
          </UCard>

          <UCard class="space-y-3">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Body</p>
            <p class="text-sm text-default leading-relaxed whitespace-pre-wrap">{{ template.body_text }}</p>
          </UCard>

          <UCard v-if="template.footer_text" class="space-y-2">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Footer</p>
            <p class="text-sm text-muted">{{ template.footer_text }}</p>
          </UCard>

          <UCard v-if="template.buttons?.length > 0" class="space-y-3">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Buttons</p>
            <div class="space-y-2">
              <div v-for="(btn, i) in template.buttons" :key="i" class="flex items-center gap-3 px-3 py-2 bg-elevated rounded-lg border border-default">
                <UBadge :color="btn.type === 'URL' ? 'info' : 'neutral'" variant="subtle" size="xs" class="capitalize shrink-0">
                  {{ btn.type === 'QUICK_REPLY' ? 'Quick reply' : 'URL' }}
                </UBadge>
                <span class="text-sm text-default font-medium">{{ btn.text }}</span>
                <span v-if="btn.url" class="text-xs text-muted truncate ml-auto">{{ btn.url }}</span>
              </div>
            </div>
          </UCard>

          <UCard class="space-y-3">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Meta / Alots info</p>
            <div class="space-y-1.5 text-sm">
              <div class="flex gap-3">
                <span class="text-muted w-32 shrink-0">Alots ID</span>
                <span class="font-mono text-default text-xs">{{ template.alots_template_id ?? '—' }}</span>
              </div>
              <div class="flex gap-3">
                <span class="text-muted w-32 shrink-0">Created</span>
                <span class="text-default">{{ new Date(template.created_at).toLocaleString('en-GB') }}</span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Phone preview -->
        <div class="xl:col-span-2">
          <div class="sticky top-8">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-3 text-center">Preview</p>
            <div class="mx-auto" style="max-width: 280px;">
              <div class="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border-4 border-gray-700">
                <div class="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full z-10" />
                <div class="bg-[#0b1320] rounded-[2rem] overflow-hidden" style="min-height: 520px;">
                  <div class="bg-[#1f2c34] px-3 pt-8 pb-3 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white text-xs font-bold shrink-0">WA</div>
                    <div>
                      <p class="text-white text-xs font-semibold">Business</p>
                      <p class="text-[#8696a0] text-[10px]">Business Account</p>
                    </div>
                  </div>
                  <div class="bg-[#0d1b23] p-3 space-y-2" style="min-height: 400px;">
                    <div class="text-center">
                      <span class="text-[#8696a0] text-[10px] bg-[#1f2c34] px-2 py-0.5 rounded-full">Today</span>
                    </div>
                    <div class="flex justify-end">
                      <div class="bg-[#005c4b] text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm">
                        <div v-if="previewHeaderText" class="font-bold text-[11px] mb-1.5">{{ previewHeaderText }}</div>
                        <div v-else-if="template.header_format === 'IMAGE'" class="bg-[#004438] rounded-lg h-16 flex items-center justify-center mb-2">
                          <UIcon name="i-lucide-image" class="w-5 h-5 text-[#8696a0]" />
                        </div>
                        <p class="text-[11px] leading-relaxed whitespace-pre-wrap break-words">{{ previewBodyText }}</p>
                        <p v-if="template.footer_text" class="text-[#8696a0] text-[9px] mt-1">{{ template.footer_text }}</p>
                        <div class="flex justify-end mt-1">
                          <span class="text-[#8696a0] text-[9px]">10:42 AM ✓✓</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="template.buttons?.length > 0" class="flex flex-col gap-1">
                      <button v-for="btn in template.buttons" :key="btn.text" class="w-full text-center text-[10px] text-[#53bdeb] bg-[#1f2c34] rounded-lg py-1.5 px-2 border border-[#2a3942]">
                        <UIcon v-if="btn.type === 'URL'" name="i-lucide-external-link" class="w-2.5 h-2.5 inline mr-1" />
                        {{ btn.text }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- EDIT TAB -->
      <div v-else-if="activeTab === 'edit'" class="max-w-2xl space-y-5">
        <p class="text-xs text-muted">Name, category, and language cannot be changed after creation (Meta restriction). Editing body/buttons re-submits to Alots for review.</p>

        <!-- Header text/URL if applicable -->
        <UCard v-if="template.header_format === 'TEXT'" class="space-y-3">
          <h3 class="text-sm font-semibold text-highlighted">Header text</h3>
          <UInput v-model="editForm.header_text" placeholder="Header text…" :maxlength="60" />
          <p class="text-xs text-muted">{{ editForm.header_text.length }}/60</p>
        </UCard>

        <UCard v-if="['IMAGE','VIDEO','DOCUMENT'].includes(template.header_format)" class="space-y-3">
          <h3 class="text-sm font-semibold text-highlighted">Header media URL</h3>
          <UInput v-model="editForm.header_media_url" placeholder="https://…" />
          <p class="text-xs text-muted">Public URL of the {{ template.header_format.toLowerCase() }} file.</p>
        </UCard>

        <!-- Body -->
        <UCard class="space-y-3">
          <h3 class="text-sm font-semibold text-highlighted">Body <span class="text-error-500">*</span></h3>
          <UTextarea v-model="editForm.body_text" :rows="5" :maxlength="1024" />
          <div class="flex justify-between">
            <p class="text-xs text-muted">Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; for variables</p>
            <p class="text-xs" :class="editBodyLength > 900 ? 'text-warning-600' : 'text-muted'">{{ editBodyLength }}/1024</p>
          </div>
        </UCard>

        <!-- Footer -->
        <UCard class="space-y-3">
          <h3 class="text-sm font-semibold text-highlighted">Footer <span class="text-xs font-normal text-muted">(optional)</span></h3>
          <UInput v-model="editForm.footer_text" placeholder="Footer text…" :maxlength="60" />
          <p class="text-xs text-muted">{{ editForm.footer_text.length }}/60</p>
        </UCard>

        <!-- Buttons -->
        <UCard class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-highlighted">Buttons <span class="text-xs font-normal text-muted">(max 3)</span></h3>
            <UButton v-if="editForm.buttons.length < 3" icon="i-lucide-plus" color="neutral" variant="ghost" size="xs" @click="addButton">Add</UButton>
          </div>
          <div v-if="editForm.buttons.length === 0" class="text-sm text-muted text-center py-4">No buttons.</div>
          <div v-for="(btn, i) in editForm.buttons" :key="i" class="flex items-start gap-3 p-3 bg-elevated rounded-lg border border-default">
            <div class="flex-1 space-y-2">
              <div class="flex gap-2">
                <button class="px-2.5 py-1 rounded text-xs font-medium border transition-colors" :class="btn.type === 'QUICK_REPLY' ? 'bg-primary/10 border-primary text-primary' : 'border-default text-muted'" @click="btn.type = 'QUICK_REPLY'">Quick reply</button>
                <button class="px-2.5 py-1 rounded text-xs font-medium border transition-colors" :class="btn.type === 'URL' ? 'bg-primary/10 border-primary text-primary' : 'border-default text-muted'" @click="btn.type = 'URL'">URL</button>
              </div>
              <UInput v-model="btn.text" placeholder="Button label" size="sm" :maxlength="25" />
              <UInput v-if="btn.type === 'URL'" v-model="btn.url" placeholder="https://…" size="sm" />
            </div>
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="removeButton(i)" />
          </div>
        </UCard>

        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="subtle" @click="activeTab = 'details'">Cancel</UButton>
          <UButton :loading="saving" :disabled="!editForm.body_text.trim()" @click="saveEdit">Save & Resubmit</UButton>
        </div>
      </div>

    </template>
  </div>
</template>
