export interface WAPhoneNumber {
  id: string
  wa_account_id: string
  phone_number: string | null
  waba_id: string
  phone_number_id: string
  display_name: string | null
  is_active: boolean
  created_at: string
}

export interface WAPhoneNumberCreate {
  phone_number?: string | null
  waba_id: string
  phone_number_id: string
  display_name?: string | null
}

export interface WAPhoneNumberUpdate {
  phone_number?: string | null
  waba_id?: string
  phone_number_id?: string
  display_name?: string | null
  is_active?: boolean
}

/** Human-readable label for a phone number selector. */
export const phoneLabel = (phone: WAPhoneNumber, accountName?: string): string => {
  const base = phone.display_name || phone.phone_number || phone.phone_number_id
  return accountName ? `${accountName} — ${base}` : base
}

export const useWaPhoneNumbers = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const phones = ref<WAPhoneNumber[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Fetch all active phone numbers (flat list for selectors). */
  const fetchAllPhones = async () => {
    loading.value = true
    error.value = null
    try {
      phones.value = await $fetch<WAPhoneNumber[]>(`${apiBase}/wa/phones`, {
        headers: authHeaders.value,
      })
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load phone numbers'
    }
    finally {
      loading.value = false
    }
  }

  /** Fetch phone numbers for one account. */
  const fetchAccountPhones = async (accountId: string): Promise<WAPhoneNumber[]> => {
    return $fetch<WAPhoneNumber[]>(`${apiBase}/wa/accounts/${accountId}/phones`, {
      headers: authHeaders.value,
    })
  }

  const addPhone = async (accountId: string, data: WAPhoneNumberCreate): Promise<WAPhoneNumber> => {
    return $fetch<WAPhoneNumber>(`${apiBase}/wa/accounts/${accountId}/phones`, {
      method: 'POST',
      headers: authHeaders.value,
      body: data,
    })
  }

  const updatePhone = async (phoneId: string, data: WAPhoneNumberUpdate): Promise<WAPhoneNumber> => {
    return $fetch<WAPhoneNumber>(`${apiBase}/wa/phones/${phoneId}`, {
      method: 'PUT',
      headers: authHeaders.value,
      body: data,
    })
  }

  const deletePhone = async (phoneId: string): Promise<void> => {
    await $fetch(`${apiBase}/wa/phones/${phoneId}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })
  }

  return {
    phones,
    loading,
    error,
    fetchAllPhones,
    fetchAccountPhones,
    addPhone,
    updatePhone,
    deletePhone,
  }
}
