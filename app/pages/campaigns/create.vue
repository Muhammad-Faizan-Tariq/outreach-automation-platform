<script setup lang="ts">
interface EmailStep {
  id: string
  subject: string
  body: string
  waitDays: number
}

// ── mock select options ───────────────────────────────────────────────
const MOCK_TEMPLATES = [
  { label: 'Marina Q2 – Initial Outreach', value: 'tpl1' },
  { label: 'Downtown Sellers – First Touch', value: 'tpl2' },
  { label: 'Palm Jumeirah VIP Intro', value: 'tpl3' },
  { label: 'Blank (start from scratch)', value: '' },
]

const MOCK_INBOXES = [
  { label: 'outreach1@dxbpropvault.com', value: 'ibx1' },
  { label: 'outreach2@dxbpropvault.com', value: 'ibx2' },
  { label: 'outreach3@dxbpropvault.com', value: 'ibx3' },
  { label: 'outreach4@dxbpropvault.com', value: 'ibx4' },
  { label: 'campaigns@propvault.ae', value: 'ibx5' },
]

const MOCK_CONTACT_LISTS = [
  { label: 'All contacts (2,041,330)', value: 'all' },
  { label: 'Dubai Marina owners (4,820)', value: 'marina' },
  { label: 'Downtown Dubai owners (3,210)', value: 'downtown' },
  { label: 'Palm Jumeirah VIP (640)', value: 'palm' },
  { label: 'JBR Investors (2,180)', value: 'jbr' },
  { label: 'GCC Non-UAE (8,200)', value: 'gcc' },
]

// ── form state ────────────────────────────────────────────────────────
const step = ref(1)
const totalSteps = 4

const form = reactive({
  name: '',
  contactList: '',
  inboxIds: [] as string[],
  dailyLimit: 200,
  fromName: 'DXB PropVault Team',
  replyTo: '',
  trackOpens: true,
  sendDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as string[],
  sendStart: '08:00',
  sendEnd: '18:00',
})

const emailSteps = ref<EmailStep[]>([
  { id: 'es1', subject: '', body: '', waitDays: 0 },
])

const saving = ref(false)
const toast = useToast()
const router = useRouter()

