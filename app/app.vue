<script setup>
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en' }
})

// Vue Flow uses internal DOM fragments that can produce null-ref errors during
// component teardown. This is a known upstream bug — suppress it globally.
const nuxtApp = useNuxtApp()
nuxtApp.vueApp.config.errorHandler = (err, _vm, _info) => {
  if (err instanceof TypeError) {
    const msg = err.message
    if (msg.includes('nextSibling') || msg.includes("'type'")) return
  }
  console.error(err)
}
</script>

<template>
  <UApp :toaster="{ position: 'top-right' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
