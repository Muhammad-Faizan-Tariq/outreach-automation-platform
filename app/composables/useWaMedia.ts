export interface WAMedia {
  id: string
  alots_media_id: string
  filename: string
  media_type: string
  mime_type: string
  file_size_bytes: number
  uploaded_by_id: string | null
  created_at: string
}

export const useWaMedia = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const mediaList = ref<WAMedia[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchMedia = async (params: {
    media_type?: string
    account_id?: string
    page?: number
    pageSize?: number
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const q = new URLSearchParams()
      if (params.media_type && params.media_type !== 'all') q.set('media_type', params.media_type)
      if (params.account_id) q.set('account_id', params.account_id)
      if (params.page) q.set('page', String(params.page))
      if (params.pageSize) q.set('page_size', String(params.pageSize))
      const qs = q.toString()
      const res = await $fetch<{ items: WAMedia[]; total: number }>(
        `${apiBase}/wa/media${qs ? '?' + qs : ''}`,
        { headers: authHeaders.value },
      )
      mediaList.value = res.items
      total.value = res.total
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load media'
    }
    finally {
      loading.value = false
    }
  }

  const uploadMedia = async (file: File): Promise<WAMedia> => {
    const formData = new FormData()
    formData.append('file', file)
    // Don't include Content-Type — browser sets it with multipart boundary
    const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders.value as Record<string, string>
    return $fetch<WAMedia>(`${apiBase}/wa/media/upload`, {
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    })
  }

  const deleteMedia = async (id: string): Promise<void> => {
    await $fetch(`${apiBase}/wa/media/${id}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return {
    mediaList,
    total,
    loading,
    error,
    fetchMedia,
    uploadMedia,
    deleteMedia,
    formatBytes,
  }
}
