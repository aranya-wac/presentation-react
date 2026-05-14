import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/ui/Toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export function RegisterPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const toast = useToast()
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const ready =
    form.email.trim().length > 0 &&
    form.password.length >= 6 &&
    form.full_name.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setError('')
    setLoading(true)
    const toastId = toast.loading('Creating your account…', 'Setting up your workspace.')
    try {
      await authApi.register(form.email, form.password, form.full_name)
      const { data: tokens } = await authApi.login(form.email, form.password)
      localStorage.setItem('access_token', tokens.access_token)
      const { data: user } = await authApi.me()
      storeLogin(tokens.access_token, tokens.refresh_token, user)
      const firstName = user.full_name?.split(' ')[0]
      toast.update(toastId, {
        variant: 'success',
        title: firstName ? `Welcome, ${firstName}.` : 'Welcome.',
        description: 'Taking you to your workspace.',
      })
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Registration failed'
      setError(msg)
      toast.update(toastId, {
        variant: 'error',
        title: 'Could not create account',
        description: msg,
      })
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="min-h-screen flex justify-center" style={{ background: 'var(--paper)' }}>
      {/* Form */}
      <div
        className="flex-1 max-w-[640px] flex flex-col p-8 lg:p-14"
        style={{ background: 'var(--paper)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--ink-strong)' }}
          >
            <span className="text-white text-[10px] font-bold tracking-tight">WAC</span>
          </div>
          <span
            className="font-serif text-[18px] tracking-tighter"
            style={{ color: 'var(--ink-strong)' }}
          >
            Deck Studio
          </span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[420px]">
            <p className="eyebrow mb-4">— Sign up</p>
            <h1
              className="font-serif leading-[1.05] tracking-tightest text-[30px] md:text-[38px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              Create your account
            </h1>
            <p
              className="text-[14.5px] mt-4 mb-8 leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              No credit card required.
            </p>

            {error && (
              <div
                className="mb-6 px-4 py-3 rounded-xl text-[13px]"
                style={{
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--line)',
                  color: 'var(--accent)',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block eyebrow mb-2" style={{ color: 'var(--ink-strong)' }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={set('full_name')}
                  placeholder="Your name"
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

              <div>
                <label className="block eyebrow mb-2" style={{ color: 'var(--ink-strong)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
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

              <div>
                <label className="block eyebrow mb-2" style={{ color: 'var(--ink-strong)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="At least 6 characters"
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
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!ready || loading}
                className="w-full h-12 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: ready && !loading ? 'var(--ink-strong)' : 'rgba(10,9,7,0.15)',
                  color: '#fff',
                  cursor: ready && !loading ? 'pointer' : 'not-allowed',
                  marginTop: 24,
                }}
                onMouseEnter={(e) => {
                  if (ready && !loading) e.currentTarget.style.background = '#2A2620'
                }}
                onMouseLeave={(e) => {
                  if (ready && !loading) e.currentTarget.style.background = 'var(--ink-strong)'
                }}
              >
                {loading ? 'Creating account…' : 'Create account'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            <p
              className="text-center text-[13px] mt-7"
              style={{ color: 'var(--ink-soft)' }}
            >
              Already have one?{' '}
              <Link
                to="/login"
                className="font-semibold underline-offset-4 hover:underline"
                style={{ color: 'var(--ink-strong)' }}
              >
                Sign in
              </Link>
            </p>

            <p
              className="text-center text-[11.5px] mt-6"
              style={{ color: 'var(--ink-faint)' }}
            >
              By signing up, you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
