<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const toast = useToast()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)

const submit = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    await login(form.email, form.password)
    await navigateTo('/')
  }
  catch (e: any) {
    errorMsg.value = e?.data?.detail ?? 'Invalid email or password'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm">
    <!-- Logo + heading -->
    <div class="text-center mb-8">
      <div class="flex justify-center mb-5">
        <AppLogo />
      </div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Sign in
      </h1>
      <p class="mt-1 text-sm text-muted">
        Welcome back to your outreach platform
      </p>
    </div>

    <UCard>
      <form class="space-y-5" @submit.prevent="submit">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-highlighted" for="email">
            Email address
          </label>
          <UInput
            id="email"
            v-model="form.email"
            type="email"
            placeholder="you@company.com"
            autocomplete="email"
            required
            class="w-full"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-highlighted" for="password">
            Password
          </label>
          <UInput
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            autocomplete="current-password"
            required
            class="w-full"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </div>

        <UAlert
          v-if="errorMsg"
          color="error"
          variant="soft"
          :description="errorMsg"
          icon="i-lucide-alert-circle"
        />

        <UButton
          type="submit"
          block
          :loading="loading"
        >
          Sign in
        </UButton>
      </form>
    </UCard>
  </div>
</template>
