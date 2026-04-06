'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Bitcoin, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authApi, setStoredAuth } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Isi semua field')
    if (password.length < 8) return toast.error('Password minimal 8 karakter')
    if (password !== confirm) return toast.error('Password tidak cocok')

    setLoading(true)
    try {
      const res = await authApi.register(email, password)
      const { token, user } = res.data.data
      setStoredAuth(token, user)
      toast.success('Akun berhasil dibuat!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
            <Bitcoin className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">BTC Alert</h1>
          <p className="text-slate-400 text-sm mt-1">Buat akun baru</p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Daftar</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" className="input pl-10" placeholder="kamu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPw ? 'text' : 'password'} className="input pl-10 pr-10"
                  placeholder="Min. 8 karakter" value={password}
                  onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="password" className="input pl-10" placeholder="Ulangi password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading
                ? <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                : <>Buat Akun <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-sm mt-4">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
