import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/client'
import { useToast } from '../components/ui/Toast'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validation = useMemo(() => {
    if (!token) return 'Reset link is missing or invalid.'
    if (password.length > 0 && password.length < 8) return 'Password must be at least 8 characters.'
    if (confirm.length > 0 && password !== confirm) return 'Passwords do not match.'
    return ''
  }, [token, password, confirm])

  const ready = !!token && password.length >= 8 && password === confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      toast.success('Password updated', 'You can now sign in with your new password.')
      await new Promise((r) => setTimeout(r, 600))
      navigate('/login')
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Could not reset password'
      setError(msg)
      toast.error('Reset failed', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--paper)' }}>
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-2.5 mb-12">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--ink-strong)' }}
          >
            <span className="text-white text-[10px] font-bold tracking-tight">WAC</span>
          </div>
          <span className="font-serif text-[18px] tracking-tighter" style={{ color: 'var(--ink-strong)' }}>
            Deck Studio
          </span>
        </div>

        <p className="eyebrow mb-4">— New password</p>
        <h1
          className="font-serif leading-[1.05] tracking-tightest text-[34px] md:text-[44px]"
          style={{ color: 'var(--ink-strong)' }}
        >
          Set a new
          <br />
          <span className="font-serif-italic">password.</span>
        </h1>
        <p className="text-[14.5px] mt-5 mb-10 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          Choose something at least 8 characters. You'll be signed in fresh on every device.
        </p>

        {(error || validation) && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-[13px]"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--line)',
              color: 'var(--accent)',
            }}
          >
            {error || validation}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block eyebrow mb-2" style={{ color: 'var(--ink-strong)' }}>
              New password
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-4 pr-12 rounded-xl text-[14px] focus:outline-none transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink-strong)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ink-strong)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--ink-muted)' }}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block eyebrow mb-2" style={{ color: 'var(--ink-strong)' }}>
              Confirm password
            </label>
            <input
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 px-4 rounded-xl text-[14px] focus:outline-none transition-colors"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink-strong)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ink-strong)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
            />
          </div>

          <button
            type="submit"
            disabled={!ready || loading}
            className="w-full h-12 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'var(--ink-strong)',
              color: '#fff',
              opacity: ready && !loading ? 1 : 0.45,
              cursor: ready && !loading ? 'pointer' : 'not-allowed',
              marginTop: 24,
            }}
          >
            {loading ? 'Updating…' : 'Update password'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <p className="text-center text-[13px] mt-8" style={{ color: 'var(--ink-soft)' }}>
          <Link
            to="/login"
            className="font-semibold underline-offset-4 hover:underline"
            style={{ color: 'var(--ink-strong)' }}
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