// ── step titles ───────────────────────────────────────────────────────
const stepTitles = [
  { n: 1, label: 'Campaign info', icon: 'i-lucide-settings-2' },
  { n: 2, label: 'Audience', icon: 'i-lucide-users' },
  { n: 3, label: 'Email sequence', icon: 'i-lucide-mail' },
  { n: 4, label: 'Schedule', icon: 'i-lucide-calendar' },
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ── sequence helpers ──────────────────────────────────────────────────
function addStep() {
  emailSteps.value.push({ id: `es${Date.now()}`, subject: '', body: '', waitDays: 3 })
}
function removeStep(id: string) {
  if (emailSteps.value.length <= 1) return
  emailSteps.value = emailSteps.value.filter(s => s.id !== id)
}

const VARIABLES = ['{{first_name}}', '{{full_name}}', '{{email}}', '{{property_location}}', '{{unit_number}}', '{{property_value}}']

function insertVar(stepId: string, variable: string) {
  const s = emailSteps.value.find(x => x.id === stepId)
  if (s) s.body += ` ${variable}`
}

// ── navigation ────────────────────────────────────────────────────────
function nextStep() { if (step.value < totalSteps) step.value++ }
function prevStep() { if (step.value > 1) step.value-- }

function canProceed() {
  if (step.value === 1) return !!form.name.trim()
  if (step.value === 2) return !!form.contactList && form.inboxIds.length > 0
  if (step.value === 3) return emailSteps.value.every(s => s.subject.trim() && s.body.trim())
  return true
}

async function launch() {
  saving.value = true
  await new Promise(r => setTimeout(r, 1000))
  saving.value = false
  toast.add({ title: 'Campaign created', description: `"${form.name}" is now active.`, color: 'success', icon: 'i-lucide-rocket' })
  router.push('/campaigns')
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-8">

    <!-- Back -->
    <NuxtLink to="/campaigns" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlighted mb-6">
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      Back to campaigns
    </NuxtLink>

    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-highlighted">New campaign</h1>
      <p class="mt-0.5 text-sm text-muted">Set up your outreach sequence in 4 steps.</p>
    </div>

    <!-- Progress steps -->
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

    <!-- ── STEP 1: Campaign info ──────────────────────────────────── -->
    <UCard v-if="step === 1" class="space-y-5">
      <h2 class="text-base font-semibold text-highlighted">Campaign information</h2>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Campaign name <span class="text-error-500">*</span></label>
        <UInput v-model="form.name" placeholder="e.g. Marina Q2 Outreach" />
      </div>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">From name</label>
        <UInput v-model="form.fromName" placeholder="DXB PropVault Team" />
        <p class="text-xs text-muted mt-1">Displayed as the sender name in recipients' inboxes.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Reply-to email</label>
        <UInput v-model="form.replyTo" placeholder="replies@dxbpropvault.com" type="email" />
        <p class="text-xs text-muted mt-1">Leave blank to use the sending inbox address.</p>
      </div>

      <div class="flex items-center justify-between py-3 border-t border-default">
        <div>
          <p class="text-sm font-medium text-highlighted">Track email opens</p>
          <p class="text-xs text-muted mt-0.5">Adds a 1px tracking pixel to measure open rates.</p>
        </div>
        <UToggle v-model="form.trackOpens" />
      </div>
    </UCard>

    <!-- ── STEP 2: Audience ───────────────────────────────────────── -->
    <UCard v-else-if="step === 2" class="space-y-5">
      <h2 class="text-base font-semibold text-highlighted">Audience &amp; inboxes</h2>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Contact list <span class="text-error-500">*</span></label>
        <USelect v-model="form.contactList" :items="MOCK_CONTACT_LISTS" value-key="value" label-key="label" placeholder="Select a contact list…" />
      </div>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Sending inboxes <span class="text-error-500">*</span></label>
        <p class="text-xs text-muted mb-2">Select one or more inboxes to rotate sending across.</p>
        <div class="space-y-2">
          <label
            v-for="inbox in MOCK_INBOXES"
            :key="inbox.value"
            class="flex items-center gap-3 p-3 rounded-lg border border-default cursor-pointer hover:bg-elevated transition-colors"
            :class="form.inboxIds.includes(inbox.value) ? 'border-primary bg-primary/5' : ''"
          >
            <UCheckbox
              :model-value="form.inboxIds.includes(inbox.value)"
              @update:model-value="(v: boolean) => {
                if (v) form.inboxIds.push(inbox.value)
                else form.inboxIds = form.inboxIds.filter(x => x !== inbox.value)
              }"
            />
            <UIcon name="i-lucide-mail" class="w-4 h-4 text-muted" />
            <span class="text-sm text-default">{{ inbox.label }}</span>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-1.5">Daily send limit <span class="text-muted font-normal">(per inbox)</span></label>
        <div class="flex items-center gap-3">
          <UInput v-model="form.dailyLimit" type="number" :min="1" :max="500" class="w-28" />
          <span class="text-sm text-muted">emails / inbox / day</span>
        </div>
        <p class="text-xs text-muted mt-1">
          Total: ~{{ form.inboxIds.length * form.dailyLimit }} emails/day with {{ form.inboxIds.length || 0 }} inbox{{ form.inboxIds.length !== 1 ? 'es' : '' }} selected.
        </p>
      </div>
    </UCard>

    <!-- ── STEP 3: Email sequence ──────────────────────────────────── -->
    <div v-else-if="step === 3" class="space-y-4">
      <h2 class="text-base font-semibold text-highlighted mb-4">Email sequence</h2>

      <div v-for="(es, i) in emailSteps" :key="es.id" class="flex gap-4">
        <!-- Step indicator -->
        <div class="flex flex-col items-center">
          <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
            {{ i + 1 }}
          </div>
          <div v-if="i < emailSteps.length - 1" class="w-px flex-1 bg-border-default mt-1 min-h-4" />
        </div>

        <!-- Email card -->
        <UCard class="flex-1 mb-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-highlighted">
              {{ i === 0 ? 'Initial email' : `Follow-up #${i}` }}
            </p>
            <div class="flex items-center gap-2">
              <span v-if="i > 0" class="text-xs text-muted">Send after</span>
              <UInput
                v-if="i > 0"
                v-model="es.waitDays"
                type="number"
                :min="1"
                :max="30"
                class="w-16"
                size="xs"
              />
              <span v-if="i > 0" class="text-xs text-muted">days (no reply)</span>
              <UButton
                v-if="emailSteps.length > 1"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                @click="removeStep(es.id)"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1">Subject <span class="text-error-500">*</span></label>
            <UInput v-model="es.subject" placeholder="e.g. Maximize Your Dubai Marina Investment" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-muted uppercase tracking-wide">Body <span class="text-error-500">*</span></label>
              <div class="flex gap-1 flex-wrap justify-end">
                <button
                  v-for="v in VARIABLES"
                  :key="v"
                  class="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-mono"
                  @click="insertVar(es.id, v)"
                >
                  {{ v }}
                </button>
              </div>
            </div>
            <UTextarea
              v-model="es.body"
              :rows="8"
              placeholder="Write your email body here. Use the variable buttons above to personalise."
              class="w-full font-mono text-sm"
            />
          </div>
        </UCard>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="neutral"
        variant="subtle"
        class="ml-12"
        @click="addStep"
      >
        Add follow-up step
      </UButton>
    </div>

    <!-- ── STEP 4: Schedule ───────────────────────────────────────── -->
    <UCard v-else-if="step === 4" class="space-y-5">
      <h2 class="text-base font-semibold text-highlighted">Sending schedule</h2>

      <div>
        <label class="block text-sm font-medium text-highlighted mb-2">Send on days</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="day in WEEKDAYS"
            :key="day"
            class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
            :class="form.sendDays.includes(day)
              ? 'bg-primary text-white border-primary'
              : 'border-default text-muted hover:border-primary/50'"
            @click="form.sendDays.includes(day)
              ? (form.sendDays = form.sendDays.filter(d => d !== day))
              : form.sendDays.push(day)"
          >
            {{ day }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-highlighted mb-1.5">Start time</label>
          <UInput v-model="form.sendStart" type="time" />
        </div>
        <div>
          <label class="block text-sm font-medium text-highlighted mb-1.5">End time</label>
          <UInput v-model="form.sendEnd" type="time" />
        </div>
      </div>
      <p class="text-xs text-muted">Emails will be spread evenly across this window. Times are in UAE (GST, UTC+4).</p>

      <!-- Summary -->
      <div class="border-t border-default pt-4 space-y-2 text-sm">
        <p class="font-semibold text-highlighted mb-2">Launch summary</p>
        <div class="flex justify-between"><span class="text-muted">Campaign</span><span class="font-medium text-default">{{ form.name || '—' }}</span></div>
        <div class="flex justify-between"><span class="text-muted">Inboxes</span><span class="font-medium text-default">{{ form.inboxIds.length }}</span></div>
        <div class="flex justify-between"><span class="text-muted">Daily limit</span><span class="font-medium text-default">~{{ form.inboxIds.length * form.dailyLimit }} emails</span></div>
        <div class="flex justify-between"><span class="text-muted">Email steps</span><span class="font-medium text-default">{{ emailSteps.length }}</span></div>
        <div class="flex justify-between"><span class="text-muted">Send days</span><span class="font-medium text-default">{{ form.sendDays.join(', ') || '—' }}</span></div>
      </div>
    </UCard>

    <!-- Navigation buttons -->
    <div class="flex justify-between mt-6">
      <UButton
        v-if="step > 1"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="subtle"
        @click="prevStep"
      >
        Back
      </UButton>
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
          @click="nextStep"
        >
          Continue
        </UButton>
        <UButton
          v-else
          icon="i-lucide-rocket"
          :loading="saving"
          :disabled="!canProceed()"
          @click="launch"
        >
          Launch campaign
        </UButton>
      </div>
    </div>

  </div>
</template>
