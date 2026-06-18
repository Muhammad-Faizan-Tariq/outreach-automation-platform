<script setup lang="ts">
import type { UserSummary, UserCreate } from '~/composables/useUsers'

const { users, loading, error, fetchUsers, createUser, updateUser, deleteUser } = useUsers()
const toast = useToast()
const { public: cfg } = useRuntimeConfig()

const search = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(), cfg.searchDebounce)
})
onUnmounted(() => { if (searchTimer) clearTimeout(searchTimer) })

async function load() {
  await fetchUsers({ search: search.value || undefined, page_size: 100 })
}

onMounted(load)

// ── Add user modal ─────────────────────────────────────────────────────────
const addOpen = ref(false)
const addForm = ref<UserCreate>({ email: '', full_name: '', role: 'viewer', password: '' })
const saving = ref(false)

const ROLE_OPTIONS = [
  { label: 'Admin — full access', value: 'admin' },
  { label: 'Manager — campaigns & contacts', value: 'manager' },
  { label: 'Agent — handle replies', value: 'agent' },
  { label: 'Viewer — read-only', value: 'viewer' },
]

function openAdd() {
  addForm.value = { email: '', full_name: '', role: 'viewer', password: '' }
  addOpen.value = true
}

async function saveUser() {
  if (!addForm.value.email || !addForm.value.full_name || !addForm.value.password) return
  saving.value = true
  try {
    await createUser(addForm.value)
    await load()
    addOpen.value = false
    toast.add({ title: 'User created', color: 'success', icon: 'i-lucide-check' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to create user', description: e?.data?.detail ?? 'Unknown error', color: 'error', icon: 'i-lucide-x' })
  }
  finally {
    saving.value = false
  }
}

// ── Row actions ────────────────────────────────────────────────────────────
async function changeRole(u: UserSummary, role: string) {
  try {
    await updateUser(u.id, { role })
    await load()
    toast.add({ title: 'Role updated', color: 'success', icon: 'i-lucide-check' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to update role', description: e?.data?.detail ?? 'Unknown error', color: 'error', icon: 'i-lucide-x' })
  }
}

async function toggleActive(u: UserSummary) {
  try {
    await updateUser(u.id, { is_active: !u.is_active })
    await load()
  }
  catch (e: any) {
    toast.add({ title: 'Failed to update user', description: e?.data?.detail ?? 'Unknown error', color: 'error', icon: 'i-lucide-x' })
  }
}

async function removeUser(u: UserSummary) {
  try {
    await deleteUser(u.id)
    await load()
    toast.add({ title: 'User deactivated', color: 'success', icon: 'i-lucide-check' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to remove user', description: e?.data?.detail ?? 'Unknown error', color: 'error', icon: 'i-lucide-x' })
  }
}

// ── Formatting ─────────────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const ROLE_COLOR: Record<string, BadgeColor> = {
  super_admin: 'error', admin: 'error', manager: 'primary', agent: 'info', viewer: 'neutral',
}
function roleColor(r: string): BadgeColor { return (ROLE_COLOR[r] ?? 'neutral') as BadgeColor }

function relTime(ts: string | null): string {
  if (!ts) return 'Never'
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago'
  const d = Math.floor(diff / 86_400_000)
  return d === 1 ? 'Yesterday' : d + 'd ago'
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

const activeCount = computed(() => users.value.filter(u => u.is_active).length)
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Users</h1>
        <p class="mt-0.5 text-sm text-muted">{{ activeCount }} active members</p>
      </div>
      <UButton icon="i-lucide-user-plus" @click="openAdd">Add user</UButton>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search by name or email…" class="max-w-sm" />
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 p-3 rounded-lg bg-error-50 text-error-700 text-sm">{{ error }}</div>

    <!-- Loading skeleton (initial load only) -->
    <div v-if="loading && !users.length" class="space-y-2">
      <USkeleton v-for="i in 5" :key="i" class="h-16 rounded-xl" />
    </div>

    <!-- User list -->
    <UCard v-else :ui="{ body: 'p-0' }" :class="loading ? 'opacity-60 pointer-events-none' : ''"  >
      <div v-if="!users.length" class="py-16 text-center">
        <UIcon name="i-lucide-users" class="w-10 h-10 text-muted mx-auto mb-3" />
        <p class="text-sm font-semibold text-highlighted mb-1">No users found</p>
        <p class="text-xs text-muted">Try adjusting your search or add a new user.</p>
      </div>
      <ul v-else class="divide-y divide-default">
        <li
          v-for="u in users"
          :key="u.id"
          class="flex items-center gap-4 px-5 py-4 hover:bg-elevated transition-colors"
          :class="!u.is_active ? 'opacity-50' : ''"
        >
          <!-- Avatar -->
          <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {{ initials(u.full_name) }}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <p class="text-sm font-semibold text-highlighted truncate">{{ u.full_name }}</p>
              <UBadge :color="roleColor(u.role)" variant="subtle" size="xs" class="capitalize shrink-0">
                {{ u.role }}
              </UBadge>
              <UBadge v-if="!u.is_active" color="neutral" variant="subtle" size="xs" class="shrink-0">
                Inactive
              </UBadge>
            </div>
            <p class="text-xs text-muted truncate">{{ u.email }}</p>
            <p class="text-xs text-muted mt-0.5">Last login: {{ relTime(u.last_login_at) }}</p>
          </div>

          <!-- Actions -->
          <UDropdownMenu
            :items="[[
              { label: 'Make admin', icon: 'i-lucide-shield', disabled: u.role === 'admin', onSelect: () => changeRole(u, 'admin') },
              { label: 'Make manager', icon: 'i-lucide-user-cog', disabled: u.role === 'manager', onSelect: () => changeRole(u, 'manager') },
              { label: 'Make agent', icon: 'i-lucide-headset', disabled: u.role === 'agent', onSelect: () => changeRole(u, 'agent') },
              { label: 'Make viewer', icon: 'i-lucide-eye', disabled: u.role === 'viewer', onSelect: () => changeRole(u, 'viewer') },
              { label: u.is_active ? 'Deactivate user' : 'Activate user', icon: u.is_active ? 'i-lucide-user-x' : 'i-lucide-user-check', onSelect: () => toggleActive(u) },
              { label: 'Remove', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => removeUser(u) },
            ]]"
          >
            <UButton icon="i-lucide-more-horizontal" color="neutral" variant="ghost" size="xs" />
          </UDropdownMenu>
        </li>
      </ul>
    </UCard>

    <!-- Add user modal -->
    <UModal v-model:open="addOpen">
      <template #content>
        <UCard class="max-w-md w-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-highlighted">Add user</h3>
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="addOpen = false" />
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Full name</label>
              <UInput v-model="addForm.full_name" placeholder="Jane Smith" />
            </div>
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Email address</label>
              <UInput v-model="addForm.email" type="email" placeholder="name@company.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Temporary password</label>
              <UInput v-model="addForm.password" type="password" placeholder="Min 8 characters" />
            </div>
            <div>
              <label class="block text-sm font-medium text-highlighted mb-1.5">Role</label>
              <USelect v-model="addForm.role" :items="ROLE_OPTIONS" value-key="value" label-key="label" />
              <p class="text-xs text-muted mt-1">
                <span v-if="addForm.role === 'admin'">Full platform access including user management.</span>
                <span v-else-if="addForm.role === 'manager'">Can create campaigns, manage contacts and inboxes.</span>
                <span v-else-if="addForm.role === 'agent'">Can view and handle replies assigned to them.</span>
                <span v-else>Read-only access to campaigns, analytics, and contacts.</span>
              </p>
            </div>
            <div class="flex gap-2 pt-1">
              <UButton color="neutral" variant="ghost" class="flex-1" @click="addOpen = false">Cancel</UButton>
              <UButton
                class="flex-1"
                :loading="saving"
                :disabled="!addForm.email.trim() || !addForm.full_name.trim() || !addForm.password.trim()"
                @click="saveUser"
              >
                Create user
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

  </div>
</template>
