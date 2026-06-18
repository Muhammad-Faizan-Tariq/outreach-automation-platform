export interface EmailTemplate {
  id: string
  name: string
  campaign_type: 'owner_sell' | 'owner_rent_out'
  step_number: number
  subject: string
  body_html?: string
  body_text?: string | null
  required_variables?: string[]
  is_active: boolean
  version: number
  parent_template_id?: string | null
  created_at: string
  updated_at: string
}

export interface TemplatePreview {
  subject: string
  body_html: string
  body_text: string
  missing_variables: string[]
}

export const useTemplates = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const templates = ref<EmailTemplate[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchTemplates = async (params: {
    campaign_type?: string
    step_number?: number
    is_active?: boolean
    page?: number
    page_size?: number
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params.campaign_type) query.set('campaign_type', params.campaign_type)
      if (params.step_number !== undefined) query.set('step_number', String(params.step_number))
      if (params.is_active !== undefined) query.set('is_active', String(params.is_active))
      if (params.page) query.set('page', String(params.page))
      if (params.page_size) query.set('page_size', String(params.page_size))
      const qs = query.toString()
      const res = await $fetch<EmailTemplate[]>(
        `${apiBase}/templates${qs ? '?' + qs : ''}`,
        { headers: authHeaders.value },
      )
      templates.value = Array.isArray(res) ? res : []
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load templates'
    }
    finally {
      loading.value = false
    }
  }

  const getTemplate = async (id: string): Promise<EmailTemplate> => {
    return $fetch<EmailTemplate>(`${apiBase}/templates/${id}`, { headers: authHeaders.value })
  }

  const getAllowedVariables = async (): Promise<string[]> => {
    return $fetch<string[]>(`${apiBase}/templates/allowed-variables`, { headers: authHeaders.value })
  }

  const createTemplate = async (data: {
    name: string
    campaign_type: string
    step_number: number
    subject: string
    body_html: string
    body_text?: string
  }): Promise<EmailTemplate> => {
    return $fetch<EmailTemplate>(`${apiBase}/templates`, {
      method: 'POST',
      headers: authHeaders.value,
      body: data,
    })
  }

  const updateTemplate = async (id: string, data: {
    name?: string
    subject?: string
    body_html?: string
    body_text?: string
  }): Promise<EmailTemplate> => {
    return $fetch<EmailTemplate>(`${apiBase}/templates/${id}`, {
      method: 'PATCH',
      headers: authHeaders.value,
      body: data,
    })
  }

  const deleteTemplate = async (id: string): Promise<void> => {
    await $fetch(`${apiBase}/templates/${id}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })
  }

  const previewTemplate = async (id: string, variables: Record<string, string>): Promise<TemplatePreview> => {
    return $fetch<TemplatePreview>(`${apiBase}/templates/${id}/preview`, {
      method: 'POST',
      headers: authHeaders.value,
      body: { variables },
    })
  }

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    getTemplate,
    getAllowedVariables,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewTemplate,
  }
}
