import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/client'
import { useToast } from '../components/ui/Toast'
import { ArrowRight } from 'lucide-react'

export function ForgotPasswordPage() {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devToken, setDevToken] = useState<string | null>(null)

  const ready = email.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setLoading(true)
    try {
      const { data } = await authApi.forgotPassword(email)
      setSent(true)
      // Backend surfaces the dev token in the message in local dev mode.
      const match = data.message.match(/\[dev\] reset token: (.+)$/)
      if (match) setDevToken(match[1])
      toast.success('Check your inbox', 'If that email exists, a reset link is on its way.')
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Could not send reset link'
      toast.error('Something went wrong', msg)
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

        <p className="eyebrow mb-4">— Reset password</p>
        <h1
          className="font-serif leading-[1.05] tracking-tightest text-[34px] md:text-[44px]"
          style={{ color: 'var(--ink-strong)' }}
        >
          Forgot your
          <br />
          <span className="font-serif-italic">password?</span>
        </h1>
        <p className="text-[14.5px] mt-5 mb-10 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          Enter your email and we'll send you a link to set a new one.
        </p>

        {sent ? (
          <div className="space-y-6">
            <div
              className="px-5 py-4 rounded-xl text-[13.5px] leading-relaxed"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
            >
              If an account exists for <strong>{email}</strong>, a reset link has been sent. The link expires in 60 minutes.
            </div>
            {devToken && (
              <div
                className="px-5 py-4 rounded-xl text-[12px] font-mono break-all"
                style={{ background: '#fff7e6', border: '1px solid #f0c060', color: '#7a4a00' }}
              >
                <p className="text-[11px] mb-1.5" style={{ fontFamily: 'inherit' }}>
                  Dev mode — reset link:
                </p>
                <Link to={`/reset-password?token=${encodeURIComponent(devToken)}`} className="underline">
                  /reset-password?token={devToken}
                </Link>
              </div>
            )}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[13px] font-semibold underline-offset-4 hover:underline"
              style={{ color: 'var(--ink-strong)' }}
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block eyebrow mb-2" style={{ color: 'var(--ink-strong)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
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
              {loading ? 'Sending…' : 'Send reset link'}
              {!loading && <ArrowRight size={14} />}
            </button>

            <p className="text-center text-[13px] mt-8" style={{ color: 'var(--ink-soft)' }}>
              Remembered it?{' '}
              <Link
                to="/login"
                className="font-semibold underline-offset-4 hover:underline"
                style={{ color: 'var(--ink-strong)' }}
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
