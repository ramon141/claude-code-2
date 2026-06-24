import { AxiosError } from 'axios'

type ApiErrorData = {
  error?: { message?: string }
  message?: string
}

export type ApiError = AxiosError<ApiErrorData>

const FALLBACK = 'Ocorreu um erro inesperado'

export function extractErrorMessage(error: ApiError): string {
  const data = error.response?.data
  return data?.error?.message ?? data?.message ?? error.message ?? FALLBACK
}
