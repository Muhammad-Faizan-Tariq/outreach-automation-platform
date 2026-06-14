export interface QueueItem {
  campaign_contact_id: string
  contact_id: string
  contact_email: string
  campaign_id: string
  campaign_name: string
  current_step: number
  next_send_at: string
  status: 'pending' | 'overdue'
}

export interface QueueListResponse {
  items: QueueItem[]
  total: number
  page: number
  page_size: number
}

export interface WorkerInfo {
  name: string
  status: 'online' | 'offline'
  active_tasks: number
  queues: string[]
}

export interface QueuedTaskCounts {
  sending: number
  replies: number
  imports: number
  maintenance: number
}

export interface WorkersResponse {
  workers: WorkerInfo[]
  total_online: number
  queued_tasks: QueuedTaskCounts
}

export interface FailedJob {
  id: string
  contact_id: string
  contact_email: string
  campaign_id: string
  campaign_name: string
  step_number: number
  subject: string
  error_code: string | null
  error_message: string | null
  retry_count: number
  created_at: string
}

export interface FailedListResponse {
  items: FailedJob[]
  total: number
  page: number
  page_size: number
}

export const useQueue = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const fetchQueue = (params: {
    campaign_id?: string
    page?: number
    page_size?: number
  } = {}): Promise<QueueListResponse> => {
    const query = new URLSearchParams()
    if (params.campaign_id) query.set('campaign_id', params.campaign_id)
    if (params.page) query.set('page', String(params.page))
    if (params.page_size) query.set('page_size', String(params.page_size))
    const qs = query.toString()
    return $fetch<QueueListResponse>(`${apiBase}/queue${qs ? '?' + qs : ''}`, {
      headers: authHeaders.value,
    })
  }

  const fetchWorkers = (): Promise<WorkersResponse> => {
    return $fetch<WorkersResponse>(`${apiBase}/queue/workers`, {
      headers: authHeaders.value,
    })
  }

  const fetchFailed = (params: {
    campaign_id?: string
    page?: number
    page_size?: number
  } = {}): Promise<FailedListResponse> => {
    const query = new URLSearchParams()
    if (params.campaign_id) query.set('campaign_id', params.campaign_id)
    if (params.page) query.set('page', String(params.page))
    if (params.page_size) query.set('page_size', String(params.page_size))
    const qs = query.toString()
    return $fetch<FailedListResponse>(`${apiBase}/queue/failed${qs ? '?' + qs : ''}`, {
      headers: authHeaders.value,
    })
  }

  return { fetchQueue, fetchWorkers, fetchFailed }
}
