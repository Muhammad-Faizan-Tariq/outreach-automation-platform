export interface Contact {
  id: string
  email: string
  full_name: string | null
  country: string | null
  contact_type: string
  status: string
  total_emails_sent: number
  property_count: number
  created_at: string
}

export interface ContactDetail extends Contact {
  mobile1: string | null
  mobile2: string | null
  mobile3: string | null
  language: string
  total_replies: number
  last_contacted_at: string | null
  last_replied_at: string | null
  properties: Property[]
}

export interface Property {
  id: string
  location: string
  project_name: string | null
  building_name: string | null
  unit_number: string | null
  rooms: number | null
  size_sqft: string | null
  transaction_value: string | null
  currency: string
}

export interface ImportBatch {
  id: string
  filename: string
  status: string
  total_rows: number
  contacts_created: number
  contacts_updated: number
  properties_created: number
  rows_skipped: number
  rows_failed: number
  error_log: Array<Record<string, unknown>> | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export const useContacts = () => {
  const contacts = ref<Contact[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const fetchContacts = async (params: {
    page?: number
    page_size?: number
    search?: string
    country?: string
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params.page) query.set('page', String(params.page))
      if (params.page_size) query.set('page_size', String(params.page_size))
      if (params.search) query.set('search', params.search)
      if (params.country) query.set('country', params.country)

      const res = await $fetch<{ items: Contact[]; total: number; page: number; page_size: number }>(
        `${apiBase}/contacts?${query.toString()}`,
        { headers: authHeaders.value }
      )
      contacts.value = res.items
      total.value = res.total
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load contacts'
    }
    finally {
      loading.value = false
    }
  }

  const getContact = async (id: string): Promise<ContactDetail> => {
    return $fetch<ContactDetail>(`${apiBase}/contacts/${id}`, {
      headers: authHeaders.value,
    })
  }

  const uploadCSV = async (file: File): Promise<{ batch_id: string }> => {
    const body = new FormData()
    body.append('file', file)
    return $fetch<{ batch_id: string }>(`${apiBase}/imports`, {
      method: 'POST',
      headers: authHeaders.value,
      body,
    })
  }

  const getImport = async (batchId: string): Promise<ImportBatch> => {
    return $fetch<ImportBatch>(`${apiBase}/imports/${batchId}`, {
      headers: authHeaders.value,
    })
  }

  const listImports = async (): Promise<ImportBatch[]> => {
    return $fetch<ImportBatch[]>(`${apiBase}/imports`, {
      headers: authHeaders.value,
    })
  }

  return {
    contacts,
    total,
    loading,
    error,
    fetchContacts,
    getContact,
    uploadCSV,
    getImport,
    listImports,
  }
}
