export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
  permissions: string[]
  is_active: boolean
  last_login_at: string | null
}

const MOCK_USER: AuthUser = {
  id: 'u1',
  email: 'mfaizantariq99@gmail.com',
  full_name: 'Muhammad Fizan',
  role: 'admin',
  permissions: ['*'],
  is_active: true,
  last_login_at: new Date().toISOString(),
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth.user', () => null)
  const token = useCookie<string | null>('auth_token', { maxAge: 60 * 60 * 24, sameSite: 'lax' })

  const isLoggedIn = computed(() => !!token.value)
  const authHeaders = computed(() => ({ Authorization: `Bearer ${token.value ?? 'mock-token'}` }))

  const login = async (_email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 500))
    token.value = 'mock-session-token'
    user.value = { ...MOCK_USER, last_login_at: new Date().toISOString() }
  }

  const logout = () => {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  const fetchMe = async () => {
    user.value = MOCK_USER
  }

  const init = async () => {
    if (token.value && !user.value) {
      user.value = MOCK_USER
    }
    else if (!token.value) {
      token.value = 'mock-session-token'
      user.value = MOCK_USER
    }
  }

  return { user, token, isLoggedIn, authHeaders, login, logout, fetchMe, init }
}
