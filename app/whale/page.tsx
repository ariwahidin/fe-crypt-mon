'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Waves, RefreshCw, Settings2, ArrowUpRight, ArrowDownRight,
  ArrowLeftRight, Zap, DollarSign, Clock, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react'
import clsx from 'clsx'
import BottomNav from '@/components/BottomNav'
import {
  whaleApi, getStoredUser, formatUSD,
  type WhaleTransaction, type WhaleSetting
} from '@/lib/api'

// ─── TX Type config ───────────────────────────────────────────────────────────
const TX_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; signal: string }> = {
  unknown_to_exchange: {
    label: 'Ke Exchange',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    icon: <ArrowUpRight className="w-4 h-4" />,
    signal: 'Bearish',
  },
  exchange_to_unknown: {
    label: 'Dari Exchange',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: <ArrowDownRight className="w-4 h-4" />,
    signal: 'Bullish',
  },
  exchange_to_exchange: {
    label: 'Antar Exchange',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20',
    icon: <ArrowLeftRight className="w-4 h-4" />,
    signal: 'Netral',
  },
  miner_to_exchange: {
    label: 'Miner → Exchange',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    icon: <Zap className="w-4 h-4" />,
    signal: 'Jual Pressure',
  },
  miner_to_unknown: {
    label: 'Miner → Wallet',
    color: 'text-amber-300',
    bg: 'bg-amber-500/8 border-amber-500/15',
    icon: <Zap className="w-4 h-4" />,
    signal: 'Netral',
  },
  unknown_to_unknown: {
    label: 'Wallet ke Wallet',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20',
    icon: <ArrowLeftRight className="w-4 h-4" />,
    signal: 'Netral',
  },
}

const DEFAULT_TX_CONFIG = {
  label: 'Transaksi',
  color: 'text-slate-400',
  bg: 'bg-slate-500/10 border-slate-500/20',
  icon: <ArrowLeftRight className="w-4 h-4" />,
  signal: 'Netral',
}

function getTxConfig(type: string) {
  return TX_CONFIG[type] ?? DEFAULT_TX_CONFIG
}

