<script setup lang="ts">
const route = useRoute()
const { user, logout, init } = useAuth()

onMounted(init)

const nav = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Contacts', icon: 'i-lucide-users', to: '/contacts' },
  { label: 'Inboxes', icon: 'i-lucide-mail', to: '/inboxes' },
  { label: 'Health', icon: 'i-lucide-activity', to: '/health' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-elevated">

    <!-- Sidebar -->
    <aside class="w-56 shrink-0 flex flex-col bg-default border-r border-default">
      <!-- Logo -->
      <div class="h-14 flex items-center px-5 border-b border-default shrink-0">
        <AppLogo class="h-5 w-auto text-primary" />
      </div>

      <!-- Nav links -->
      <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-primary/10 text-primary'
            : 'text-muted hover:bg-elevated hover:text-highlighted'"
        >
          <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- User footer -->
      <div class="border-t border-default p-2 shrink-0">
        <div class="flex items-center gap-2.5 px-2 py-2">
          <UAvatar
            :alt="user?.full_name ?? ''"
            size="xs"
            class="shrink-0"
          />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-highlighted truncate">{{ user?.full_name ?? '…' }}</p>
            <p class="text-xs text-muted truncate">{{ user?.role }}</p>
          </div>
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            size="xs"
            title="Sign out"
            @click="logout"
          />
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 min-w-0 overflow-y-auto">
      <slot />
    </main>

  </div>
</template>
