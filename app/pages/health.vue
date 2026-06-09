<script setup lang="ts">
interface LivenessResult {
  status: string
  service: string
  env: string
}
interface ReadinessResult {
  status: string
  checks: Record<string, string>
}

const MOCK_LIVENESS: LivenessResult = { status: 'ok', service: 'email-outreach-api', env: 'development' }
const MOCK_READINESS: ReadinessResult = { status: 'ok', checks: { database: 'ok', redis: 'ok', celery: 'ok' } }

const liveness = ref<LivenessResult>(MOCK_LIVENESS)
const readiness = ref<ReadinessResult>(MOCK_READINESS)
const loading = ref(false)
const lastChecked = ref<Date>(new Date())

function check() {
  loading.value = true
  setTimeout(() => {
    liveness.value = MOCK_LIVENESS
    readiness.value = MOCK_READINESS
    lastChecked.value = new Date()
    loading.value = false
  }, 600)
}

function statusColor(s: string) {
  if (s === 'ok') return 'success'
  if (s === 'degraded') return 'warning'
  return 'error'
}
function statusIcon(s: string) {
  if (s === 'ok') return 'i-lucide-check-circle'
  if (s === 'degraded') return 'i-lucide-alert-triangle'
  return 'i-lucide-x-circle'
}
function checkColor(v: string) {
  return v === 'ok' ? 'text-success-600' : 'text-error-600'
}
function checkIcon(v: string) {
  return v === 'ok' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'
}
function fmtTime(d: Date | null) {
  if (!d) return ''
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">System Health</h1>
        <p v-if="lastChecked" class="mt-0.5 text-sm text-muted">
          Last checked at {{ fmtTime(lastChecked) }}
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="subtle"
        :loading="loading"
        @click="check"
      >
        Refresh
      </UButton>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading && !liveness" class="space-y-4">
      <div class="h-28 bg-elevated rounded-xl animate-pulse" />
      <div class="h-28 bg-elevated rounded-xl animate-pulse" />
    </div>

    <div v-else class="space-y-4">

      <!-- Liveness -->
      <UCard>
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <UIcon
                v-if="liveness"
                :name="statusIcon(liveness.status)"
                class="w-5 h-5"
                :class="liveness.status === 'ok' ? 'text-success-500' : 'text-error-500'"
              />
              <h2 class="text-base font-semibold text-highlighted">Liveness</h2>
            </div>
            <p class="text-sm text-muted">Process is alive and accepting requests.</p>
          </div>
          <UBadge v-if="liveness" :color="statusColor(liveness.status)" variant="subtle" class="capitalize">
            {{ liveness.status }}
          </UBadge>
        </div>

        <div v-if="liveness" class="mt-4 grid grid-cols-2 gap-4 text-sm border-t border-default pt-4">
          <div>
            <span class="text-muted">Service</span>
            <span class="ml-2 font-mono text-default">{{ liveness.service }}</span>
          </div>
          <div>
            <span class="text-muted">Environment</span>
            <span class="ml-2 font-mono text-default capitalize">{{ liveness.env }}</span>
          </div>
        </div>
      </UCard>

      <!-- Readiness -->
      <UCard>
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <UIcon
                v-if="readiness"
                :name="statusIcon(readiness.status)"
                class="w-5 h-5"
                :class="readiness?.status === 'ok' ? 'text-success-500' : 'text-warning-500'"
              />
              <h2 class="text-base font-semibold text-highlighted">Readiness</h2>
            </div>
            <p class="text-sm text-muted">All required dependencies are reachable.</p>
          </div>
          <UBadge v-if="readiness" :color="statusColor(readiness.status)" variant="subtle" class="capitalize">
            {{ readiness.status }}
          </UBadge>
        </div>

        <div v-if="readiness?.checks" class="mt-4 border-t border-default pt-4 space-y-2">
          <div
            v-for="(val, key) in readiness.checks"
            :key="key"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-muted capitalize">{{ String(key).replace('_', ' ') }}</span>
            <div class="flex items-center gap-1.5" :class="checkColor(val)">
              <UIcon :name="checkIcon(val)" class="w-4 h-4" />
              <span class="font-medium capitalize">{{ val }}</span>
            </div>
          </div>
        </div>
      </UCard>

    </div>
  </div>
</template>
