export interface WAInbound {
  id: string
  wa_message_id: string
  from_phone: string
  contact_id: string | null
  campaign_contact_id: string | null
  message_type: string
  body: string | null
  is_handled: boolean
  received_at: string
  created_at: string
}

export const useWaInbound = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const messages = ref<WAInbound[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchInbound = async (params: {
    is_handled?: boolean | null
    search?: string
    page?: number
    pageSize?: number
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const q = new URLSearchParams()
      if (params.is_handled !== null && params.is_handled !== undefined)
        q.set('is_handled', String(params.is_handled))
      if (params.search) q.set('search', params.search)
      if (params.page) q.set('page', String(params.page))
      if (params.pageSize) q.set('page_size', String(params.pageSize))
      const qs = q.toString()
      const res = await $fetch<{ items: WAInbound[]; total: number }>(
        `${apiBase}/wa/inbound${qs ? '?' + qs : ''}`,
        { headers: authHeaders.value },
      )
      messages.value = res.items
      total.value = res.total
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load messages'
    }
    finally {
      loading.value = false
    }
  }

  const markHandled = async (id: string, isHandled: boolean): Promise<WAInbound> => {
    return $fetch<WAInbound>(`${apiBase}/wa/inbound/${id}`, {
      method: 'PATCH',
      headers: authHeaders.value,
      body: { is_handled: isHandled },
    })
  }

  return {
    messages,
    total,
    loading,
    error,
    fetchInbound,
    markHandled,
  }
}
