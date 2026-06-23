export interface WAAccount {
  id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WAAccountCreate {
  name: string
  access_token: string
}

export interface WAAccountUpdate {
  name?: string
  access_token?: string
  is_active?: boolean
}

export const useWaAccounts = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const accounts = ref<WAAccount[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchAccounts = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ items: WAAccount[]; total: number }>(
        `${apiBase}/wa/accounts`,
        { headers: authHeaders.value },
      )
      accounts.value = res.items
      total.value = res.total
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load accounts'
    }
    finally {
      loading.value = false
    }
  }

  const getAccount = async (id: string): Promise<WAAccount> => {
    return $fetch<WAAccount>(`${apiBase}/wa/accounts/${id}`, { headers: authHeaders.value })
  }

  const createAccount = async (data: WAAccountCreate): Promise<WAAccount> => {
    return $fetch<WAAccount>(`${apiBase}/wa/accounts`, {
      method: 'POST',
      headers: authHeaders.value,
      body: data,
    })
  }

  const updateAccount = async (id: string, data: WAAccountUpdate): Promise<WAAccount> => {
    return $fetch<WAAccount>(`${apiBase}/wa/accounts/${id}`, {
      method: 'PUT',
      headers: authHeaders.value,
      body: data,
    })
  }

  const deleteAccount = async (id: string): Promise<void> => {
    await $fetch(`${apiBase}/wa/accounts/${id}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })
  }

  const testAccount = async (id: string): Promise<{ ok: boolean; balance?: any; detail?: string }> => {
    return $fetch(`${apiBase}/wa/accounts/${id}/test`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  return {
    accounts,
    total,
    loading,
    error,
    fetchAccounts,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    testAccount,
  }
}
