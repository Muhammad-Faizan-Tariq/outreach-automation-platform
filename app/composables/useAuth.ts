export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
  permissions: string[]
  is_active: boolean
  last_login_at: string | null
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth.user', () => null)
  const token = useCookie<string | null>('auth_token', {
    maxAge: 60 * 60,
    sameSite: 'lax',
  })

  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  const isLoggedIn = computed(() => !!token.value)

  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value ?? ''}`,
  }))

  const fetchMe = async () => {
    user.value = await $fetch<AuthUser>(`${apiBase}/auth/me`, {
      headers: authHeaders.value,
    })
  }

  // OAuth2 password flow — backend expects form-encoded username/password
  const login = async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password })
    const res = await $fetch<{ access_token: string }>(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    token.value = res.access_token
    await fetchMe()
  }

  const logout = () => {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  // Call on layout mount to rehydrate user from cookie
  const init = async () => {
    if (token.value && !user.value) {
      try {
        await fetchMe()
      }
      catch {
        token.value = null
      }
    }
  }

  return { user, token, isLoggedIn, authHeaders, login, logout, fetchMe, init }
}
