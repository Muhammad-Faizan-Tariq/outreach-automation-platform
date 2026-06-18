export interface EmailAccountSummary {
  id: string
  email: string
  display_name: string
  domain: string
  status: 'active' | 'paused' | 'warming_up' | 'suspended' | 'auth_expired' | 'retired'
  daily_send_limit: number
  current_day_sent: number
  total_sent: number
  deliverability_score: number | null
  created_at: string
}

export interface EmailAccountDetail extends EmailAccountSummary {
  oauth_token_expires_at: string | null
  oauth_scopes: string[] | null
  gmail_watch_expires_at: string | null
  timezone: string
  send_window_start: string
  send_window_end: string
  send_days_of_week: number[]
  warmup_day: number
  warmup_started_at: string | null
  warmup_completed_at: string | null
  bounce_rate_7d: number | null
  reply_rate_7d: number | null
  total_bounced: number
  total_replied: number
  notes: string | null
  updated_at: string
}

export interface EmailAccountListResponse {
  items: EmailAccountSummary[]
  total: number
  page: number
  page_size: number
}

export const useInboxes = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const inboxes = ref<EmailAccountSummary[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const listInboxes = async (params: {
    status?: string
    domain?: string
    search?: string
    page?: number
    page_size?: number
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params.status) query.set('status', params.status)
      if (params.domain) query.set('domain', params.domain)
      if (params.search) query.set('search', params.search)
      if (params.page) query.set('page', String(params.page))
      if (params.page_size) query.set('page_size', String(params.page_size))
      const qs = query.toString()
      const res = await $fetch<EmailAccountListResponse>(
        `${apiBase}/email-accounts${qs ? '?' + qs : ''}`,
        { headers: authHeaders.value },
      )
      inboxes.value = res.items
      total.value = res.total
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load inboxes'
    }
    finally {
      loading.value = false
    }
  }

  const getInbox = async (id: string): Promise<EmailAccountDetail> => {
    return $fetch<EmailAccountDetail>(`${apiBase}/email-accounts/${id}`, {
      headers: authHeaders.value,
    })
  }

  const updateInbox = async (id: string, data: {
    display_name?: string
    daily_send_limit?: number
    timezone?: string
    send_window_start?: string
    send_window_end?: string
    send_days_of_week?: number[]
    notes?: string
  }): Promise<EmailAccountDetail> => {
    return $fetch<EmailAccountDetail>(`${apiBase}/email-accounts/${id}`, {
      method: 'PATCH',
      headers: authHeaders.value,
      body: data,
    })
  }

  const pauseInbox = async (id: string): Promise<EmailAccountDetail> => {
    return $fetch<EmailAccountDetail>(`${apiBase}/email-accounts/${id}/pause`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const resumeInbox = async (id: string): Promise<EmailAccountDetail> => {
    return $fetch<EmailAccountDetail>(`${apiBase}/email-accounts/${id}/resume`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const retireInbox = async (id: string): Promise<EmailAccountDetail> => {
    return $fetch<EmailAccountDetail>(`${apiBase}/email-accounts/${id}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })
  }

  const watchInbox = async (id: string): Promise<EmailAccountDetail> => {
    return $fetch<EmailAccountDetail>(`${apiBase}/email-accounts/${id}/watch`, {
      method: 'POST',
      headers: authHeaders.value,
    })
  }

  const startGoogleOAuth = async (): Promise<string> => {
    const res = await $fetch<{ authorization_url: string }>(
      `${apiBase}/email-accounts/connect-google`,
      { method: 'POST', headers: authHeaders.value },
    )
    return res.authorization_url
  }

  return {
    inboxes,
    total,
    loading,
    error,
    listInboxes,
    getInbox,
    updateInbox,
    pauseInbox,
    resumeInbox,
    retireInbox,
    watchInbox,
    startGoogleOAuth,
  }
}
