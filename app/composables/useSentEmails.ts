export interface SentEmailSummary {
  id: string
  campaign_id: string
  contact_id: string
  email_account_id: string
  step_number: number
  subject: string
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'skipped'
  scheduled_at: string
  sent_at: string | null
  gmail_message_id: string | null
  error_code: string | null
  created_at: string
}

export interface SentEmailDetail extends SentEmailSummary {
  body_html: string | null
  body_text: string | null
  gmail_thread_id: string | null
  error_message: string | null
  retry_count: number
  delivered_at: string | null
  bounced_at: string | null
  first_opened_at: string | null
  open_count: number
}

export interface SentEmailListResponse {
  items: SentEmailSummary[]
  total: number
  page: number
  page_size: number
}

export const useSentEmails = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const sentEmails = ref<SentEmailSummary[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchSentEmails = async (params: {
    campaign_id?: string
    contact_id?: string
    email_account_id?: string
    status?: string
    step_number?: number
    page?: number
    page_size?: number
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params.campaign_id) query.set('campaign_id', params.campaign_id)
      if (params.contact_id) query.set('contact_id', params.contact_id)
      if (params.email_account_id) query.set('email_account_id', params.email_account_id)
      if (params.status) query.set('status', params.status)
      if (params.step_number !== undefined) query.set('step_number', String(params.step_number))
      if (params.page) query.set('page', String(params.page))
      if (params.page_size) query.set('page_size', String(params.page_size))
      const qs = query.toString()
      const res = await $fetch<SentEmailListResponse>(
        `${apiBase}/sent-emails${qs ? '?' + qs : ''}`,
        { headers: authHeaders.value },
      )
      sentEmails.value = res.items
      total.value = res.total
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load sent emails'
    }
    finally {
      loading.value = false
    }
  }

  const getSentEmail = async (id: string): Promise<SentEmailDetail> => {
    return $fetch<SentEmailDetail>(`${apiBase}/sent-emails/${id}`, {
      headers: authHeaders.value,
    })
  }

  return {
    sentEmails,
    total,
    loading,
    error,
    fetchSentEmails,
    getSentEmail,
  }
}
