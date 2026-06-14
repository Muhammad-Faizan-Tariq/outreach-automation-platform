export interface TopCampaign {
  id: string
  name: string
  status: string
  total_sent: number
  total_replied: number
  reply_rate: number
}

export interface InboxHealth {
  healthy: number
  reduced: number
  critical: number
}

export interface AnalyticsSummary {
  total_contacts: number
  active_campaigns: number
  sent_today: number
  replies_today: number
  daily_send_capacity: number
  top_campaigns: TopCampaign[]
  inbox_health: InboxHealth
}

export interface AnalyticsMetrics {
  range: string
  labels: string[]
  sent: number[]
  delivered: number[]
  opened: number[]
  replied: number[]
  bounced: number[]
  open_rate: number[]
  reply_rate: number[]
  bounce_rate: number[]
}

export const useAnalytics = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const fetchSummary = (): Promise<AnalyticsSummary> => {
    return $fetch<AnalyticsSummary>(`${apiBase}/analytics/summary`, {
      headers: authHeaders.value,
    })
  }

  const fetchMetrics = (range: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsMetrics> => {
    return $fetch<AnalyticsMetrics>(`${apiBase}/analytics/metrics?range=${range}`, {
      headers: authHeaders.value,
    })
  }

  return { fetchSummary, fetchMetrics }
}
