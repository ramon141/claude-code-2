// Resolução de endereço da API conforme o contexto de execução:
// - Desktop (Tauri, protocolo tauri:) e Vite dev (porta 5173) falam com a API
//   local em 127.0.0.1:3000.
// - Quando o próprio app é servido pela API (porta 3000 / túnel ngrok), usa o
//   mesmo origin (URL relativa), funcionando em qualquer host.

const LOCAL_API_ORIGIN = 'http://127.0.0.1:3000'
const TAURI_PROTOCOL = 'tauri:'
const VITE_DEV_PORT = '5173'
const AUTH_TOKEN_KEY = 'apiAuthToken'

export const AUTH_HEADER = 'Authorization'
export const BEARER_PREFIX = 'Bearer '

function isTauri(): boolean {
  return window.location.protocol === TAURI_PROTOCOL
}

function isViteDev(): boolean {
  return window.location.port === VITE_DEV_PORT
}

function servedByApi(): boolean {
  return !isTauri() && !isViteDev()
}

export function getApiBaseUrl(): string {
  return servedByApi() ? '' : LOCAL_API_ORIGIN
}

export function getWebSocketUrl(): string {
  const token = getAuthToken()
  const query = token ? `?token=${encodeURIComponent(token)}` : ''
  if (servedByApi()) {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProto}//${window.location.host}/ws${query}`
  }
  return `ws://127.0.0.1:3000/ws${query}`
}

export function getAuthToken(): string {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? ''
}

export function setAuthToken(token: string): void {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  else localStorage.removeItem(AUTH_TOKEN_KEY)
}
