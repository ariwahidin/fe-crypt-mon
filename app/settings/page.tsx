'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Send, Save, LogOut, User as UserIcon, Shield, ExternalLink,
  MessageSquare, ChevronRight
} from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { authApi, getStoredUser, clearStoredAuth, type User } from '@/lib/api'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [chatId, setChatId] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const u = getStoredUser()
    if (!u) { router.replace('/login'); return }
    setUser(u)
    setChatId(u.telegram_chat_id || '')
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authApi.updateProfile(chatId)
      const updated = res.data.data
      localStorage.setItem('btc_alert_user', JSON.stringify(updated))
      setUser(updated)
      toast.success('Profil berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  const handleTestTelegram = async () => {
    if (!chatId) return toast.error('Masukkan Telegram Chat ID terlebih dahulu')
    setTesting(true)
    try {
      await handleSave()
      await authApi.testTelegram()
      toast.success('Pesan test berhasil dikirim! Cek Telegram kamu.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal kirim test message')
    } finally {
      setTesting(false)
    }
  }

  const handleLogout = () => {
    clearStoredAuth()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Pengaturan</h1>
        <p className="text-sm text-slate-400">Kelola akun dan notifikasi</p>
      </div>

      {/* Account info */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-white">{user?.email}</p>
            <p className="text-xs text-slate-500">
              Bergabung {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Telegram Setup */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-white">Telegram Bot</h2>
        </div>

        {/* Step guide */}
        <div className="bg-slate-700/30 rounded-xl p-3 mb-4 space-y-2">
          <p className="text-xs font-medium text-slate-300 mb-2">Cara mendapatkan Chat ID:</p>
          {[
            'Buka Telegram, cari @BotFather',
            'Buat bot baru → salin Bot Token ke .env backend',
            'Start bot kamu, lalu buka @userinfobot',
            'Salin "Your user ID" (angka) ke kolom di bawah',
          ].map((step, i) => (
            <div key={i} className="flex gap-2 text-xs text-slate-400">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 font-medium">
                {i + 1}
              </span>
              {step}
            </div>
          ))}
          <a
            href="https://t.me/userinfobot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 mt-1">
            Buka @userinfobot <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="mb-4">
          <label className="label">Telegram Chat ID</label>
          <input
            className="input mono"
            placeholder="Contoh: 123456789"
            value={chatId}
            onChange={e => setChatId(e.target.value)}
            type="tel"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="btn-secondary flex-1 py-2.5 text-sm">
            {saving
              ? <span className="w-4 h-4 border border-slate-400 border-t-transparent rounded-full animate-spin" />
              : <><Save className="w-3.5 h-3.5" /> Simpan</>}
          </button>
          <button onClick={handleTestTelegram} disabled={testing || !chatId} className="btn-primary flex-1 py-2.5 text-sm">
            {testing
              ? <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              : <><Send className="w-3.5 h-3.5" /> Test Kirim</>}
          </button>
        </div>
      </div>

      {/* Security info */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-white">Keamanan</h2>
        </div>
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
            <span>Autentikasi</span>
            <span className="text-emerald-400 font-medium">JWT Token ✓</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
            <span>Password</span>
            <span className="text-emerald-400 font-medium">bcrypt ✓</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Data tersimpan di</span>
            <span className="text-slate-300 font-medium mono">SQLite (lokal)</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors">
        <span className="font-medium">Keluar dari akun</span>
        <LogOut className="w-4 h-4" />
      </button>

      <BottomNav />
    </div>
  )
}
