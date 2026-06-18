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

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const { authHeaders } = useAuth()

const liveness = ref<LivenessResult | null>(null)
const readiness = ref<ReadinessResult | null>(null)
const loading = ref(true)
const lastChecked = ref<Date | null>(null)

async function check() {
  loading.value = true
  try {
    const [l, r] = await Promise.all([
      $fetch<LivenessResult>(`${apiBase}/health`),
      $fetch<ReadinessResult>(`${apiBase}/health/ready`, { headers: authHeaders.value }),
    ])
    liveness.value = l
    readiness.value = r
    lastChecked.value = new Date()
  }
  catch {
    liveness.value = { status: 'error', service: 'unknown', env: 'unknown' }
    readiness.value = { status: 'error', checks: {} }
  }
  finally {
    loading.value = false
  }
}

onMounted(check)

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
      <USkeleton class="h-28 rounded-xl" />
      <USkeleton class="h-28 rounded-xl" />
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
