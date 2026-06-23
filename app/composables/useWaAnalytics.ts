export interface WAAnalyticsSummary {
  total_sent: number
  total_delivered: number
  total_read: number
  total_failed: number
  delivery_rate: number
  read_rate: number
}

export interface WACampaignAnalytics {
  id: string
  name: string
  status: string
  total_contacts: number
  total_sent: number
  total_delivered: number
  total_read: number
  total_failed: number
  delivery_rate: number
  read_rate: number
  started_at: string | null
}

export const useWaAnalytics = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const summary = ref<WAAnalyticsSummary | null>(null)
  const campaignStats = ref<WACampaignAnalytics[]>([])
  const walletBalance = ref<number | null>(null)
  const channels = ref<any[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchAnalytics = async (params: { account_id?: string } = {}) => {
    loading.value = true
    error.value = null
    try {
      const q = new URLSearchParams()
      if (params.account_id) q.set('account_id', params.account_id)
      const qs = q.toString() ? '?' + q.toString() : ''
      const [sum, campaigns] = await Promise.all([
        $fetch<WAAnalyticsSummary>(`${apiBase}/wa/analytics${qs}`, { headers: authHeaders.value }),
        $fetch<WACampaignAnalytics[]>(`${apiBase}/wa/analytics/campaigns${qs}`, { headers: authHeaders.value }),
      ])
      summary.value = sum
      campaignStats.value = campaigns
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load analytics'
    }
    finally {
      loading.value = false
    }
  }

  const fetchWallet = async (phoneNumberId?: string) => {
    if (!phoneNumberId) { walletBalance.value = null; return }
    try {
      const res = await $fetch<{ wallet_balance: number }>(
        `${apiBase}/wa/wallet/balance?phone_number_id=${phoneNumberId}`,
        { headers: authHeaders.value },
      )
      walletBalance.value = res.wallet_balance
    }
    catch {
      walletBalance.value = null
    }
  }

  const fetchChannels = async (phoneNumberId?: string) => {
    if (!phoneNumberId) { channels.value = []; return }
    try {
      const res = await $fetch<any[]>(
        `${apiBase}/wa/channels?phone_number_id=${phoneNumberId}`,
        { headers: authHeaders.value },
      )
      channels.value = Array.isArray(res) ? res : []
    }
    catch {
      channels.value = []
    }
  }

  return {
    summary,
    campaignStats,
    walletBalance,
    channels,
    loading,
    error,
    fetchAnalytics,
    fetchWallet,
    fetchChannels,
  }
}
