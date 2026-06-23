<script setup lang="ts">
import type { WAPhoneNumber } from '~/composables/useWaPhoneNumbers'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = route.params.id as string

const { getAccount, updateAccount, deleteAccount, testAccount } = useWaAccounts()
const { fetchAccountPhones, addPhone, updatePhone, deletePhone } = useWaPhoneNumbers()

// ── Account ────────────────────────────────────────────────────────────────
const account = ref<any | null>(null)
const accountLoading = ref(true)

async function loadAccount() {
  accountLoading.value = true
  try {
    account.value = await getAccount(accountId)
  }
  catch (e: any) {
    toast.add({ title: 'Account not found', description: e?.data?.detail, color: 'error', icon: 'i-lucide-x-circle' })
    router.push('/whatsapp/accounts')
  }
  finally {
    accountLoading.value = false
  }
}

// ── Edit account ───────────────────────────────────────────────────────────
const showEditModal = ref(false)
const saving = ref(false)
const editForm = reactive({ name: '', access_token: '' })

function openEdit() {
  Object.assign(editForm, { name: account.value.name, access_token: '' })
  showEditModal.value = true
}

async function handleSave() {
  if (!editForm.name) {
    toast.add({ title: 'Name is required', color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }
  saving.value = true
  try {
    const payload: any = { name: editForm.name }
    if (editForm.access_token) payload.access_token = editForm.access_token
    account.value = await updateAccount(accountId, payload)
    showEditModal.value = false
    toast.add({ title: 'Account updated', color: 'success', icon: 'i-lucide-check-circle' })
  }
  catch (e: any) {
    toast.add({ title: 'Update failed', description: e?.data?.detail, color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    saving.value = false
  }
}

// ── Toggle active ─────────────────────────────────────────────────────────
async function toggleActive() {
  try {
    account.value = await updateAccount(accountId, { is_active: !account.value.is_active })
    toast.add({ title: account.value.is_active ? 'Account activated' : 'Account deactivated', color: 'neutral', icon: 'i-lucide-toggle-left' })
  }
  catch {
    toast.add({ title: 'Update failed', color: 'error', icon: 'i-lucide-x-circle' })
  }
}

// ── Test connection ───────────────────────────────────────────────────────
const testing = ref(false)
async function handleTest() {
  testing.value = true
  try {
    const result = await testAccount(accountId)
    if (result.ok)
      toast.add({ title: 'Connection OK', description: `Wallet balance: ${result.balance?.walletBalance ?? 'N/A'}`, color: 'success', icon: 'i-lucide-wifi' })
    else
      toast.add({ title: 'Connection failed', description: result.detail ?? 'Check credentials.', color: 'error', icon: 'i-lucide-wifi-off' })
  }
  catch (e: any) {
    toast.add({ title: 'Test failed', description: e?.data?.detail, color: 'error', icon: 'i-lucide-wifi-off' })
  }
  finally {
    testing.value = false
  }
}

// ── Delete account ─────────────────────────────────────────────────────────
const deleting = ref(false)
const showDeleteConfirm = ref(false)

async function handleDelete() {
  deleting.value = true
  try {
    await deleteAccount(accountId)
    toast.add({ title: 'Account deleted', color: 'success', icon: 'i-lucide-trash-2' })
    router.push('/whatsapp/accounts')
  }
  catch (e: any) {
    toast.add({ title: 'Delete failed', description: e?.data?.detail, color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

// ── Phone numbers ─────────────────────────────────────────────────────────
const phones = ref<WAPhoneNumber[]>([])
const phonesLoading = ref(true)

async function loadPhones() {
  phonesLoading.value = true
  try {
    phones.value = await fetchAccountPhones(accountId)
  }
  catch (e: any) {
    toast.add({ title: 'Failed to load phone numbers', description: e?.data?.detail, color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    phonesLoading.value = false
  }
}

// ── Add phone ─────────────────────────────────────────────────────────────
const showAddPhone = ref(false)
const savingPhone = ref(false)
const phoneForm = reactive({
  phone_number: '',
  waba_id: '',
  phone_number_id: '',
  display_name: '',
})

function openAddPhone() {
  Object.assign(phoneForm, { phone_number: '', waba_id: '', phone_number_id: '', display_name: '' })
  showAddPhone.value = true
}

async function handleAddPhone() {
  if (!phoneForm.waba_id || !phoneForm.phone_number_id) {
    toast.add({ title: 'WABA ID and Phone Number ID are required', color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }
  savingPhone.value = true
  try {
    const newPhone = await addPhone(accountId, {
      phone_number: phoneForm.phone_number || null,
      waba_id: phoneForm.waba_id,
      phone_number_id: phoneForm.phone_number_id,
      display_name: phoneForm.display_name || null,
    })
    phones.value.push(newPhone)
    showAddPhone.value = false
    toast.add({ title: 'Phone number added', color: 'success', icon: 'i-lucide-check-circle' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to add phone', description: e?.data?.detail, color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    savingPhone.value = false
  }
}

// ── Toggle phone active ───────────────────────────────────────────────────
async function togglePhone(phone: WAPhoneNumber) {
  try {
    const updated = await updatePhone(phone.id, { is_active: !phone.is_active })
    const idx = phones.value.findIndex(p => p.id === phone.id)
    if (idx !== -1) phones.value[idx] = updated
    toast.add({ title: updated.is_active ? 'Phone activated' : 'Phone deactivated', color: 'neutral', icon: 'i-lucide-toggle-left' })
  }
  catch {
    toast.add({ title: 'Update failed', color: 'error', icon: 'i-lucide-x-circle' })
  }
}

// ── Delete phone ──────────────────────────────────────────────────────────
const deletingPhoneId = ref<string | null>(null)

async function handleDeletePhone(phone: WAPhoneNumber) {
  deletingPhoneId.value = phone.id
  try {
    await deletePhone(phone.id)
    phones.value = phones.value.filter(p => p.id !== phone.id)
    toast.add({ title: 'Phone number removed', color: 'success', icon: 'i-lucide-trash-2' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to delete', description: e?.data?.detail, color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    deletingPhoneId.value = null
  }
}

onMounted(() => {
  loadAccount()
  loadPhones()
})
</script>

<template>
  <div class="px-6 py-8 max-w-4xl mx-auto">

    <!-- Back -->
    <div class="mb-6">
      <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/whatsapp/accounts">
        Back to accounts
      </UButton>
    </div>

    <AppPageLoader v-if="accountLoading" label="Loading account…" />

    <template v-else-if="account">

      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <UIcon name="i-lucide-building-2" class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 class="text-2xl font-semibold text-highlighted">{{ account.name }}</h1>
            <p class="text-xs text-muted mt-0.5">Created {{ new Date(account.created_at).toLocaleDateString() }}</p>
          </div>
          <UBadge v-if="account.is_active" color="success" variant="subtle">Active</UBadge>
          <UBadge v-else color="neutral" variant="subtle">Inactive</UBadge>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <UButton icon="i-lucide-wifi" color="neutral" variant="subtle" size="sm" :loading="testing" @click="handleTest">
            Test
          </UButton>
          <UButton
            :icon="account.is_active ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'"
            color="neutral" variant="subtle" size="sm"
            @click="toggleActive"
          >
            {{ account.is_active ? 'Deactivate' : 'Activate' }}
          </UButton>
          <UButton icon="i-lucide-pencil" color="neutral" variant="subtle" size="sm" @click="openEdit">
            Edit
          </UButton>
          <UButton icon="i-lucide-trash-2" color="error" variant="subtle" size="sm" @click="showDeleteConfirm = true">
            Delete
          </UButton>
        </div>
      </div>

      <!-- Info card -->
      <UCard class="mb-6">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">Account ID</p>
            <p class="font-mono text-xs text-highlighted break-all">{{ account.id }}</p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">Access Token</p>
            <p class="text-xs text-muted italic">Fernet-encrypted — not displayed</p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">Status</p>
            <p class="text-sm font-medium" :class="account.is_active ? 'text-success-600' : 'text-muted'">
              {{ account.is_active ? 'Active' : 'Inactive' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide mb-1">Phone Numbers</p>
            <p class="text-sm font-medium text-highlighted">{{ phones.length }}</p>
          </div>
        </div>
      </UCard>

      <!-- Phone numbers section -->
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-highlighted">Phone Numbers</h2>
        <UButton icon="i-lucide-plus" size="sm" @click="openAddPhone">Add Phone</UButton>
      </div>

      <!-- Phones loading -->
      <div v-if="phonesLoading" class="space-y-2">
        <USkeleton v-for="i in 3" :key="i" class="h-16 rounded-xl" />
      </div>

      <!-- Phones empty -->
      <div v-else-if="phones.length === 0" class="text-center py-12 text-muted border border-dashed border-default rounded-xl">
        <UIcon name="i-lucide-phone-off" class="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p class="text-sm">No phone numbers yet</p>
        <UButton class="mt-3" icon="i-lucide-plus" size="sm" variant="subtle" @click="openAddPhone">Add Phone</UButton>
      </div>

      <!-- Phones list -->
      <div v-else class="space-y-2">
        <div
          v-for="phone in phones"
          :key="phone.id"
          class="bg-default border border-default rounded-xl px-5 py-4 flex items-center gap-4"
          :class="!phone.is_active ? 'opacity-50' : ''"
        >
          <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-smartphone" class="w-4 h-4 text-primary" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-highlighted">
                {{ phone.display_name || phone.phone_number || '(no number)' }}
              </p>
              <UBadge v-if="!phone.is_active" color="neutral" variant="subtle" size="xs">Inactive</UBadge>
            </div>
            <p class="text-xs text-muted font-mono mt-0.5">
              WABA: {{ phone.waba_id }}
            </p>
            <p class="text-xs text-muted font-mono">
              Phone ID: {{ phone.phone_number_id }}
            </p>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <UButton
              :icon="phone.is_active ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'"
              color="neutral" variant="ghost" size="xs"
              :title="phone.is_active ? 'Deactivate' : 'Activate'"
              @click="togglePhone(phone)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error" variant="ghost" size="xs"
              :loading="deletingPhoneId === phone.id"
              @click="handleDeletePhone(phone)"
            />
          </div>
        </div>
      </div>

    </template>

    <!-- Edit account modal -->
    <UModal v-model:open="showEditModal" title="Edit Account">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Account Name <span class="text-error-500">*</span></label>
            <UInput v-model="editForm.name" placeholder="e.g. Dubai 01" />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Access Token
              <span class="normal-case font-normal text-muted ml-1">(leave blank to keep existing)</span>
            </label>
            <UInput v-model="editForm.access_token" type="password" placeholder="new-access-token" autocomplete="new-password" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showEditModal = false">Cancel</UButton>
          <UButton :loading="saving" @click="handleSave">Save changes</UButton>
        </div>
      </template>
    </UModal>

    <!-- Add phone modal -->
    <UModal v-model:open="showAddPhone" title="Add Phone Number">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Phone Number</label>
            <UInput v-model="phoneForm.phone_number" placeholder="e.g. 447401457395 (leave blank if unknown)" />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">WABA ID <span class="text-error-500">*</span></label>
            <UInput v-model="phoneForm.waba_id" placeholder="e.g. 1645170000000000" />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Phone Number ID <span class="text-error-500">*</span></label>
            <UInput v-model="phoneForm.phone_number_id" placeholder="e.g. 810596165478108" />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Display Name</label>
            <UInput v-model="phoneForm.display_name" placeholder="Optional label" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showAddPhone = false">Cancel</UButton>
          <UButton :loading="savingPhone" @click="handleAddPhone">Add</UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete confirm modal -->
    <UModal v-model:open="showDeleteConfirm" title="Delete Account">
      <template #body>
        <p class="text-sm text-muted">
          Are you sure you want to delete <strong class="text-highlighted">{{ account?.name }}</strong>?
          This will also delete all its phone numbers. This cannot be undone.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showDeleteConfirm = false">Cancel</UButton>
          <UButton color="error" :loading="deleting" @click="handleDelete">Delete</UButton>
        </div>
      </template>
    </UModal>

  </div>
</template>
