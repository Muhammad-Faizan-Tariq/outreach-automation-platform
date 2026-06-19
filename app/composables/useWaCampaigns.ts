export interface WACampaign {
  id: string
  name: string
  description: string | null
  wa_template_id: string
  header_media_id: string | null
  body_variables: any[]
  button_variables: any[]
  location_json: any | null
  status: string
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  total_contacts: number
  total_sent: number
  total_delivered: number
  total_read: number
  total_failed: number
  created_by_id: string | null
  created_at: string
  updated_at: string
}

export interface WACampaignCreate {
  name: string
  description?: string
  wa_template_id: string
  header_media_id?: string
  body_variables?: any[]
  button_variables?: any[]
  scheduled_at?: string
}

export interface WACampaignContact {
  id: string
  campaign_id: string
  contact_id: string | null
  phone_number: string
  status: string
  alots_message_id: string | null
  error_code: string | null
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  created_at: string
}

export const useWaCampaigns = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const campaigns = ref<WACampaign[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchCampaigns = async (params: {
    status?: string
    search?: string
    page?: number
    pageSize?: number
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const q = new URLSearchParams()
      if (params.status && params.status !== 'all') q.set('status', params.status)
      if (params.search) q.set('search', params.search)
      if (params.page) q.set('page', String(params.page))
      if (params.pageSize) q.set('page_size', String(params.pageSize))
      const qs = q.toString()
      const res = await $fetch<{ items: WACampaign[]; total: number }>(
        `${apiBase}/wa/campaigns${qs ? '?' + qs : ''}`,
        { headers: authHeaders.value },
      )
      campaigns.value = res.items
      total.value = res.total
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load campaigns'
    }
    finally {
      loading.value = false
    }
  }

  const getCampaign = async (id: string): Promise<WACampaign> => {
    return $fetch<WACampaign>(`${apiBase}/wa/campaigns/${id}`, { headers: authHeaders.value })
  }

  const createCampaign = async (data: WACampaignCreate): Promise<WACampaign> => {
    return $fetch<WACampaign>(`${apiBase}/wa/campaigns`, {
      method: 'POST',
      headers: authHeaders.value,
      body: data,
    })
  }

  const deleteCampaign = async (id: string): Promise<void> => {
    await $fetch(`${apiBase}/wa/campaigns/${id}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })
  }

  const startCampaign = async (id: string): Promise<WACampaign> => {
    return $fetch<WACampaign>(`${apiBase}/wa/campaigns/${id}/start`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const pauseCampaign = async (id: string): Promise<WACampaign> => {
    return $fetch<WACampaign>(`${apiBase}/wa/campaigns/${id}/pause`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const addContacts = async (campaignId: string, contactIds: string[]): Promise<{ added: number }> => {
    return $fetch(`${apiBase}/wa/campaigns/${campaignId}/contacts`, {
      method: 'POST',
      headers: authHeaders.value,
      body: { contact_ids: contactIds },
    })
  }

  const getCampaignContacts = async (
    campaignId: string,
    params: { status?: string; page?: number; pageSize?: number } = {},
  ): Promise<{ items: WACampaignContact[]; total: number }> => {
    const q = new URLSearchParams()
    if (params.status && params.status !== 'all') q.set('status', params.status)
    if (params.page) q.set('page', String(params.page))
    if (params.pageSize) q.set('page_size', String(params.pageSize))
    const qs = q.toString()
    return $fetch(`${apiBase}/wa/campaigns/${campaignId}/contacts${qs ? '?' + qs : ''}`, {
      headers: authHeaders.value,
    })
  }

  return {
    campaigns,
    total,
    loading,
    error,
    fetchCampaigns,
    getCampaign,
    createCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign,
    addContacts,
    getCampaignContacts,
  }
}
