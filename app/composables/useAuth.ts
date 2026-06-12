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
  const token = useCookie<string | null>('auth_token', { maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  const isLoggedIn = computed(() => !!token.value)
  const authHeaders = computed(() => ({
    Authorization: token.value ? `Bearer ${token.value}` : '',
  }))

  const login = async (email: string, password: string) => {
    const body = new URLSearchParams()
    body.set('username', email)
    body.set('password', password)
    const res = await $fetch<{ access_token: string; token_type: string }>(
      `${apiBase}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      },
    )
    token.value = res.access_token
    user.value = await $fetch<AuthUser>(`${apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${res.access_token}` },
    })
  }

  const fetchMe = async () => {
    if (!token.value) return
    user.value = await $fetch<AuthUser>(`${apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
  }

  const logout = () => {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  const init = async () => {
    if (token.value && !user.value) {
      try {
        await fetchMe()
      }
      catch {
        token.value = null
        user.value = null
      }
    }
  }

  return { user, token, isLoggedIn, authHeaders, login, logout, fetchMe, init }
}
