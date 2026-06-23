export interface WATemplate {
  id: string
  wa_phone_number_id: string | null
  alots_template_id: string | null
  name: string
  language: string
  category: string
  header_format: string | null
  header_text: string | null
  header_media_url: string | null
  body_text: string
  footer_text: string | null
  buttons: Array<{ type: string; text?: string; url?: string; phone_number?: string }>
  components_json: any[]
  status: string
  rejection_reason: string | null
  created_by_id: string | null
  created_at: string
  updated_at: string
}

export interface WATemplateCreate {
  wa_phone_number_id: string
  name: string
  language: string
  category: string
  header_format?: string | null
  header_text?: string | null
  header_media_url?: string | null
  body_text: string
  footer_text?: string | null
  buttons?: Array<{ type: string; text?: string; url?: string }>
  components_json?: any[]
}

export const useWaTemplates = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const templates = ref<WATemplate[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchTemplates = async (params: {
    status?: string
    category?: string
    search?: string
    page?: number
    pageSize?: number
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const q = new URLSearchParams()
      if (params.status && params.status !== 'all') q.set('status', params.status)
      if (params.category && params.category !== 'all') q.set('category', params.category)
      if (params.search) q.set('search', params.search)
      if (params.page) q.set('page', String(params.page))
      if (params.pageSize) q.set('page_size', String(params.pageSize))
      const qs = q.toString()
      const res = await $fetch<{ items: WATemplate[]; total: number }>(
        `${apiBase}/wa/templates${qs ? '?' + qs : ''}`,
        { headers: authHeaders.value },
      )
      templates.value = res.items
      total.value = res.total
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load templates'
    }
    finally {
      loading.value = false
    }
  }

  const getTemplate = async (id: string): Promise<WATemplate> => {
    return $fetch<WATemplate>(`${apiBase}/wa/templates/${id}`, { headers: authHeaders.value })
  }

  const createTemplate = async (data: WATemplateCreate): Promise<WATemplate> => {
    return $fetch<WATemplate>(`${apiBase}/wa/templates`, {
      method: 'POST',
      headers: authHeaders.value,
      body: data,
    })
  }

  const updateTemplate = async (id: string, data: Partial<WATemplateCreate>): Promise<WATemplate> => {
    return $fetch<WATemplate>(`${apiBase}/wa/templates/${id}`, {
      method: 'PUT',
      headers: authHeaders.value,
      body: data,
    })
  }

  const deleteTemplate = async (id: string): Promise<void> => {
    await $fetch(`${apiBase}/wa/templates/${id}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })
  }

  const syncTemplate = async (id: string): Promise<WATemplate> => {
    return $fetch<WATemplate>(`${apiBase}/wa/templates/${id}/sync`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const syncAll = async (): Promise<{ synced: number; updated: number }> => {
    return $fetch(`${apiBase}/wa/templates/sync-all`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const importFromAlots = async (phoneNumberId: string): Promise<{ imported: number; skipped: number; failed: number; total_in_alots: number }> => {
    return $fetch(`${apiBase}/wa/templates/import-from-alots`, {
      method: 'POST',
      headers: authHeaders.value,
      body: { wa_phone_number_id: phoneNumberId },
    })
  }

  const importAllFromAlots = async (): Promise<{ imported: number; skipped: number; failed: number; phones_scanned: number }> => {
    return $fetch(`${apiBase}/wa/templates/import-all`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  return {
    templates,
    total,
    loading,
    error,
    fetchTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    syncTemplate,
    syncAll,
    importFromAlots,
    importAllFromAlots,
  }
}
