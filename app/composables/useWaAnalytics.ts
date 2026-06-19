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

  const fetchAnalytics = async () => {
    loading.value = true
    error.value = null
    try {
      const [sum, campaigns] = await Promise.all([
        $fetch<WAAnalyticsSummary>(`${apiBase}/wa/analytics`, { headers: authHeaders.value }),
        $fetch<WACampaignAnalytics[]>(`${apiBase}/wa/analytics/campaigns`, { headers: authHeaders.value }),
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

  const fetchWallet = async () => {
    try {
      const res = await $fetch<{ wallet_balance: number }>(`${apiBase}/wa/wallet/balance`, {
        headers: authHeaders.value,
      })
      walletBalance.value = res.wallet_balance
    }
    catch {
      walletBalance.value = null
    }
  }

  const fetchChannels = async () => {
    try {
      const res = await $fetch<any[]>(`${apiBase}/wa/channels`, { headers: authHeaders.value })
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
