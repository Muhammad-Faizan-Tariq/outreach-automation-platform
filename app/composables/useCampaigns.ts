export interface Campaign {
  id: string
  name: string
  description: string | null
  campaign_type: 'owner_sell' | 'owner_rent_out'
  channel: string
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'archived'
  audience_filter: Record<string, unknown>
  estimated_audience_size: number | null
  actual_audience_size: number | null
  daily_volume_cap: number
  send_window_start: string
  send_window_end: string
  send_days_of_week: number[]
  timezone: string
  follow_up_delay_days: number[]
  max_follow_ups: number
  total_contacts: number
  total_sent: number
  total_delivered: number
  total_bounced: number
  total_opened: number
  total_replied: number
  total_unsubscribed: number
  priority: number
  starts_at: string | null
  ends_at: string | null
  started_at: string | null
  completed_at: string | null
  paused_at: string | null
  created_at: string
  updated_at: string
}

export interface CampaignTemplateStep {
  step_number: number
  template_id: string
  delay_days: number
}

export interface AudiencePreview {
  total_matching: number
  after_suppression: number
  after_cooldown: number
  eligible: number
  sample_contacts: Array<{ id: string; email: string; full_name: string | null }>
}

export interface CampaignCreate {
  name: string
  description?: string | null
  campaign_type: 'owner_sell' | 'owner_rent_out'
  channel?: string
  audience_filter: Record<string, unknown>
  templates: CampaignTemplateStep[]
  daily_volume_cap?: number
  send_window_start?: string
  send_window_end?: string
  send_days_of_week?: number[]
  timezone?: string
  follow_up_delay_days?: number[]
  max_follow_ups?: number
  starts_at?: string | null
  ends_at?: string | null
  priority?: number
}

export const useCampaigns = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const campaigns = ref<Campaign[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchCampaigns = async (params: {
    page?: number
    page_size?: number
    status?: string
    campaign_type?: string
    search?: string
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params.page) query.set('page', String(params.page))
      if (params.page_size) query.set('page_size', String(params.page_size))
      if (params.status) query.set('status', params.status)
      if (params.campaign_type) query.set('campaign_type', params.campaign_type)
      if (params.search) query.set('search', params.search)
      const qs = query.toString()
      const res = await $fetch<{ items: Campaign[]; total: number; page: number; page_size: number }>(
        `${apiBase}/campaigns${qs ? '?' + qs : ''}`,
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

  const getCampaign = async (id: string): Promise<Campaign> => {
    return $fetch<Campaign>(`${apiBase}/campaigns/${id}`, { headers: authHeaders.value })
  }

  const getCampaignTemplates = async (id: string): Promise<CampaignTemplateStep[]> => {
    return $fetch<CampaignTemplateStep[]>(`${apiBase}/campaigns/${id}/templates`, { headers: authHeaders.value })
  }

  const createCampaign = async (data: CampaignCreate): Promise<Campaign> => {
    return $fetch<Campaign>(`${apiBase}/campaigns`, {
      method: 'POST',
      headers: authHeaders.value,
      body: data,
    })
  }

  const updateCampaign = async (id: string, data: Partial<CampaignCreate>): Promise<Campaign> => {
    return $fetch<Campaign>(`${apiBase}/campaigns/${id}`, {
      method: 'PATCH',
      headers: authHeaders.value,
      body: data,
    })
  }

  const startCampaign = async (id: string): Promise<Campaign> => {
    return $fetch<Campaign>(`${apiBase}/campaigns/${id}/start`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const pauseCampaign = async (id: string): Promise<Campaign> => {
    return $fetch<Campaign>(`${apiBase}/campaigns/${id}/pause`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const completeCampaign = async (id: string): Promise<Campaign> => {
    return $fetch<Campaign>(`${apiBase}/campaigns/${id}/complete`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const archiveCampaign = async (id: string): Promise<Campaign> => {
    return $fetch<Campaign>(`${apiBase}/campaigns/${id}/archive`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const deleteCampaign = async (id: string): Promise<void> => {
    await $fetch(`${apiBase}/campaigns/${id}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })
  }

  const previewAudience = async (params: {
    campaign_type: string
    audience_filter: Record<string, unknown>
    apply_cooldown?: boolean
  }): Promise<AudiencePreview> => {
    return $fetch<AudiencePreview>(`${apiBase}/campaigns/preview-audience`, {
      method: 'POST',
      headers: authHeaders.value,
      body: params,
    })
  }

  return {
    campaigns,
    total,
    loading,
    error,
    fetchCampaigns,
    getCampaign,
    getCampaignTemplates,
    createCampaign,
    updateCampaign,
    startCampaign,
    pauseCampaign,
    completeCampaign,
    archiveCampaign,
    deleteCampaign,
    previewAudience,
  }
}
