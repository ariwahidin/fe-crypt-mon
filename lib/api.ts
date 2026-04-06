import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('btc_alert_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('btc_alert_token')
      localStorage.removeItem('btc_alert_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/profile'),
  updateProfile: (telegram_chat_id: string) =>
    api.put('/profile', { telegram_chat_id }),
  testTelegram: () => api.post('/profile/test-telegram'),
}

// ─── Price ────────────────────────────────────────────────────────────────────
export const priceApi = {
  getBTCPrice: () => api.get('/price'),
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertsApi = {
  getAll: () => api.get('/alerts'),
  create: (data: CreateAlertPayload) => api.post('/alerts', data),
  update: (id: number, data: UpdateAlertPayload) => api.put(`/alerts/${id}`, data),
  delete: (id: number) => api.delete(`/alerts/${id}`),
  toggle: (id: number, is_active: boolean) =>
    api.patch(`/alerts/${id}/toggle`, { is_active }),
  getLogs: (id: number) => api.get(`/alerts/${id}/logs`),
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  email: string
  telegram_chat_id: string
  created_at: string
}

export interface Alert {
  id: number
  user_id: number
  name: string
  condition: 'ABOVE' | 'BELOW'
  threshold_price: number
  interval_minutes: number
  is_active: boolean
  cooldown_minutes: number
  cooldown_until: string | null
  last_triggered_at: string | null
  created_at: string
}

export interface AlertLog {
  id: number
  alert_id: number
  price_at_trigger: number
  message: string
  sent_at: string
}

export interface BTCPrice {
  price: number
  change_24h: number
  fetched_at: string
}

export interface CreateAlertPayload {
  name: string
  condition: 'ABOVE' | 'BELOW'
  threshold_price: number
  interval_minutes: number
  cooldown_minutes: number
}

export interface UpdateAlertPayload extends CreateAlertPayload {
  is_active: boolean
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null
  const s = localStorage.getItem('btc_alert_user')
  return s ? JSON.parse(s) : null
}

export const setStoredAuth = (token: string, user: User) => {
  localStorage.setItem('btc_alert_token', token)
  localStorage.setItem('btc_alert_user', JSON.stringify(user))
}

export const clearStoredAuth = () => {
  localStorage.removeItem('btc_alert_token')
  localStorage.removeItem('btc_alert_user')
}

export const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const formatUSDFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
