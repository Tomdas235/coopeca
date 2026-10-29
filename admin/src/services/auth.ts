import { api, setToken, getToken } from './api'
import {
  LoginInput,
  AuthSession,
  UserProfile,
} from '../types/api'

const TOKEN_STORAGE_KEY = 'coopeca_admin_token'

export function saveToken(token: string): void {
  setToken(token)
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // sessionStorage may not be available in all environments
  }
}

export function loadToken(): string | null {
  const token = getToken()
  if (token) return token
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearToken(): void {
  setToken(null)
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const response = await api.post<AuthSession>('/auth/sessions', input)
  const session = response.data
  saveToken(session.accessToken)
  return session
}

export async function logout(): Promise<void> {
  clearToken()
}

export async function getProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/me')
  return response.data
}

export async function getBranches(): Promise<Array<{ id: string; code: string; name: string }>> {
  const response = await api.get<Array<{ id: string; code: string; name: string }>>('/me/branches')
  return response.data
}