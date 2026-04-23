import type { AuthResponse } from '../features/auth/types/authTypes'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

export const authStore = {
  setSession(auth: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, auth.tokens.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.tokens.refresh_token)
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
  },

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
}
