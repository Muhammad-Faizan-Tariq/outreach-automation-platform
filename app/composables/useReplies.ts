export interface ReplyListItem {
  id: string
  contact_id: string
  campaign_id: string | null
  email_account_id: string
  from_email: string
  from_name: string | null
  subject: string | null
  snippet: string | null
  classification: string
  classification_confidence: number | null
  assigned_agent_id: string | null
  handled_at: string | null
  received_at: string
  created_at: string
  contact_name: string | null
  campaign_name: string | null
  assigned_agent_name: string | null
}

export interface OriginalEmail {
  subject: string
  body_html: string | null
  body_text: string | null
  sent_at: string | null
}

export interface ReplyDetail extends ReplyListItem {
  body_text: string | null
  body_html: string | null
  agent_notes: string | null
  classified_at: string | null
  classification_reason: string | null
  original_email: OriginalEmail | null
}

export interface ReplyListResponse {
  items: ReplyListItem[]
  total: number
  page: number
  page_size: number
}

export const useReplies = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const replies = ref<ReplyListItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchReplies = async (params: {
    classification?: string
    campaign_id?: string
    assigned_agent_id?: string
    is_handled?: boolean
    search?: string
    page?: number
    page_size?: number
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params.classification) query.set('classification', params.classification)
      if (params.campaign_id) query.set('campaign_id', params.campaign_id)
      if (params.assigned_agent_id) query.set('assigned_agent_id', params.assigned_agent_id)
      if (params.is_handled !== undefined) query.set('is_handled', String(params.is_handled))
      if (params.search) query.set('search', params.search)
      if (params.page) query.set('page', String(params.page))
      if (params.page_size) query.set('page_size', String(params.page_size))
      const qs = query.toString()
      const res = await $fetch<ReplyListResponse>(
        `${apiBase}/replies${qs ? '?' + qs : ''}`,
        { headers: authHeaders.value },
      )
      replies.value = res.items
      total.value = res.total
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load replies'
    }
    finally {
      loading.value = false
    }
  }

  const getReply = (id: string): Promise<ReplyDetail> => {
    return $fetch<ReplyDetail>(`${apiBase}/replies/${id}`, {
      headers: authHeaders.value,
    })
  }

  const updateReply = (id: string, payload: {
    classification?: string
    assigned_agent_id?: string | null
    is_handled?: boolean
    agent_notes?: string
  }): Promise<ReplyDetail> => {
    return $fetch<ReplyDetail>(`${apiBase}/replies/${id}`, {
      method: 'PATCH',
      headers: authHeaders.value,
      body: payload,
    })
  }

  return { replies, total, loading, error, fetchReplies, getReply, updateReply }
}
