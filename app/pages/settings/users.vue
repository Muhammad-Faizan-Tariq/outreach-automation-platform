<script setup lang="ts">
interface User {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
  status: 'active' | 'invited' | 'disabled'
  last_login: string | null
  created_at: string
}

const MOCK_USERS: User[] = [
  { id: 'u1', full_name: 'Muhammad Fizan', email: 'mfaizantariq99@gmail.com', role: 'admin', status: 'active', last_login: '2025-06-09T07:00:00Z', created_at: '2025-01-01T00:00:00Z' },
  { id: 'u2', full_name: 'Sarah Al-Mansoori', email: 'sarah@dxbpropvault.com', role: 'manager', status: 'active', last_login: '2025-06-08T14:30:00Z', created_at: '2025-02-15T00:00:00Z' },
  { id: 'u3', full_name: 'Khalid Hassan', email: 'khalid@dxbpropvault.com', role: 'manager', status: 'active', last_login: '2025-06-07T09:00:00Z', created_at: '2025-03-01T00:00:00Z' },
  { id: 'u4', full_name: 'Nadia Karim', email: 'nadia@dxbpropvault.com', role: 'viewer', status: 'invited', last_login: null, created_at: '2025-06-01T00:00:00Z' },
  { id: 'u5', full_name: 'Omar Sheikh', email: 'omar@dxbpropvault.com', role: 'viewer', status: 'disabled', last_login: '2025-05-20T11:00:00Z', created_at: '2025-04-01T00:00:00Z' },
]

const users = ref(MOCK_USERS)
const inviteOpen = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<'admin' | 'manager' | 'viewer'>('viewer')
const inviting = ref(false)
const toast = useToast()

const ROLE_OPTIONS = [
  { label: 'Admin — full access', value: 'admin' },
  { label: 'Manager — manage campaigns & contacts', value: 'manager' },
  { label: 'Viewer — read-only access', value: 'viewer' },
]

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const ROLE_COLOR: Record<string, BadgeColor> = { admin: 'error', manager: 'primary', viewer: 'neutral' }
const STATUS_COLOR: Record<string, BadgeColor> = { active: 'success', invited: 'warning', disabled: 'neutral' }

function roleColor(r: string): BadgeColor { return (ROLE_COLOR[r] ?? 'neutral') as BadgeColor }
function statusColor(s: string): BadgeColor { return (STATUS_COLOR[s] ?? 'neutral') as BadgeColor }

function relTime(ts: string | null): string {
  if (!ts) return 'Never'
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  const d = Math.floor(diff / 86_400_000)
  return d === 1 ? 'Yesterday' : `${d}d ago`
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

async function sendInvite() {
  if (!inviteEmail.value.trim()) return
  inviting.value = true
  await new Promise(r => setTimeout(r, 800))
  users.value.push({
    id: `u${Date.now()}`,
    full_name: inviteEmail.value.split('@')[0] ?? 'New User',
    email: inviteEmail.value,
    role: inviteRole.value,
    status: 'invited',
    last_login: null,
    created_at: new Date().toISOString(),
  })
  inviting.value = false
  inviteOpen.value = false
  inviteEmail.value = ''
  toast.add({ title: 'Invite sent', description: `Invitation sent to ${inviteEmail.value}.`, color: 'success', icon: 'i-lucide-mail' })
}

function toggleStatus(user: User) {
  user.status = user.status === 'active' ? 'disabled' : 'active'
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Users</h1>
        <p class="mt-0.5 text-sm text-muted">{{ users.filter(u => u.status !== 'disabled').length }} active members</p>
      </div>
      <UButton icon="i-lucide-user-plus" @click="inviteOpen = true">Invite user</UButton>
    </div>

    <!-- User list -->
    <UCard :ui="{ body: 'p-0' }">
      <ul class="divide-y divide-default">
        <li
          v-for="user in users"
          :key="user.id"
          class="flex items-center gap-4 px-5 py-4 hover:bg-elevated transition-colors"
          :class="user.status === 'disabled' ? 'opacity-50' : ''"
        >
          <!-- Avatar -->
          <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {{ initials(user.full_name) }}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <p class="text-sm font-semibold text-highlighted truncate">{{ user.full_name }}</p>
              <UBadge :color="roleColor(user.role)" variant="subtle" size="xs" class="capitalize shrink-0">
                {{ user.role }}
              </UBadge>
              <UBadge :color="statusColor(user.status)" variant="subtle" size="xs" class="capitalize shrink-0">
                {{ user.status }}
              </UBadge>
            </div>
            <p class="text-xs text-muted truncate">{{ user.email }}</p>
            <p class="text-xs text-muted mt-0.5">Last login: {{ relTime(user.last_login) }}</p>
          </div>

          <!-- Actions -->
          <UDropdownMenu
            :items="[[
              { label: 'Make admin', icon: 'i-lucide-shield', disabled: user.role === 'admin', onSelect: () => { user.role = 'admin' } },
              { label: 'Make manager', icon: 'i-lucide-user-cog', disabled: user.role === 'manager', onSelect: () => { user.role = 'manager' } },
              { label: 'Make viewer', icon: 'i-lucide-eye', disabled: user.role === 'viewer', onSelect: () => { user.role = 'viewer' } },
              { label: user.status === 'active' ? 'Disable user' : 'Enable user', icon: user.status === 'active' ? 'i-lucide-user-x' : 'i-lucide-user-check', onSelect: () => toggleStatus(user) },
              { label: 'Remove', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => { users.value = users.value.filter(u => u.id !== user.id) } },
            ]]"
          >
            <UButton icon="i-lucide-more-horizontal" color="neutral" variant="ghost" size="xs" />
          </UDropdownMenu>
        </li>
      </ul>
    </UCard>

    <!-- Invite modal -->
    <UModal v-model:open="inviteOpen">
      <template #content>
        <UCard class="max-w-md w-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-highlighted">Invite user</h3>
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="inviteOpen = false" />
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Email address</label>
              <UInput v-model="inviteEmail" type="email" placeholder="name@dxbpropvault.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Role</label>
              <USelect v-model="inviteRole" :items="ROLE_OPTIONS" value-key="value" label-key="label" />
              <p class="text-xs text-muted mt-1">
                <span v-if="inviteRole === 'admin'">Full platform access including billing and user management.</span>
                <span v-else-if="inviteRole === 'manager'">Can create campaigns, manage contacts and inboxes.</span>
                <span v-else>Read-only access to campaigns, analytics, and contacts.</span>
              </p>
            </div>
            <UButton block :loading="inviting" :disabled="!inviteEmail.trim()" @click="sendInvite">
              Send invite
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>

  </div>
</template>
