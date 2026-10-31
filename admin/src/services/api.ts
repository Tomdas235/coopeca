import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

let currentToken: string | null = null

export function setToken(token: string | null): void {
  currentToken = token
}

export function getToken(): string | null {
  return currentToken
}

api.interceptors.request.use(
  (config: any) => {
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    const isLoginRequest = String(error.config?.url ?? '').includes('/auth/sessions')
    if (error.response?.status === 401 && !isLoginRequest) {
      currentToken = null
      if (typeof window !== 'undefined') {
        const loginPath = `${import.meta.env.BASE_URL}login`
        if (window.location.pathname !== loginPath) {
          window.location.href = loginPath
        }
      }
    }
    return Promise.reject(error)
  }
)

export function apiErrorToMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as any
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
    if (axiosError.response?.data?.code) {
      return axiosError.response.data.code
    }
    return axiosError.message || 'Erreur inconnue'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Erreur inconnue'
}

export { api }