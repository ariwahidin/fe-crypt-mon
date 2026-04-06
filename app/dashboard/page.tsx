'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  TrendingUp, TrendingDown, RefreshCw, Bell, BellOff,
  Plus, AlertTriangle, Bitcoin, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'
import BottomNav from '@/components/BottomNav'
import { priceApi, alertsApi, getStoredUser, formatUSD, type BTCPrice, type Alert, type User } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [price, setPrice] = useState<BTCPrice | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loadingPrice, setLoadingPrice] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const u = getStoredUser()
    if (!u) { router.replace('/login'); return }
    setUser(u)
    fetchPrice()
    fetchAlerts()
  }, [router])

  // Auto-refresh price every 60s
  useEffect(() => {
    const interval = setInterval(fetchPrice, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchPrice = useCallback(async () => {
    try {
      const res = await priceApi.getBTCPrice()
      setPrice(res.data.data)
    } catch {
      toast.error('Gagal fetch harga BTC')
    } finally {
      setLoadingPrice(false)
      setRefreshing(false)
    }
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await alertsApi.getAll()
      setAlerts(res.data.data || [])
    } catch {}
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchPrice()
  }

  const activeAlerts = alerts.filter(a => a.is_active)
  const isPositive = (price?.change_24h ?? 0) >= 0

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">Hei, {user?.email?.split('@')[0]} 👋</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Bitcoin className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* BTC Price Card */}
      <div className="card p-5 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

        <div className="flex items-start justify-between mb-1">
          <p className="text-sm font-medium text-slate-400">Bitcoin (BTC)</p>
          <button onClick={handleRefresh} disabled={refreshing}
            className="text-slate-500 hover:text-amber-500 transition-colors">
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
        </div>

        {loadingPrice ? (
          <div className="h-12 flex items-center">
            <div className="w-48 h-8 bg-slate-700 rounded-lg animate-pulse" />
          </div>
        ) : (
          <>
            <div className="mono text-4xl font-bold text-white mb-2">
              {formatUSD(price?.price ?? 0)}
            </div>
            <div className={clsx(
              'inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-2.5 py-1',
              isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
            )}>
              {isPositive
                ? <TrendingUp className="w-3.5 h-3.5" />
                : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}{price?.change_24h.toFixed(2)}% 24h
            </div>
          </>
        )}

        {price && (
          <p className="text-xs text-slate-600 mt-3">
            Update: {new Date(price.fetched_at).toLocaleTimeString('id-ID')}
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-400 font-medium">Alert Aktif</span>
          </div>
          <p className="text-2xl font-bold text-white mono">{activeAlerts.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">dari {alerts.length} total</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-400 font-medium">Telegram</span>
          </div>
          {user?.telegram_chat_id ? (
            <>
              <p className="text-sm font-semibold text-emerald-400">Terhubung ✓</p>
              <p className="text-xs text-slate-500 mono mt-0.5">{user.telegram_chat_id}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-red-400">Belum setup</p>
              <Link href="/settings" className="text-xs text-amber-500 mt-0.5 block hover:underline">
                Setup sekarang →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Active Alerts Preview */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">Alert Aktif</h2>
          <Link href="/alerts" className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1">
            Semua <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="card p-6 flex flex-col items-center text-center">
            <BellOff className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm mb-4">Belum ada alert aktif</p>
            <Link href="/alerts/new" className="btn-primary px-6 py-2.5 text-sm">
              <Plus className="w-4 h-4" /> Buat Alert
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlerts.slice(0, 3).map(alert => (
              <AlertCard key={alert.id} alert={alert} currentPrice={price?.price ?? 0} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function AlertCard({ alert, currentPrice }: { alert: Alert; currentPrice: number }) {
  const diff = currentPrice - alert.threshold_price
  const diffPct = Math.abs((diff / alert.threshold_price) * 100)
  const isAbove = alert.condition === 'ABOVE'
  const triggered = isAbove ? currentPrice >= alert.threshold_price : currentPrice <= alert.threshold_price

  return (
    <Link href="/alerts">
      <div className="card p-4 flex items-center gap-3 hover:border-slate-600 transition-colors cursor-pointer">
        <div className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
          isAbove ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        )}>
          {isAbove ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{alert.name}</p>
          <p className="text-xs text-slate-400">
            {isAbove ? 'Di atas' : 'Di bawah'} {formatUSD(alert.threshold_price)}
          </p>
        </div>
        <div className="text-right">
          <p className={clsx('text-xs font-medium mono', triggered ? 'text-amber-400' : 'text-slate-500')}>
            {diff >= 0 ? '+' : ''}{diffPct.toFixed(1)}%
          </p>
          {triggered && <span className="text-[10px] text-amber-400">● Terpicu</span>}
        </div>
      </div>
    </Link>
  )
}
