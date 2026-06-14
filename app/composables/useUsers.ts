export interface UserSummary {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export interface UserListResponse {
  items: UserSummary[]
  total: number
  page: number
  page_size: number
}

export interface UserCreate {
  email: string
  full_name: string
  role: string
  password: string
}

export interface UserUpdate {
  full_name?: string
  role?: string
  is_active?: boolean
}

export const useUsers = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { authHeaders } = useAuth()

  const users = ref<UserSummary[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async (params: {
    search?: string
    role?: string
    is_active?: boolean
    page?: number
    page_size?: number
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params.search) query.set('search', params.search)
      if (params.role) query.set('role', params.role)
      if (params.is_active !== undefined) query.set('is_active', String(params.is_active))
      if (params.page) query.set('page', String(params.page))
      if (params.page_size) query.set('page_size', String(params.page_size))
      const qs = query.toString()
      const res = await $fetch<UserListResponse>(
        `${apiBase}/users${qs ? '?' + qs : ''}`,
        { headers: authHeaders.value },
      )
      users.value = res.items
      total.value = res.total
    }
    catch (e: any) {
      error.value = e?.data?.detail ?? 'Failed to load users'
    }
    finally {
      loading.value = false
    }
  }

  const createUser = (payload: UserCreate): Promise<UserSummary> => {
    return $fetch<UserSummary>(`${apiBase}/users`, {
      method: 'POST',
      headers: authHeaders.value,
      body: payload,
    })
  }

  const updateUser = (id: string, payload: UserUpdate): Promise<UserSummary> => {
    return $fetch<UserSummary>(`${apiBase}/users/${id}`, {
      method: 'PATCH',
      headers: authHeaders.value,
      body: payload,
    })
  }

  const deleteUser = (id: string): Promise<void> => {
    return $fetch(`${apiBase}/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    })
  }

  return { users, total, loading, error, fetchUsers, createUser, updateUser, deleteUser }
}
