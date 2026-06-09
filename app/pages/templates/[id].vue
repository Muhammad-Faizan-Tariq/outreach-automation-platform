<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const toast = useToast()

const editorRef = ref<{ insertContent: (t: string) => void } | null>(null)

// ── mock template data (keyed by id) ──────────────────────────────────
const MOCK_TEMPLATES: Record<string, { name: string; category: 'initial' | 'follow_up' | 'closing'; subject: string; body: string }> = {
  '1': {
    name: 'Marina Q2 – Initial Outreach',
    category: 'initial',
    subject: 'Maximize Your Dubai Marina Investment',
    body: `<p>Hi {{first_name}},</p><p>I hope this message finds you well. I noticed you own a beautiful unit at {{property_location}}, and given the current market conditions, there may be an excellent opportunity to maximize your rental yield or explore a profitable sale.</p><p>Our team specializes in Dubai Marina properties and we have qualified buyers actively looking in your area.</p><p>Would you be open to a quick 10-minute call this week?</p><p>Best regards,<br>DXB PropVault Team</p>`,
  },
  '2': {
    name: 'Downtown Sellers – First Touch',
    category: 'initial',
    subject: 'Your Downtown Dubai Unit – Rental Opportunity',
    body: `<p>Dear {{first_name}},</p><p>I'm reaching out regarding your property in Downtown Dubai. With strong rental demand continuing through 2025, your unit could command premium rates this season.</p><p>We offer full property management at competitive rates — from tenant sourcing to maintenance.</p><p>Would you be interested in a free rental valuation?</p><p>Warm regards,<br>DXB PropVault</p>`,
  },
  '3': {
    name: 'Palm Jumeirah VIP Intro',
    category: 'initial',
    subject: 'Exclusive Buyer Interest – {{property_location}}',
    body: `<p>Dear {{full_name}},</p><p>We have a high-net-worth client actively seeking luxury villas on Palm Jumeirah with a budget of AED 15–20M.</p><p>Given your portfolio in the area, I wanted to reach out exclusively before listing anything publicly.</p><p>Are you open to a confidential conversation?</p><p>Best,<br>DXB PropVault</p>`,
  },
  '4': {
    name: 'General Follow-up #1',
    category: 'follow_up',
    subject: 'Following up – {{property_location}} property opportunity',
    body: `<p>Hi {{first_name}},</p><p>I wanted to follow up on my previous message about your {{property_location}} unit.</p><p>The market has been moving quickly and I'd hate for you to miss out on a great opportunity. Even a 15-minute conversation could be valuable.</p><p>Are you free for a quick call this week?</p><p>Best,<br>DXB PropVault</p>`,
  },
  '5': {
    name: 'Final Follow-up (Closing)',
    category: 'closing',
    subject: 'Last note – quick question about your {{property_location}} unit',
    body: `<p>Hi {{first_name}},</p><p>I'll keep this short — I've reached out a couple of times about your property and don't want to keep bothering you if the timing isn't right.</p><p>If you're ever thinking of selling or renting your {{property_location}} unit, we'd love to help. Just reply to this email and we'll take it from there.</p><p>No pressure at all.</p><p>Best,<br>DXB PropVault</p>`,
  },
  '6': {
    name: 'JBR Market Update',
    category: 'initial',
    subject: 'JBR Market Update – Your Unit Could Be Worth More',
    body: `<p>Dear {{first_name}},</p><p>The JBR market has seen a 12% appreciation in Q1 2025. Your unit at {{unit_number}} may have increased significantly in value since your last appraisal.</p><p>I'd love to share a no-obligation market report — no commitment required.</p><p>Best,<br>DXB PropVault</p>`,
  },
  '7': {
    name: 'Tenant Upgrade Program',
    category: 'initial',
    subject: 'Upgrade Your Living – Premium Units Available',
    body: `<p>Hi {{first_name}},</p><p>We have exclusive listings for tenants looking to upgrade their living situation in Dubai's best communities.</p><p>Whether you're looking for more space, a better location, or a nicer building, we have options across Dubai Marina, Downtown, JBR, and Business Bay.</p><p>Interested in a no-obligation property tour?</p><p>Best,<br>DXB PropVault</p>`,
  },
  '8': {
    name: 'GCC Remote Investor',
    category: 'initial',
    subject: 'Remote Property Management – Your Dubai Investment',
    body: `<p>Dear {{full_name}},</p><p>Managing a Dubai property from {{country}} doesn't have to be stressful. Our remote management service handles everything — tenant screening, rent collection, maintenance coordination, and monthly reporting.</p><p>All accessible from your phone or laptop, no matter where you are.</p><p>Would a 15-minute intro call work for you?</p><p>Best,<br>DXB PropVault</p>`,
  },
  '9': {
    name: 'Follow-up with Valuation Offer',
    category: 'follow_up',
    subject: 'Free valuation for your {{property_location}} property',
    body: `<p>Hi {{first_name}},</p><p>Following up with a specific offer: a free, no-obligation valuation for your unit at {{property_location}}.</p><p>Knowing your property's current market value takes 24 hours and costs you nothing. It's worth knowing even if you're not planning to sell.</p><p>Shall I go ahead?</p><p>Best,<br>DXB PropVault</p>`,
  },
}

