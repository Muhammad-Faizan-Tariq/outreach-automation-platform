// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1',
      // Auto-refresh intervals (ms) — override per environment via .env
      refreshDashboard: Number(process.env.NUXT_PUBLIC_REFRESH_DASHBOARD) || 60_000,
      refreshAnalytics: Number(process.env.NUXT_PUBLIC_REFRESH_ANALYTICS) || 300_000,
      refreshQueue: Number(process.env.NUXT_PUBLIC_REFRESH_QUEUE) || 30_000,
      refreshWorkers: Number(process.env.NUXT_PUBLIC_REFRESH_WORKERS) || 10_000,
      searchDebounce: Number(process.env.NUXT_PUBLIC_SEARCH_DEBOUNCE) || 300,
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
