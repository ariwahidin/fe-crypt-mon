'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, History, CheckCircle, XCircle } from 'lucide-react'
import { alertsApi, formatUSDFull, type AlertLog } from '@/lib/api'

export default function AlertLogsPage() {
  const router = useRouter()
  const params = useParams()
  const alertId = Number(params.id)
  const [logs, setLogs] = useState<AlertLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [alertId])

  const fetchLogs = async () => {
    try {
      const res = await alertsApi.getLogs(alertId)
      setLogs(res.data.data || [])
    } catch {
      toast.error('Gagal memuat riwayat')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-10 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Riwayat Alert</h1>
          <p className="text-sm text-slate-400">{logs.length} notifikasi terkirim</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="card p-10 flex flex-col items-center text-center">
          <History className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-slate-400">Belum ada riwayat notifikasi</p>
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in">
          {logs.map(log => {
            const sent = log.message.startsWith('[sent]')
            return (
              <div key={log.id} className="card p-4 flex items-start gap-3">
                <div className={`mt-0.5 ${sent ? 'text-emerald-400' : 'text-red-400'}`}>
                  {sent ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${sent ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sent ? 'Terkirim' : 'Gagal'}
                    </span>
                    <span className="text-xs text-slate-500 mono">
                      {formatUSDFull(log.price_at_trigger)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(log.sent_at).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
