'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, TrendingUp, TrendingDown, Save } from 'lucide-react'
import clsx from 'clsx'
import { alertsApi } from '@/lib/api'

const INTERVAL_OPTIONS = [
  { label: '5 menit', value: 5 },
  { label: '15 menit', value: 15 },
  { label: '30 menit', value: 30 },
  { label: '1 jam', value: 60 },
  { label: '2 jam', value: 120 },
  { label: '4 jam', value: 240 },
  { label: '12 jam', value: 720 },
  { label: '24 jam', value: 1440 },
]

const COOLDOWN_OPTIONS = [
  { label: '30 menit', value: 30 },
  { label: '1 jam', value: 60 },
  { label: '2 jam', value: 120 },
  { label: '4 jam', value: 240 },
  { label: '12 jam', value: 720 },
  { label: '24 jam', value: 1440 },
]

export default function NewAlertPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    condition: 'ABOVE' as 'ABOVE' | 'BELOW',
    threshold_price: '',
    interval_minutes: 60,
    cooldown_minutes: 60,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return toast.error('Nama alert wajib diisi')
    const price = parseFloat(form.threshold_price)
    if (!price || price <= 0) return toast.error('Harga threshold tidak valid')

    setLoading(true)
    try {
      await alertsApi.create({
        name: form.name,
        condition: form.condition,
        threshold_price: price,
        interval_minutes: form.interval_minutes,
        cooldown_minutes: form.cooldown_minutes,
      })
      toast.success('Alert berhasil dibuat!')
      router.push('/alerts')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat alert')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-10 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Buat Alert Baru</h1>
          <p className="text-sm text-slate-400">Konfigurasi notifikasi harga BTC</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
        {/* Name */}
        <div className="card p-4">
          <label className="label">Nama Alert</label>
          <input className="input" placeholder="Contoh: BTC Tembus 100K"
            value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>

        {/* Condition */}
        <div className="card p-4">
          <label className="label">Kondisi</label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {(['ABOVE', 'BELOW'] as const).map(cond => (
              <button key={cond} type="button"
                onClick={() => setForm(p => ({ ...p, condition: cond }))}
                className={clsx(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                  form.condition === cond
                    ? cond === 'ABOVE'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-red-500 bg-red-500/10'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                )}>
                {cond === 'ABOVE'
                  ? <TrendingUp className={clsx('w-6 h-6', form.condition === 'ABOVE' ? 'text-emerald-400' : 'text-slate-500')} />
                  : <TrendingDown className={clsx('w-6 h-6', form.condition === 'BELOW' ? 'text-red-400' : 'text-slate-500')} />}
                <span className={clsx(
                  'text-sm font-medium',
                  form.condition === cond
                    ? cond === 'ABOVE' ? 'text-emerald-400' : 'text-red-400'
                    : 'text-slate-400'
                )}>
                  {cond === 'ABOVE' ? 'Naik di atas' : 'Turun di bawah'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Threshold */}
        <div className="card p-4">
          <label className="label">Harga Threshold (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium mono">$</span>
            <input type="number" className="input pl-8 mono" placeholder="85000"
              value={form.threshold_price}
              onChange={e => setForm(p => ({ ...p, threshold_price: e.target.value }))}
              min="1" step="100" />
          </div>
        </div>

        {/* Interval */}
        <div className="card p-4">
          <label className="label">Interval Pengecekan</label>
          <p className="text-xs text-slate-500 mb-3">Seberapa sering sistem cek kondisi alert</p>
          <div className="grid grid-cols-4 gap-2">
            {INTERVAL_OPTIONS.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setForm(p => ({ ...p, interval_minutes: opt.value }))}
                className={clsx(
                  'py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200 text-center',
                  form.interval_minutes === opt.value
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600'
                )}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cooldown */}
        <div className="card p-4">
          <label className="label">Cooldown Setelah Notif</label>
          <p className="text-xs text-slate-500 mb-3">Jeda waktu sebelum bisa kirim notif lagi (anti-spam)</p>
          <div className="grid grid-cols-3 gap-2">
            {COOLDOWN_OPTIONS.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setForm(p => ({ ...p, cooldown_minutes: opt.value }))}
                className={clsx(
                  'py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200 text-center',
                  form.cooldown_minutes === opt.value
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600'
                )}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm text-slate-300">
          <p className="font-medium text-amber-400 mb-1">📋 Ringkasan Alert</p>
          <p>
            Kirim notifikasi Telegram jika BTC{' '}
            <span className={form.condition === 'ABOVE' ? 'text-emerald-400' : 'text-red-400'}>
              {form.condition === 'ABOVE' ? 'naik di atas' : 'turun di bawah'}
            </span>{' '}
            <span className="font-medium text-white mono">${parseFloat(form.threshold_price || '0').toLocaleString()}</span>,
            dicek setiap <span className="text-white">{INTERVAL_OPTIONS.find(o => o.value === form.interval_minutes)?.label}</span>,
            dengan cooldown <span className="text-white">{COOLDOWN_OPTIONS.find(o => o.value === form.cooldown_minutes)?.label}</span>.
          </p>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading
            ? <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            : <><Save className="w-4 h-4" /> Simpan Alert</>}
        </button>
      </form>
    </div>
  )
}
