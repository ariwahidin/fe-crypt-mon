'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Plus, TrendingUp, TrendingDown, Trash2,
  ToggleLeft, ToggleRight, Clock, BellOff, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'
import BottomNav from '@/components/BottomNav'
import { alertsApi, getStoredUser, formatUSD, type Alert } from '@/lib/api'

export default function AlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    if (!getStoredUser()) { router.replace('/login'); return }
    fetchAlerts()
  }, [router])

  const fetchAlerts = async () => {
    try {
      const res = await alertsApi.getAll()
      setAlerts(res.data.data || [])
    } catch {
      toast.error('Gagal memuat alert')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (alert: Alert) => {
    setTogglingId(alert.id)
    try {
      await alertsApi.toggle(alert.id, !alert.is_active)
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_active: !a.is_active } : a))
    } catch {
      toast.error('Gagal mengubah status alert')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus alert ini?')) return
    setDeletingId(id)
    try {
      await alertsApi.delete(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
      toast.success('Alert dihapus')
    } catch {
      toast.error('Gagal menghapus alert')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Alert</h1>
          <p className="text-sm text-slate-400">{alerts.length} alert dikonfigurasi</p>
        </div>
        <Link href="/alerts/new" className="btn-primary py-2.5 px-4 text-sm">
          <Plus className="w-4 h-4" /> Baru
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 h-24 animate-pulse bg-slate-800" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="card p-10 flex flex-col items-center text-center mt-8">
          <BellOff className="w-12 h-12 text-slate-600 mb-4" />
          <p className="font-medium text-slate-300 mb-2">Belum ada alert</p>
          <p className="text-sm text-slate-500 mb-6">Buat alert pertamamu untuk mulai memonitor harga BTC</p>
          <Link href="/alerts/new" className="btn-primary px-8">
            <Plus className="w-4 h-4" /> Buat Alert
          </Link>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {alerts.map(alert => (
            <div key={alert.id} className={clsx(
              'card p-4 transition-all duration-200',
              !alert.is_active && 'opacity-60'
            )}>
              {/* Top row */}
              <div className="flex items-start gap-3 mb-3">
                <div className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                  alert.condition === 'ABOVE'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                )}>
                  {alert.condition === 'ABOVE'
                    ? <TrendingUp className="w-4 h-4" />
                    : <TrendingDown className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-white truncate">{alert.name}</p>
                    {alert.is_active
                      ? <span className="badge-active">Aktif</span>
                      : <span className="badge-inactive">Nonaktif</span>}
                  </div>
                  <p className="text-sm text-slate-400">
                    Kirim notif jika BTC{' '}
                    <span className={clsx(
                      'font-medium',
                      alert.condition === 'ABOVE' ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {alert.condition === 'ABOVE' ? 'naik di atas' : 'turun di bawah'}
                    </span>{' '}
                    <span className="text-white font-medium mono">{formatUSD(alert.threshold_price)}</span>
                  </p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Cek tiap {alert.interval_minutes}m
                </span>
                <span>•</span>
                <span>Cooldown {alert.cooldown_minutes}m</span>
                {alert.last_triggered_at && (
                  <>
                    <span>•</span>
                    <span>Terakhir: {new Date(alert.last_triggered_at).toLocaleDateString('id-ID')}</span>
                  </>
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
                <button
                  onClick={() => handleToggle(alert)}
                  disabled={togglingId === alert.id}
                  className={clsx(
                    'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                    alert.is_active
                      ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'text-slate-400 bg-slate-700/50 hover:bg-slate-700'
                  )}>
                  {alert.is_active
                    ? <><ToggleRight className="w-3.5 h-3.5" /> Nonaktifkan</>
                    : <><ToggleLeft className="w-3.5 h-3.5" /> Aktifkan</>}
                </button>

                <Link
                  href={`/alerts/${alert.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-slate-400 bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  Riwayat <ChevronRight className="w-3 h-3" />
                </Link>

                <button
                  onClick={() => handleDelete(alert.id)}
                  disabled={deletingId === alert.id}
                  className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                  {deletingId === alert.id
                    ? <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
