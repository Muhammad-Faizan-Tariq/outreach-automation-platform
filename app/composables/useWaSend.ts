export interface WASendMessageRequest {
  wa_phone_number_id: string
  to: string
  template_id: string
  body_variables?: string[]
  button_variables?: string[]
  header_media_id?: string
  location?: {
    latitude: string
    longitude: string
    name: string
    address: string
  }
}

export interface WASendMessageResponse {
  wamid: string
  to: string
}

export const useWaSend = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const sending = ref(false)
  const error = ref<string | null>(null)

  const sendMessage = async (params: WASendMessageRequest): Promise<WASendMessageResponse> => {
    sending.value = true
    error.value = null
    try {
      return await $fetch<WASendMessageResponse>(`${apiBase}/wa/messages`, {
        method: 'POST',
        headers: authHeaders.value,
        body: params,
      })
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to send message'
      throw e
    }
    finally {
      sending.value = false
    }
  }

  return { sendMessage, sending, error }
}
