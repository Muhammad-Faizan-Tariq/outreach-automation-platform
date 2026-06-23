<script setup lang="ts">
import type { WAPhoneNumber } from '~/composables/useWaPhoneNumbers'

const router = useRouter()
const { accounts, loading, error, fetchAccounts, createAccount, updateAccount, deleteAccount, testAccount } = useWaAccounts()
const { fetchAccountPhones, addPhone, deletePhone } = useWaPhoneNumbers()
const toast = useToast()

// ── Account create/edit ──────────────────────────────────────────────────
const showAccountModal = ref(false)
const saving = ref(false)
const editingAccount = ref<any | null>(null)

const accountForm = reactive({
  name: '',
  access_token: '',
})

function openCreate() {
  editingAccount.value = null
  Object.assign(accountForm, { name: '', access_token: '' })
  showAccountModal.value = true
}

function openEdit(account: any) {
  editingAccount.value = account
  Object.assign(accountForm, { name: account.name, access_token: '' })
  showAccountModal.value = true
}

async function handleSave() {
  if (!accountForm.name) {
    toast.add({ title: 'Account name is required', color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }
  if (!editingAccount.value && !accountForm.access_token) {
    toast.add({ title: 'Access token is required for new accounts', color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }
  saving.value = true
  try {
    if (editingAccount.value) {
      const payload: any = { name: accountForm.name }
      if (accountForm.access_token)
        payload.access_token = accountForm.access_token
      await updateAccount(editingAccount.value.id, payload)
      toast.add({ title: 'Account updated', color: 'success', icon: 'i-lucide-check-circle' })
    }
    else {
      await createAccount({ name: accountForm.name, access_token: accountForm.access_token })
      toast.add({ title: 'Account created', description: 'Credentials encrypted and saved.', color: 'success', icon: 'i-lucide-check-circle' })
    }
    showAccountModal.value = false
    await fetchAccounts()
  }
  catch (e: any) {
    toast.add({ title: 'Failed to save', description: e?.data?.detail ?? 'Something went wrong.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    saving.value = false
  }
}

// ── Account test / delete / toggle ──────────────────────────────────────
const testingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

async function handleTest(id: string) {
  testingId.value = id
  try {
    const result = await testAccount(id)
    if (result.ok)
      toast.add({ title: 'Connection OK', description: `Wallet balance: ${result.balance?.walletBalance ?? 'N/A'}`, color: 'success', icon: 'i-lucide-wifi' })
    else
      toast.add({ title: 'Connection failed', description: result.detail ?? 'Check your credentials.', color: 'error', icon: 'i-lucide-wifi-off' })
  }
  catch (e: any) {
    toast.add({ title: 'Test failed', description: e?.data?.detail ?? 'Could not reach Alots.', color: 'error', icon: 'i-lucide-wifi-off' })
  }
  finally {
    testingId.value = null
  }
}

async function handleDelete(id: string, name: string) {
  deletingId.value = id
  try {
    await deleteAccount(id)
    toast.add({ title: 'Account deleted', description: `"${name}" has been removed.`, color: 'success', icon: 'i-lucide-trash-2' })
    await fetchAccounts()
  }
  catch (e: any) {
    toast.add({ title: 'Delete failed', description: e?.data?.detail ?? 'Could not delete account.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    deletingId.value = null
  }
}

async function toggleActive(account: any) {
  try {
    await updateAccount(account.id, { is_active: !account.is_active })
    await fetchAccounts()
    toast.add({ title: account.is_active ? 'Account deactivated' : 'Account activated', color: 'neutral', icon: 'i-lucide-toggle-left' })
  }
  catch {
    toast.add({ title: 'Update failed', color: 'error', icon: 'i-lucide-x-circle' })
  }
}

// ── Phone number panel ────────────────────────────────────────────────────
const phonePanelAccount = ref<any | null>(null)
const phonePanelPhones = ref<WAPhoneNumber[]>([])
const phonePanelLoading = ref(false)
const showPhonePanel = ref(false)

async function openPhonePanel(account: any) {
  phonePanelAccount.value = account
  showPhonePanel.value = true
  phonePanelLoading.value = true
  try {
    phonePanelPhones.value = await fetchAccountPhones(account.id)
  }
  catch (e: any) {
    toast.add({ title: 'Failed to load phone numbers', description: e?.data?.detail, color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    phonePanelLoading.value = false
  }
}

// ── Add phone modal ────────────────────────────────────────────────────────
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
    const newPhone = await addPhone(phonePanelAccount.value.id, {
      phone_number: phoneForm.phone_number || null,
      waba_id: phoneForm.waba_id,
      phone_number_id: phoneForm.phone_number_id,
      display_name: phoneForm.display_name || null,
    })
    phonePanelPhones.value.push(newPhone)
    showAddPhone.value = false
    toast.add({ title: 'Phone number added', color: 'success', icon: 'i-lucide-check-circle' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to add phone', description: e?.data?.detail ?? 'Something went wrong.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    savingPhone.value = false
  }
}

const deletingPhoneId = ref<string | null>(null)

async function handleDeletePhone(phone: WAPhoneNumber) {
  deletingPhoneId.value = phone.id
  try {
    await deletePhone(phone.id)
    phonePanelPhones.value = phonePanelPhones.value.filter(p => p.id !== phone.id)
    toast.add({ title: 'Phone number removed', color: 'success', icon: 'i-lucide-trash-2' })
  }
  catch (e: any) {
    toast.add({ title: 'Failed to delete', description: e?.data?.detail, color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    deletingPhoneId.value = null
  }
}

onMounted(fetchAccounts)
</script>

<template>
  <div class="px-6 py-8 max-w-5xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">WA Accounts</h1>
        <p class="text-sm text-muted mt-0.5">Manage Alots logins. Each account can have multiple phone numbers.</p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" @click="openCreate">
        Add Account
      </UButton>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 px-4 py-3 bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800 rounded-xl text-sm text-error-600 dark:text-error-400">
      {{ error }}
    </div>

    <AppPageLoader v-if="loading && accounts.length === 0" label="Loading accounts…" />

    <!-- Empty -->
    <div v-else-if="!loading && accounts.length === 0" class="text-center py-20 text-muted">
      <UIcon name="i-lucide-building-2" class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm font-medium">No accounts yet</p>
      <p class="text-xs mt-1">Add your first Alots account to start sending WhatsApp messages.</p>
      <UButton class="mt-4" icon="i-lucide-plus" @click="openCreate">Add Account</UButton>
    </div>

    <!-- Account list -->
    <div v-else class="space-y-3">
      <div
        v-for="account in accounts"
        :key="account.id"
        class="bg-default border border-default rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-colors"
        :class="!account.is_active ? 'opacity-60' : ''"
        @click="router.push(`/whatsapp/accounts/${account.id}`)"
      >
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-highlighted truncate">{{ account.name }}</p>
            <UBadge v-if="!account.is_active" color="neutral" variant="subtle" size="xs">Inactive</UBadge>
            <UBadge v-else color="success" variant="subtle" size="xs">Active</UBadge>
          </div>
          <p class="text-xs text-muted mt-0.5">Created {{ new Date(account.created_at).toLocaleDateString() }}</p>
        </div>

        <div class="flex items-center gap-1 shrink-0" @click.stop>
          <UButton
            icon="i-lucide-phone"
            color="neutral"
            variant="soft"
            size="xs"
            title="Manage phone numbers"
            @click="openPhonePanel(account)"
          >
            Phones
          </UButton>
          <UButton icon="i-lucide-wifi" color="neutral" variant="ghost" size="xs" title="Test connection"
            :loading="testingId === account.id" @click="handleTest(account.id)" />
          <UButton :icon="account.is_active ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'"
            color="neutral" variant="ghost" size="xs"
            :title="account.is_active ? 'Deactivate' : 'Activate'"
            @click="toggleActive(account)" />
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" title="Edit"
            @click="openEdit(account)" />
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" title="Delete"
            :loading="deletingId === account.id" @click="handleDelete(account.id, account.name)" />
        </div>
      </div>
    </div>

    <!-- Create / Edit account modal -->
    <UModal v-model:open="showAccountModal" :title="editingAccount ? 'Edit Account' : 'Add Alots Account'">
      <template #body>
        <div class="space-y-4">
          <div class="flex items-start gap-2 p-3 bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg">
            <UIcon name="i-lucide-lock" class="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
            <p class="text-xs text-warning-700 dark:text-warning-400">
              Your access token is <strong>Fernet-encrypted</strong> before being stored. It is never returned in API responses.
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Account name <span class="text-error-500">*</span></label>
            <UInput v-model="accountForm.name" placeholder="e.g. Dubai 01" />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Access Token <span class="text-error-500">*</span>
              <span v-if="editingAccount" class="normal-case font-normal text-muted ml-1">(leave blank to keep existing)</span>
            </label>
            <UInput v-model="accountForm.access_token" type="password" placeholder="your-alots-access-token" autocomplete="new-password" />
          </div>
          <p class="text-xs text-muted">
            After creating the account, click <strong>Phones</strong> to add WABA IDs and phone number IDs.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showAccountModal = false">Cancel</UButton>
          <UButton :loading="saving" @click="handleSave">
            {{ editingAccount ? 'Save changes' : 'Create account' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Phone numbers side panel (modal) -->
    <UModal v-model:open="showPhonePanel" :title="`Phone numbers — ${phonePanelAccount?.name ?? ''}`" size="xl">
      <template #body>
        <div class="space-y-4">
          <div class="flex justify-end">
            <UButton icon="i-lucide-plus" size="sm" @click="openAddPhone">Add phone</UButton>
          </div>

          <div v-if="phonePanelLoading" class="space-y-2">
            <USkeleton v-for="i in 3" :key="i" class="h-14 rounded-lg" />
          </div>

          <div v-else-if="phonePanelPhones.length === 0" class="text-center py-10 text-muted">
            <UIcon name="i-lucide-phone-off" class="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p class="text-sm">No phone numbers yet — click "Add phone" to add one.</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="ph in phonePanelPhones"
              :key="ph.id"
              class="flex items-center gap-3 px-4 py-3 bg-default border border-default rounded-xl"
              :class="!ph.is_active ? 'opacity-50' : ''"
            >
              <UIcon name="i-lucide-smartphone" class="w-5 h-5 text-muted shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-highlighted">
                  {{ ph.display_name || ph.phone_number || '(no number)' }}
                </p>
                <p class="text-xs text-muted font-mono truncate">
                  WABA: {{ ph.waba_id }} · Phone ID: {{ ph.phone_number_id }}
                </p>
              </div>
              <UBadge v-if="!ph.is_active" color="neutral" variant="subtle" size="xs">Inactive</UBadge>
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                :loading="deletingPhoneId === ph.id"
                @click="handleDeletePhone(ph)"
              />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end">
          <UButton color="neutral" variant="ghost" @click="showPhonePanel = false">Close</UButton>
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

  </div>
</template>
