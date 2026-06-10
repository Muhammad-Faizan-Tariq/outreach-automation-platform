<script setup lang="ts">
const route = useRoute()
const { user, logout, init } = useAuth()

onMounted(init)

const collapsed = useState('sidebar.collapsed', () => false)

type NavItem = {
  label: string
  icon: string
  to: string
  badge?: number
  section?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' },

  { label: 'Campaigns', icon: 'i-lucide-send', to: '/campaigns', section: 'Outreach' },
  { label: 'Templates', icon: 'i-lucide-file-text', to: '/templates' },
  { label: 'Contacts', icon: 'i-lucide-users', to: '/contacts' },

  { label: 'Inboxes', icon: 'i-lucide-mail', to: '/inboxes', section: 'Inbox' },
  { label: 'Replies', icon: 'i-lucide-inbox', to: '/replies', badge: 12 },
  { label: 'Sent Emails', icon: 'i-lucide-send-horizontal', to: '/sent-emails' },

  { label: 'Analytics', icon: 'i-lucide-bar-chart-2', to: '/analytics', section: 'Monitoring' },
  { label: 'Queue', icon: 'i-lucide-layers', to: '/queue' },
  { label: 'Health', icon: 'i-lucide-activity', to: '/health' },

  { label: 'WA Templates', icon: 'i-lucide-message-circle', to: '/whatsapp/templates', section: 'WhatsApp' },

  { label: 'Users', icon: 'i-lucide-users-round', to: '/settings/users', section: 'Settings' },
  { label: 'Suppression', icon: 'i-lucide-shield-x', to: '/settings/suppression' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-elevated">

    <!-- Sidebar -->
    <aside
      class="shrink-0 flex flex-col bg-default border-r border-default transition-[width] duration-200 ease-in-out overflow-hidden"
      :class="collapsed ? 'w-14' : 'w-56'"
    >

      <!-- Logo -->
      <div
        class="h-14 shrink-0 flex items-center border-b border-default transition-all duration-200"
        :class="collapsed ? 'justify-center px-0' : 'px-5'"
      >
        <AppLogo v-if="!collapsed" class="h-5 w-auto text-primary" />
        <UIcon v-else name="i-lucide-send" class="w-5 h-5 text-primary" />
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <template v-for="item in navItems" :key="item.to">

          <!-- Section separator -->
          <template v-if="item.section">
            <p
              v-if="!collapsed"
              class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted"
            >
              {{ item.section }}
            </p>
            <div v-else class="my-3 border-t border-default" />
          </template>

          <!-- Nav link -->
          <UTooltip
            :text="item.label"
            :disabled="!collapsed"
            :content="{ placement: 'right', align: 'center' }"
          >
            <NuxtLink
              :to="item.to"
              class="relative flex items-center rounded-lg text-sm font-medium transition-colors mb-0.5"
              :class="[
                collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
                isActive(item.to)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-elevated hover:text-highlighted',
              ]"
            >
              <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />

              <span v-if="!collapsed" class="flex-1 truncate">{{ item.label }}</span>

              <!-- Badge: number when expanded, dot when collapsed -->
              <span
                v-if="item.badge && !collapsed"
                class="ml-auto min-w-4.5 h-4.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none"
              >
                {{ item.badge }}
              </span>
              <span
                v-if="item.badge && collapsed"
                class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary"
              />
            </NuxtLink>
          </UTooltip>

        </template>
      </nav>

      <!-- Collapse toggle -->
      <div class="px-2 pb-1 shrink-0">
        <button
          class="w-full flex items-center rounded-lg py-2 text-xs text-muted hover:bg-elevated hover:text-highlighted transition-colors"
          :class="collapsed ? 'justify-center px-2' : 'gap-2 px-3'"
          @click="collapsed = !collapsed"
        >
          <UIcon
            :name="collapsed ? 'i-lucide-chevrons-right' : 'i-lucide-chevrons-left'"
            class="w-4 h-4 shrink-0"
          />
          <span v-if="!collapsed">Collapse</span>
        </button>
      </div>

      <!-- User footer -->
      <div class="border-t border-default p-2 shrink-0">
        <div
          class="flex items-center rounded-lg"
          :class="collapsed ? 'justify-center px-1 py-1.5' : 'gap-2.5 px-2 py-2'"
        >
          <UTooltip
            :text="user?.full_name ?? ''"
            :disabled="!collapsed"
            :content="{ placement: 'right' }"
          >
            <UAvatar :alt="user?.full_name ?? ''" size="xs" class="shrink-0 cursor-default" />
          </UTooltip>

          <template v-if="!collapsed">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-highlighted truncate">{{ user?.full_name ?? '…' }}</p>
              <p class="text-xs text-muted truncate capitalize">{{ user?.role?.replace('_', ' ') }}</p>
            </div>
            <UButton
              icon="i-lucide-log-out"
              color="neutral"
              variant="ghost"
              size="xs"
              title="Sign out"
              @click="logout"
            />
          </template>
        </div>
      </div>

    </aside>

    <!-- Main content -->
    <main class="flex-1 min-w-0 overflow-y-auto">
      <slot />
    </main>

  </div>
</template>
