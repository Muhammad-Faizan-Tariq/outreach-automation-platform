<script setup lang="ts">
const route = useRoute()
const { user, logout, init } = useAuth()

onMounted(init)

const collapsed = useState('sidebar.collapsed', () => false)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
function toggleDark() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

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

  { label: 'WA Accounts', icon: 'i-lucide-building-2', to: '/whatsapp/accounts', section: 'WhatsApp' },
  { label: 'WA Templates', icon: 'i-lucide-message-circle', to: '/whatsapp/templates' },
  { label: 'WA Campaigns', icon: 'i-lucide-megaphone', to: '/whatsapp/campaigns' },
  { label: 'WA Inbound', icon: 'i-lucide-message-square', to: '/whatsapp/inbound' },
  { label: 'WA Media', icon: 'i-lucide-image', to: '/whatsapp/media' },
  { label: 'WA Analytics', icon: 'i-lucide-bar-chart-3', to: '/whatsapp/analytics' },

  { label: 'WA Flows', icon: 'i-lucide-git-branch', to: '/automation/flows/whatsapp', section: 'Automation' },
  { label: 'Email Flows', icon: 'i-lucide-git-branch-plus', to: '/automation/flows/email' },

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
        <AppLogo v-if="!collapsed" />
        <svg v-else width="32" height="17" viewBox="0 0 164 87" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M49.0548 6.10352e-05C50.1881 1.89773 51.3173 3.7968 52.4541 5.69169C63.8498 24.6824 75.2463 43.6716 86.6428 62.6616C91.016 69.9495 95.387 77.2387 99.7685 84.521C99.9377 84.8023 99.9412 84.9561 99.685 85.181C99.1886 85.6161 98.7194 86.0839 98.2635 86.5607C98.0588 86.7751 97.8437 86.835 97.5597 86.8343C92.8746 86.8273 88.1889 86.8294 83.5039 86.8294C78.656 86.8294 73.8088 86.826 68.9616 86.8371C68.6288 86.8378 68.5383 86.757 68.5397 86.4187C68.5523 82.2224 68.5453 78.0254 68.5536 73.829C68.5543 73.5283 68.4715 73.3202 68.248 73.1113C66.3253 71.316 64.4158 69.5067 62.5014 67.7023C62.4513 67.655 62.3949 67.6139 62.3288 67.5589C62.2264 67.6877 62.271 67.8297 62.271 67.9585C62.2682 74.0678 62.2689 80.1771 62.2689 86.2864C62.2689 86.8294 62.2689 86.8294 61.7085 86.8294C60.8272 86.8294 59.9452 86.8162 59.0646 86.8364C58.7506 86.8434 58.6587 86.7612 58.6594 86.4361C58.6699 80.9526 58.6671 75.4691 58.6671 69.9864C58.6671 69.4301 58.6754 68.8732 58.6622 68.317C58.658 68.1277 58.7193 68.0372 58.8919 67.9557C59.7085 67.5735 60.5146 67.1684 61.3291 66.7827C61.5087 66.6978 61.5846 66.5976 61.5832 66.3894C61.5728 65.2074 61.5693 64.0246 61.5853 62.8419C61.5888 62.5899 61.4447 62.4639 61.2971 62.3226C59.5811 60.6797 57.8637 59.0382 56.1464 57.396C55.8832 57.1447 55.6194 56.8941 55.3437 56.6316C55.233 56.8161 55.2755 56.97 55.2755 57.1155C55.2734 66.853 55.2741 76.5913 55.272 86.3289C55.272 86.9004 55.3402 86.8253 54.7743 86.8273C53.8004 86.8315 52.8258 86.8211 51.8519 86.8336C51.5957 86.8371 51.4927 86.787 51.4927 86.4953C51.501 76.7807 51.4996 67.0661 51.4962 57.3514C51.4962 57.1565 51.5407 57.0493 51.737 56.9651C52.5223 56.6268 53.2943 56.2585 54.0761 55.9132C54.3093 55.8102 54.4234 55.6932 54.4206 55.403C54.4019 53.6181 54.4074 51.8325 54.4158 50.0476C54.4165 49.8325 54.3559 49.6849 54.1965 49.5373C52.7757 48.2237 51.3611 46.9031 49.9521 45.577C49.8066 45.4405 49.7287 45.4461 49.5908 45.5811C48.2146 46.9254 46.8327 48.2641 45.4481 49.6006C45.3374 49.7078 45.2984 49.8178 45.2991 49.9668C45.3026 51.8102 45.304 53.6536 45.297 55.4962C45.2964 55.687 45.3583 55.7858 45.531 55.8645C46.2877 56.2091 47.0339 56.578 47.7948 56.9129C48.0336 57.018 48.1136 57.1454 48.1129 57.405C48.1032 60.1179 48.1074 62.8301 48.1074 65.5429C48.1074 72.4869 48.1074 79.4309 48.1074 86.3749C48.1074 86.8287 48.1067 86.8287 47.6674 86.8294C46.6817 86.8294 45.6959 86.8169 44.7102 86.8371C44.4018 86.8434 44.3259 86.7563 44.3266 86.4507C44.3357 79.7963 44.3336 73.1427 44.3336 66.4883C44.3336 63.3236 44.3336 60.159 44.3322 56.9936C44.3322 56.8934 44.3614 56.7876 44.303 56.6936C44.2285 56.6623 44.1916 56.718 44.1526 56.7549C42.1651 58.6511 40.1797 60.5488 38.1902 62.443C38.076 62.5516 38.0523 62.6699 38.0523 62.8147C38.0551 64.0086 38.0593 65.2032 38.0489 66.3971C38.0468 66.6073 38.1296 66.7041 38.3078 66.7883C39.1119 67.1698 39.9068 67.5701 40.7137 67.9467C40.9016 68.0344 40.965 68.1381 40.965 68.34C40.9601 74.4027 40.9601 80.466 40.9664 86.5287C40.9664 86.7842 40.8717 86.8357 40.642 86.8336C39.6681 86.8239 38.6935 86.8176 37.7196 86.8364C37.423 86.842 37.3604 86.7515 37.3604 86.4674C37.3687 80.3115 37.3666 74.1562 37.3666 68.0003C37.3666 67.8666 37.3666 67.733 37.3666 67.5199C37.1571 67.7009 37.0067 67.8207 36.8668 67.9515C35.0283 69.6842 33.1933 71.4211 31.3506 73.1489C31.1564 73.3313 31.0854 73.5193 31.0861 73.7831C31.0937 78.0031 31.0882 82.2224 31.0979 86.4424C31.0986 86.7396 31.0346 86.835 30.7185 86.835C20.5946 86.8267 10.4699 86.828 0.345981 86.8273C0.230422 86.8273 0.115559 86.8141 0 86.8072C0 86.7842 0 86.7605 0 86.7375C0.145493 86.6777 0.170554 86.5252 0.235295 86.4111C1.77585 83.6926 3.31153 80.9714 4.84721 78.2502C9.07487 70.7619 13.3011 63.2735 17.5302 55.7858C23.3464 45.4865 29.1647 35.1885 34.9817 24.8898C39.3346 17.1829 43.6897 9.47451 48.0378 1.76268C48.3649 1.1821 48.7471 0.62937 48.9852 6.10352e-05C49.0082 6.10352e-05 49.0318 6.10352e-05 49.0548 6.10352e-05Z" fill="#8E51FF" />
          <path d="M121.173 24.2062C120.961 24.2062 120.81 24.2062 120.66 24.2062C106.64 24.2062 92.6196 24.2048 78.5987 24.2132C78.2827 24.2132 78.1114 24.122 77.9534 23.8429C73.5552 16.0893 69.1465 8.34054 64.74 0.591823C64.6899 0.503414 64.6432 0.41222 64.5757 0.285522C97.6033 0.285522 130.596 0.285522 163.638 0.285522C163.397 0.715736 163.17 1.12646 162.937 1.5337C157.279 11.4572 151.62 21.3806 145.961 31.3041C139.494 42.6449 133.027 53.9857 126.561 65.3271C122.657 72.1744 118.752 79.0209 114.858 85.8737C114.691 86.1674 114.551 86.2586 114.218 86.1361C113.697 85.9454 113.156 85.8089 112.621 85.6607C112.464 85.6175 112.368 85.5416 112.291 85.3933C109.51 80.0421 106.724 74.693 103.937 69.3446C102.863 67.2812 101.788 65.2172 100.701 63.1601C100.572 62.9164 100.58 62.7389 100.71 62.4973C102.955 58.317 105.188 54.1298 107.426 49.9453C109.642 45.8019 111.86 41.6598 114.075 37.5157C115.832 34.2292 117.585 30.94 119.339 27.6521C119.917 26.5696 120.495 25.4878 121.073 24.406C121.1 24.358 121.123 24.3086 121.173 24.2062Z" fill="#8E51FF" />
        </svg>
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
          <UTooltip v-if="collapsed" :text="isDark ? 'Light mode' : 'Dark mode'" :content="{ placement: 'right' }">
            <UButton
              :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="toggleDark"
            />
          </UTooltip>

          <template v-if="!collapsed">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-highlighted truncate">{{ user?.full_name ?? '…' }}</p>
              <p class="text-xs text-muted truncate capitalize">{{ user?.role?.replace('_', ' ') }}</p>
            </div>
            <UTooltip :text="isDark ? 'Light mode' : 'Dark mode'" :content="{ placement: 'top' }">
              <UButton
                :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="toggleDark"
              />
            </UTooltip>
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
