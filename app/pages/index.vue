<script setup lang="ts">
const { user } = useAuth()
const { contacts, total: contactTotal, fetchContacts } = useContacts()
const { inboxes, fetchInboxes } = useInboxes()
const router = useRouter()

onMounted(async () => {
  await Promise.allSettled([
    fetchContacts({ page: 1, page_size: 5 }),
    fetchInboxes(),
  ])
})

const stats = computed(() => [
  {
    label: 'Total contacts',
    value: contactTotal.value.toLocaleString(),
    icon: 'i-lucide-users',
    to: '/contacts',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Connected inboxes',
    value: inboxes.value.length.toString(),
    icon: 'i-lucide-mail',
    to: '/inboxes',
    color: 'text-success-600',
    bg: 'bg-success-50',
  },
  {
    label: 'Active inboxes',
    value: inboxes.value.filter(i => i.status === 'active').length.toString(),
    icon: 'i-lucide-send',
    to: '/inboxes',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    label: 'Warming up',
    value: inboxes.value.filter(i => i.status === 'warming_up').length.toString(),
    icon: 'i-lucide-flame',
    to: '/inboxes',
    color: 'text-warning-600',
    bg: 'bg-warning-50',
  },
])

const quickActions = [
  {
    label: 'Import contacts',
    description: 'Upload a DLD CSV file to add contacts in bulk.',
    icon: 'i-lucide-upload',
    to: '/contacts',
  },
  {
    label: 'Connect inbox',
    description: 'Link a Gmail account to start sending from your own domain.',
    icon: 'i-lucide-mail-plus',
    to: '/inboxes',
  },
  {
    label: 'View health',
    description: 'Check API and database connectivity.',
    icon: 'i-lucide-activity',
    to: '/health',
  },
]

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type BadgeColor = 'success' | 'neutral' | 'error' | 'warning' | 'primary' | 'info'
const STATUS_COLOR: Record<string, BadgeColor> = {
  active: 'success',
  unsubscribed: 'neutral',
  bounced: 'error',
  complained: 'warning',
  do_not_contact: 'error',
  deleted: 'neutral',
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <!-- Welcome -->
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-highlighted">
        Good {{ new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening' }},
        {{ user?.full_name?.split(' ')[0] ?? 'there' }} 👋
      </h1>
      <p class="mt-1 text-sm text-muted">Here's what's happening in your outreach platform.</p>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <NuxtLink
        v-for="stat in stats"
        :key="stat.label"
        :to="stat.to"
        class="block"
      >
        <UCard class="hover:shadow-md transition-shadow cursor-pointer h-full">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="stat.bg">
              <UIcon :name="stat.icon" class="w-5 h-5" :class="stat.color" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-highlighted tabular-nums">{{ stat.value }}</p>
              <p class="text-xs text-muted mt-0.5">{{ stat.label }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Recent contacts -->
      <div class="lg:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-highlighted">Recent contacts</h2>
          <NuxtLink to="/contacts" class="text-sm text-primary hover:underline">View all</NuxtLink>
        </div>
        <UCard :ui="{ body: 'p-0' }">
          <div v-if="contacts.length === 0" class="py-10 text-center text-sm text-muted">
            No contacts yet. <NuxtLink to="/contacts" class="text-primary hover:underline">Import a CSV</NuxtLink> to get started.
          </div>
          <ul v-else class="divide-y divide-default">
            <li
              v-for="c in contacts"
              :key="c.id"
              class="flex items-center gap-3 px-4 py-3 hover:bg-elevated cursor-pointer transition-colors"
              @click="router.push(`/contacts/${c.id}`)"
            >
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span class="text-xs font-semibold text-primary">
                  {{ (c.full_name ?? c.email).charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-highlighted truncate">{{ c.full_name ?? c.email }}</p>
                <p class="text-xs text-muted truncate">{{ c.full_name ? c.email : c.country ?? '' }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <UBadge :color="STATUS_COLOR[c.status] ?? 'neutral'" variant="subtle" size="xs" class="capitalize">
                  {{ c.status }}
                </UBadge>
                <span class="text-xs text-muted">{{ fmt(c.created_at) }}</span>
              </div>
            </li>
          </ul>
        </UCard>
      </div>

      <!-- Quick actions -->
      <div>
        <h2 class="text-base font-semibold text-highlighted mb-3">Quick actions</h2>
        <div class="space-y-3">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.label"
            :to="action.to"
            class="block"
          >
            <UCard class="hover:shadow-md transition-shadow cursor-pointer">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <UIcon :name="action.icon" class="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-highlighted">{{ action.label }}</p>
                  <p class="text-xs text-muted mt-0.5">{{ action.description }}</p>
                </div>
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </div>

    </div>
  </div>
</template>
