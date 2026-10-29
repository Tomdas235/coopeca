Property 'env' does not exist on type 'ImportMeta'.import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { ApiError } from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

const api: AxiosInstance = axios.create({
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
  (config: InternalAxiosRequestConfig) => {
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      currentToken = null
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function apiErrorToMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>
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