function shortAddr(addr: string) {
  if (!addr) return '—'
  return addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({
  setting,
  onSave,
  saving,
}: {
  setting: WhaleSetting | null
  onSave: (data: { is_active: boolean; min_usd: number; cooldown_minutes: number }) => void
  saving: boolean
}) {
  const [open, setOpen] = useState(false)
  const [isActive, setIsActive] = useState(setting?.is_active ?? false)
  const [minUsd, setMinUsd] = useState(String(setting?.min_usd ?? 500000))
  const [cooldown, setCooldown] = useState(String(setting?.cooldown_minutes ?? 30))

  useEffect(() => {
    if (setting) {
      setIsActive(setting.is_active)
      setMinUsd(String(setting.min_usd))
      setCooldown(String(setting.cooldown_minutes))
    }
  }, [setting])

  const handleSave = () => {
    const minUsdNum = parseFloat(minUsd)
    const cooldownNum = parseInt(cooldown)
    if (isNaN(minUsdNum) || minUsdNum < 100000) {
      toast.error('Min. USD harus ≥ $100,000')
      return
    }
    if (isNaN(cooldownNum) || cooldownNum < 1) {
      toast.error('Cooldown harus ≥ 1 menit')
      return
    }
    onSave({ is_active: isActive, min_usd: minUsdNum, cooldown_minutes: cooldownNum })
  }

  return (
    <div className="card mb-4 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Settings2 className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-white">Pengaturan Whale Alert</span>
          {setting?.is_active ? (
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-medium">Aktif</span>
          ) : (
            <span className="text-[10px] bg-slate-700/60 text-slate-400 border border-slate-600/30 rounded-full px-2 py-0.5 font-medium">Nonaktif</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-700/50 pt-4 space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Notifikasi Whale</p>
              <p className="text-xs text-slate-500">Terima alert saat ada transaksi besar</p>
            </div>
            <button onClick={() => setIsActive(v => !v)} className="transition-colors">
              {isActive
                ? <ToggleRight className="w-9 h-9 text-amber-500" />
                : <ToggleLeft className="w-9 h-9 text-slate-600" />}
            </button>
          </div>

          {/* Min USD */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Minimum Nilai (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="number"
                value={minUsd}
                onChange={e => setMinUsd(e.target.value)}
                className="input-field w-full pl-9 mono"
                placeholder="500000"
                min="100000"
                step="100000"
              />
            </div>
            <p className="text-xs text-slate-600 mt-1">Min. $100,000 — sistem global filter $500K</p>
          </div>

          {/* Cooldown */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Cooldown (menit)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="number"
                value={cooldown}
                onChange={e => setCooldown(e.target.value)}
                className="input-field w-full pl-9 mono"
                placeholder="30"
                min="1"
              />
            </div>
            <p className="text-xs text-slate-600 mt-1">Jeda antar notifikasi whale</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full py-2.5 text-sm"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Transaction Card ─────────────────────────────────────────────────────────
function TxCard({ tx }: { tx: WhaleTransaction }) {
  const cfg = getTxConfig(tx.transaction_type)

  return (
    <div className={clsx('card p-4 border', cfg.bg)}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', cfg.color, 'bg-black/20')}>
            {cfg.icon}
          </div>
          <div>
            <p className={clsx('text-xs font-semibold', cfg.color)}>{cfg.label}</p>
            <p className="text-[10px] text-slate-500 mono">{timeAgo(tx.transaction_at)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-white mono">{tx.amount.toFixed(2)} BTC</p>
          <p className="text-xs text-slate-400 mono">{formatUSD(tx.amount_usd)}</p>
        </div>
      </div>

      {/* From → To */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-black/20 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Dari</p>
          <p className="text-xs font-medium text-white truncate">
            {tx.from_owner || shortAddr(tx.from_address)}
          </p>
          {tx.from_owner && (
            <p className="text-[10px] text-slate-500 mono truncate">{shortAddr(tx.from_address)}</p>
          )}
        </div>
        <div className="bg-black/20 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Ke</p>
          <p className="text-xs font-medium text-white truncate">
            {tx.to_owner || shortAddr(tx.to_address)}
          </p>
          {tx.to_owner && (
            <p className="text-[10px] text-slate-500 mono truncate">{shortAddr(tx.to_address)}</p>
          )}
        </div>
      </div>

      {/* Signal badge */}
      <div className="mt-2.5 flex justify-end">
        <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full border', cfg.color,
          cfg.bg.replace('bg-', 'border-').split(' ')[0],
        )}>
          {cfg.signal}
        </span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WhalePage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([])
  const [setting, setSetting] = useState<WhaleSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!getStoredUser()) { router.replace('/login'); return }
    fetchAll()
  }, [router])

  const fetchAll = useCallback(async () => {
    try {
      const [txRes, settingRes] = await Promise.all([
        whaleApi.getTransactions(),
        whaleApi.getSetting(),
      ])
      setTransactions(txRes.data.data || [])
      setSetting(settingRes.data.data || null)
    } catch {
      toast.error('Gagal memuat data whale')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAll()
  }

  const handleSaveSettings = async (data: { is_active: boolean; min_usd: number; cooldown_minutes: number }) => {
    setSaving(true)
    try {
      const res = await whaleApi.upsertSetting(data)
      setSetting(res.data.data)
      toast.success('Pengaturan disimpan')
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  // Stats
  const bearishCount = transactions.filter(t => t.transaction_type === 'unknown_to_exchange').length
  const bullishCount = transactions.filter(t => t.transaction_type === 'exchange_to_unknown').length
  const totalUSD = transactions.reduce((s, t) => s + t.amount_usd, 0)

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Whale Tracker</h1>
          <p className="text-sm text-slate-400">Transaksi BTC besar terdeteksi</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors"
        >
          <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Settings */}
      <SettingsPanel setting={setting} onSave={handleSaveSettings} saving={saving} />

      {/* Stats Row */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-white mono">{transactions.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Total TX</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-emerald-400 mono">{bullishCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Bullish</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-red-400 mono">{bearishCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Bearish</p>
          </div>
        </div>
      )}

      {/* Total volume */}
      {!loading && transactions.length > 0 && (
        <div className="card p-4 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Waves className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Volume Terdeteksi</p>
            <p className="text-base font-bold text-white mono">{formatUSD(totalUSD)}</p>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div>
        <h2 className="font-semibold text-white mb-3 text-sm">Transaksi Terbaru</h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg" />
                    <div className="space-y-1.5">
                      <div className="w-24 h-3 bg-slate-700 rounded" />
                      <div className="w-16 h-2.5 bg-slate-700 rounded" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <div className="w-20 h-3 bg-slate-700 rounded ml-auto" />
                    <div className="w-14 h-2.5 bg-slate-700 rounded ml-auto" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 bg-slate-700/50 rounded-lg" />
                  <div className="h-12 bg-slate-700/50 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="card p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/50 flex items-center justify-center mb-4">
              <Waves className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Belum ada transaksi</p>
            <p className="text-slate-600 text-xs">Sistem memantau mempool BTC setiap menit</p>
            {!setting?.is_active && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Aktifkan notifikasi di pengaturan
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <TxCard key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}