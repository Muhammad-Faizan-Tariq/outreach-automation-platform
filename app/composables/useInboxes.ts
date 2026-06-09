export interface Inbox {
  id: string
  email: string
  display_name: string
  domain: string
  status: string
  deliverability_score: number | null
  daily_send_limit: number
  current_day_sent: number
  created_at: string
}

export const useInboxes = () => {
  const inboxes = ref<Inbox[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const token = useCookie<string | null>('auth_token')

  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value ?? ''}`,
  }))

  const fetchInboxes = async () => {
    loading.value = true
    error.value = null
    try {
      inboxes.value = await $fetch<Inbox[]>(`${apiBase}/inboxes/`, {
        headers: authHeaders.value,
      })
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load inboxes'
    }
    finally {
      loading.value = false
    }
  }

  const getConnectUrl = async (): Promise<string> => {
    const res = await $fetch<{ auth_url: string }>(`${apiBase}/inboxes/connect/google`, {
      headers: authHeaders.value,
    })
    return res.auth_url
  }

  const connectInbox = async () => {
    try {
      const authUrl = await getConnectUrl()
      window.location.href = authUrl
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to initiate connection'
    }
  }

  return { inboxes, loading, error, fetchInboxes, getConnectUrl, connectInbox }
}