// ── state ─────────────────────────────────────────────────────────────
const id = route.params.id as string
const source = MOCK_TEMPLATES[id]
const notFound = !source

const form = reactive({
  name: source?.name ?? '',
  category: (source?.category ?? 'initial') as 'initial' | 'follow_up' | 'closing',
  subject: source?.subject ?? '',
  body: source?.body ?? '',
})

const saving = ref(false)
const previewOpen = ref(false)
const hasChanges = ref(false)

watch(form, () => { hasChanges.value = true }, { deep: true })

// ── options ───────────────────────────────────────────────────────────
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
  hasChanges.value = false
  toast.add({ title: 'Template saved', description: `"${form.name}" has been updated.`, color: 'success', icon: 'i-lucide-check-circle' })
}

function discard() {
  if (!source) return
  form.name = source.name
  form.category = source.category
  form.subject = source.subject
  form.body = source.body
  hasChanges.value = false
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-8">

    <!-- Back -->
    <NuxtLink to="/templates" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to templates
    </NuxtLink>

    <!-- Not found -->
    <div v-if="notFound" class="text-center py-24">
      <UIcon name="i-lucide-file-x" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-lg font-semibold text-highlighted mb-1">Template not found</p>
      <NuxtLink to="/templates" class="text-sm text-primary hover:underline">Back to templates</NuxtLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold text-highlighted truncate">{{ form.name || 'Untitled template' }}</h1>
          <p v-if="hasChanges" class="text-xs text-warning-600 mt-0.5 flex items-center gap-1">
            <UIcon name="i-lucide-circle-dot" class="w-3 h-3" />
            Unsaved changes
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton
            v-if="hasChanges"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="discard"
          >
            Discard
          </UButton>
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
            :disabled="!canSave || (!hasChanges && !saving)"
            @click="save"
          >
            Save changes
          </UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Left: meta + variables -->
        <div class="space-y-4">
          <UCard class="space-y-4">
            <h3 class="text-sm font-semibold text-highlighted">Template info</h3>

            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Name</label>
              <UInput v-model="form.name" placeholder="Template name" />
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

        <!-- Right: subject + body editor -->
        <div class="lg:col-span-2 space-y-4">

          <UCard class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Subject line</label>
              <UInput
                v-model="form.subject"
                placeholder="e.g. Maximize Your {{property_location}} Investment"
              />
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
              Formatting is preserved in HTML. Variables in <span class="font-mono text-primary">&#123;&#123;variable&#125;&#125;</span> are replaced when emails are sent.
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
