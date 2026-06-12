<script setup lang="ts">
import type { EmailTemplate } from '~/composables/useTemplates'
import type { AudiencePreview } from '~/composables/useCampaigns'

const router = useRouter()
const toast = useToast()
const { createCampaign, previewAudience } = useCampaigns()
const { templates, loading: templatesLoading, fetchTemplates } = useTemplates()

// ── step state ────────────────────────────────────────────────────────
const step = ref(1)
const totalSteps = 4

const stepTitles = [
  { n: 1, label: 'Campaign info', icon: 'i-lucide-settings-2' },
  { n: 2, label: 'Audience', icon: 'i-lucide-users' },
  { n: 3, label: 'Templates', icon: 'i-lucide-mail' },
  { n: 4, label: 'Schedule', icon: 'i-lucide-calendar' },
]

// ── form ──────────────────────────────────────────────────────────────
const form = reactive({
  name: '',
  description: '',
  campaign_type: 'owner_sell' as 'owner_sell' | 'owner_rent_out',
  // Step 2 – audience
  locations: '',         // comma-separated → split into array for filter
  // Step 3 – templates
  template_step1_id: '',
  template_step2_id: '',
  template_step3_id: '',
  follow_up_delay_1: 3,  // days between step 1→2
  follow_up_delay_2: 5,  // days between step 2→3
  // Step 4 – schedule
  daily_volume_cap: 200,
  send_window_start: '08:00',
  send_window_end: '18:00',
  send_days_of_week: [1, 2, 3, 4, 5] as number[], // Mon–Fri
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

// ── audience preview ──────────────────────────────────────────────────
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

// ── templates ─────────────────────────────────────────────────────────
const templatesLoaded = ref(false)

async function loadTemplates() {
  if (templatesLoaded.value) return
  await fetchTemplates({ campaign_type: form.campaign_type, is_active: true, page_size: 200 })
  templatesLoaded.value = true
}

watch(() => form.campaign_type, () => {
  templatesLoaded.value = false
  form.template_step1_id = ''
  form.template_step2_id = ''
  form.template_step3_id = ''
})

function templatesForStep(stepNum: number): EmailTemplate[] {
  return templates.value.filter(t => t.step_number === stepNum)
}

function templateOptions(stepNum: number) {
  return [
    { label: '— None —', value: '' },
    ...templatesForStep(stepNum).map(t => ({ label: t.name, value: t.id })),
  ]
}

// ── navigation ────────────────────────────────────────────────────────
async function nextStep() {
  if (step.value === 2 && !audiencePreview.value) {
    await runAudiencePreview()
  }
  if (step.value === 2 && step.value < totalSteps) {
    await loadTemplates()
  }
  if (step.value < totalSteps) step.value++
}
function prevStep() { if (step.value > 1) step.value-- }

function canProceed(): boolean {
  if (step.value === 1) return !!form.name.trim()
  if (step.value === 2) return true
  if (step.value === 3) return !!form.template_step1_id
  return true
}

// ── launch ────────────────────────────────────────────────────────────
const saving = ref(false)

async function launch() {
  saving.value = true
  try {
    const templates_payload = []
    if (form.template_step1_id) {
      templates_payload.push({ step_number: 1, template_id: form.template_step1_id, delay_days: 0 })
    }
    if (form.template_step2_id) {
      templates_payload.push({ step_number: 2, template_id: form.template_step2_id, delay_days: form.follow_up_delay_1 })
    }
    if (form.template_step3_id) {
      templates_payload.push({ step_number: 3, template_id: form.template_step3_id, delay_days: form.follow_up_delay_2 })
    }

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
  <div class="max-w-3xl mx-auto px-6 py-8">

    <NuxtLink to="/campaigns" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to campaigns
    </NuxtLink>

    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-highlighted">New campaign</h1>
      <p class="mt-0.5 text-sm text-muted">Set up your outreach campaign in {{ totalSteps }} steps.</p>
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
      <h2 class="text-base font-semibold text-highlighted">Campaign information</h2>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Campaign name <span class="text-error-500">*</span></label>
        <UInput v-model="form.name" placeholder="e.g. Marina Q2 Outreach" />
      </div>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Campaign type <span class="text-error-500">*</span></label>
        <USelect v-model="form.campaign_type" :items="CAMPAIGN_TYPES" value-key="value" label-key="label" />
        <p class="text-xs text-muted mt-1">Determines which contact segment and templates are available.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Description <span class="text-muted font-normal">(optional)</span></label>
        <UInput v-model="form.description" placeholder="Internal notes about this campaign…" />
      </div>
    </UCard>

    <!-- ── STEP 2: Audience ── -->
    <UCard v-else-if="step === 2" class="space-y-5">
      <h2 class="text-base font-semibold text-highlighted">Audience filter</h2>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Locations</label>
        <UInput v-model="form.locations" placeholder="e.g. Dubai Marina, Downtown Dubai, Palm Jumeirah" />
        <p class="text-xs text-muted mt-1">Comma-separated list of locations. Leave blank to include all contacts.</p>
      </div>

      <div class="border-t border-default pt-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-medium text-highlighted">Audience estimate</p>
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
            <p class="text-lg font-semibold text-highlighted tabular-nums">{{ audiencePreview.total_matching.toLocaleString() }}</p>
            <p class="text-xs text-muted">Matching</p>
          </div>
          <div class="bg-elevated rounded-lg px-3 py-2.5 text-center">
            <p class="text-lg font-semibold text-highlighted tabular-nums">{{ audiencePreview.after_suppression.toLocaleString() }}</p>
            <p class="text-xs text-muted">After suppression</p>
          </div>
          <div class="bg-elevated rounded-lg px-3 py-2.5 text-center">
            <p class="text-lg font-semibold text-highlighted tabular-nums">{{ audiencePreview.after_cooldown.toLocaleString() }}</p>
            <p class="text-xs text-muted">After cooldown</p>
          </div>
          <div class="bg-elevated rounded-lg px-3 py-2.5 text-center">
            <p class="text-2xl font-bold text-primary tabular-nums">{{ audiencePreview.eligible.toLocaleString() }}</p>
            <p class="text-xs text-muted font-medium">Eligible</p>
          </div>
        </div>

        <div v-if="audiencePreview?.sample_contacts.length" class="mt-3">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-2">Sample contacts</p>
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

    <!-- ── STEP 3: Templates ── -->
    <UCard v-else-if="step === 3" class="space-y-6">
      <h2 class="text-base font-semibold text-highlighted">Email sequence</h2>
      <p class="text-sm text-muted -mt-3">Select pre-built templates for each step. At least one initial template is required.</p>

      <!-- Step 1 -->
      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Step 1 — Initial email <span class="text-error-500">*</span></label>
        <USelect v-model="form.template_step1_id" :items="templateOptions(1)" value-key="value" label-key="label" />
        <p class="text-xs text-muted mt-1">Sent immediately when contact enters the campaign.</p>
      </div>

      <!-- Step 2 -->
      <div>
        <div class="flex items-center gap-3 mb-1.5">
          <label class="text-sm font-medium text-highlighted">Step 2 — Follow-up <span class="text-muted font-normal">(optional)</span></label>
          <div class="flex items-center gap-1.5 text-xs text-muted">
            <span>after</span>
            <UInput v-model="form.follow_up_delay_1" type="number" :min="1" :max="30" size="xs" class="w-16" />
            <span>days</span>
          </div>
        </div>
        <USelect v-model="form.template_step2_id" :items="templateOptions(2)" value-key="value" label-key="label" />
        <p class="text-xs text-muted mt-1">Only sent if the contact did not reply to Step 1.</p>
      </div>

      <!-- Step 3 -->
      <div>
        <div class="flex items-center gap-3 mb-1.5">
          <label class="text-sm font-medium text-highlighted">Step 3 — Closing <span class="text-muted font-normal">(optional)</span></label>
          <div class="flex items-center gap-1.5 text-xs text-muted">
            <span>after</span>
            <UInput v-model="form.follow_up_delay_2" type="number" :min="1" :max="30" size="xs" class="w-16" />
            <span>days</span>
          </div>
        </div>
        <USelect v-model="form.template_step3_id" :items="templateOptions(3)" value-key="value" label-key="label" />
        <p class="text-xs text-muted mt-1">Only sent if no reply to Step 2.</p>
      </div>

      <div v-if="!templatesLoading && templates.length === 0" class="text-center text-sm text-muted py-4">
        No templates found for this campaign type.
        <NuxtLink to="/templates/create" class="text-primary hover:underline ml-1">Create one first.</NuxtLink>
      </div>
    </UCard>

    <!-- ── STEP 4: Schedule ── -->
    <UCard v-else-if="step === 4" class="space-y-5">
      <h2 class="text-base font-semibold text-highlighted">Sending schedule</h2>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-2">Daily volume cap</label>
        <div class="flex items-center gap-3">
          <UInput v-model="form.daily_volume_cap" type="number" :min="1" :max="5000" class="w-28" />
          <span class="text-sm text-muted">emails / day (total across all workers)</span>
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
      <p class="text-xs text-muted">Times are in {{ form.timezone }}. Emails spread evenly across the window.</p>

      <!-- Summary -->
      <div class="border-t border-default pt-4 space-y-2 text-sm">
        <p class="font-semibold text-highlighted mb-2">Summary</p>
        <div class="flex justify-between"><span class="text-muted">Name</span><span class="font-medium text-default">{{ form.name }}</span></div>
        <div class="flex justify-between capitalize"><span class="text-muted">Type</span><span class="font-medium text-default">{{ form.campaign_type.replace('_', ' ') }}</span></div>
        <div class="flex justify-between"><span class="text-muted">Eligible audience</span><span class="font-medium text-default">{{ audiencePreview?.eligible.toLocaleString() ?? '—' }}</span></div>
        <div class="flex justify-between"><span class="text-muted">Email steps</span><span class="font-medium text-default">{{ [form.template_step1_id, form.template_step2_id, form.template_step3_id].filter(Boolean).length }}</span></div>
        <div class="flex justify-between"><span class="text-muted">Daily cap</span><span class="font-medium text-default">{{ form.daily_volume_cap.toLocaleString() }}</span></div>
      </div>
      <p class="text-xs text-muted">Campaign will be created as <strong>draft</strong> — launch it from the campaign detail page.</p>
    </UCard>

    <!-- Navigation -->
    <div class="flex justify-between mt-6">
      <UButton v-if="step > 1" icon="i-lucide-arrow-left" color="neutral" variant="subtle" @click="prevStep">Back</UButton>
      <div v-else />

      <div class="flex gap-2">
        <NuxtLink to="/campaigns">
          <UButton color="neutral" variant="ghost">Cancel</UButton>
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
