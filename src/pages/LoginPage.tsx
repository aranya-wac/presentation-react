import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/ui/Toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const ready = email.trim().length > 0 && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setError('')
    setLoading(true)
    const toastId = toast.loading('Signing you in…', 'Verifying your credentials.')
    try {
      const { data: tokens } = await authApi.login(email, password)
      localStorage.setItem('access_token', tokens.access_token)
      const { data: user } = await authApi.me()
      storeLogin(tokens.access_token, tokens.refresh_token, user)
      const firstName = user.full_name?.split(' ')[0]
      toast.update(toastId, {
        variant: 'success',
        title: firstName ? `Welcome back, ${firstName}.` : 'Welcome back.',
        description: 'Taking you to your workspace.',
      })
      await new Promise((r) => setTimeout(r, 900))
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Login failed'
      setError(msg)
      toast.update(toastId, {
        variant: 'error',
        title: 'Could not sign in',
        description: msg,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: form panel ─────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-h-screen relative overflow-hidden"
        style={{ background: '#FEFDFB' }}
      >
        {/* Dot-grid texture — fades to edges */}
        <div
          className="absolute inset-0 pointer-events-none select-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%)',
          }}
        />

        <div className="relative z-10 flex flex-col min-h-screen px-8 py-8 lg:px-14 lg:py-10 xl:px-16">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--ink-strong)' }}
            >
              <span className="text-white text-[9px] font-bold tracking-tight">WAC</span>
            </div>
            <span
              className="font-serif text-[17px] tracking-tighter"
              style={{ color: 'var(--ink-strong)' }}
            >
              Deck Studio
            </span>
          </div>

          {/* Form — vertically centered */}
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-full max-w-[380px]">

              {/* Heading group */}
              <p className="eyebrow mb-5" style={{ color: 'var(--ink-muted)' }}>— Welcome back</p>
              <h1
                className="font-serif leading-[1.06] tracking-tightest mb-4"
                style={{ fontSize: 'clamp(34px, 4vw, 46px)', color: 'var(--ink-strong)' }}
              >
                Sign in to
                <br />
                <span className="font-serif-italic">your workspace.</span>
              </h1>
              <p
                className="text-[14px] leading-relaxed mb-9"
                style={{ color: 'var(--ink-soft)' }}
              >
                Continue your decks where you left off.
              </p>

              {/* Error */}
              {error && (
                <div
                  className="mb-6 px-4 py-3 rounded-xl text-[13px] flex items-start gap-2.5"
                  style={{
                    background: 'rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.09)',
                    color: 'var(--ink-strong)',
                  }}
                >
                  <span className="mt-px opacity-40 flex-shrink-0">!</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">

                {/* Email */}
                <div>
                  <label className="eyebrow block mb-2" style={{ color: 'var(--ink-muted)' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="w-full h-[52px] px-4 rounded-xl text-[14px] focus:outline-none transition-all duration-150"
                    style={{
                      background: emailFocused ? '#fff' : 'rgba(0,0,0,0.035)',
                      border: `1px solid ${emailFocused ? 'rgba(0,0,0,0.6)' : 'transparent'}`,
                      color: 'var(--ink-strong)',
                      boxShadow: emailFocused
                        ? '0 0 0 3px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.06)'
                        : 'none',
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="eyebrow" style={{ color: 'var(--ink-muted)' }}>
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[12px] font-medium transition-opacity hover:opacity-60"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full h-[52px] pl-4 pr-12 rounded-xl text-[14px] focus:outline-none transition-all duration-150"
                      style={{
                        background: passwordFocused ? '#fff' : 'rgba(0,0,0,0.035)',
                        border: `1px solid ${passwordFocused ? 'rgba(0,0,0,0.6)' : 'transparent'}`,
                        color: 'var(--ink-strong)',
                        boxShadow: passwordFocused
                          ? '0 0 0 3px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.06)'
                          : 'none',
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-50"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2.5">
                  <button
                    type="submit"
                    disabled={!ready || loading}
                    className="w-full h-[52px] rounded-xl text-[14px] font-semibold tracking-[-0.01em] flex items-center justify-center gap-2 transition-all duration-150"
                    style={{
                      background: ready && !loading ? 'var(--ink-strong)' : 'rgba(0,0,0,0.12)',
                      color: ready && !loading ? '#fff' : 'rgba(0,0,0,0.28)',
                      cursor: ready && !loading ? 'pointer' : 'not-allowed',
                    }}
                    onMouseEnter={(e) => {
                      if (!ready || loading) return
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.22)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {loading ? (
                      <span className="opacity-60">Signing in…</span>
                    ) : (
                      <>
                        Continue
                        <ArrowRight size={14} strokeWidth={2.2} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Register link */}
              <p
                className="text-center text-[13px] mt-8"
                style={{ color: 'var(--ink-soft)' }}
              >
                New here?{' '}
                <Link
                  to="/register"
                  className="font-semibold transition-opacity hover:opacity-60"
                  style={{ color: 'var(--ink-strong)' }}
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-[11.5px]" style={{ color: 'var(--ink-faint)' }}>
              © 2026 WAC Deck Studio
            </p>
            <div className="flex items-center gap-5">
              <a
                href="#"
                className="text-[11.5px] transition-opacity hover:opacity-60"
                style={{ color: 'var(--ink-faint)' }}
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-[11.5px] transition-opacity hover:opacity-60"
                style={{ color: 'var(--ink-faint)' }}
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: editorial showcase ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-[54%] relative overflow-hidden flex-col"
        style={{ background: '#070605' }}
      >
        {/* Layered ambient glows */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-180px', right: '-100px',
            width: '700px', height: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,252,245,0.08) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '560px', height: '560px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,248,228,0.04) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-160px', left: '-80px',
            width: '480px', height: '480px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(210,210,255,0.03) 0%, transparent 70%)',
          }}
        />

        {/* Top status badge */}
        <div className="relative z-10 px-12 pt-10">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(134,239,172,0.9)' }}
            />
            <p
              className="font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Premium presentations · Powered by AI
            </p>
          </div>
        </div>

        {/* Center — deck mockup */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-10 py-10">
          <div className="relative w-full max-w-[440px]">

            {/* Glow behind the cards */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                top: '20%', left: '10%', right: '10%',
                height: '60%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Back card */}
            <div
              className="absolute w-full rounded-2xl"
              style={{
                height: '240px',
                top: '16px',
                transform: 'rotate(2.2deg) scale(0.94)',
                transformOrigin: 'center bottom',
                background: 'rgba(255,255,255,0.022)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            />
            {/* Middle card */}
            <div
              className="absolute w-full rounded-2xl"
              style={{
                height: '240px',
                top: '8px',
                transform: 'rotate(1deg) scale(0.97)',
                transformOrigin: 'center bottom',
                background: 'rgba(255,255,255,0.038)',
                border: '1px solid rgba(255,255,255,0.075)',
              }}
            />

            {/* Front card — slide preview */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.065)',
                border: '1px solid rgba(255,255,255,0.13)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)',
              }}
            >
              {/* Window chrome */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.14)' }}
                      />
                    ))}
                  </div>
                  <div
                    className="h-2.5 w-24 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.09)' }}
                  />
                </div>
                <div
                  className="h-5 px-3 rounded-md flex items-center"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="h-1.5 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
                </div>
              </div>

              {/* Slide body */}
              <div className="p-6">
                {/* Eyebrow line */}
                <div className="h-2 w-16 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.18)' }} />
                {/* Title lines */}
                <div className="h-[14px] w-[73%] rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.28)' }} />
                <div className="h-[14px] w-[48%] rounded-full mb-7" style={{ background: 'rgba(255,255,255,0.18)' }} />

                {/* Content cards */}
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  {[
                    { hd: '68%', lines: ['100%', '85%', '60%'] },
                    { hd: '80%', lines: ['100%', '70%', '50%'] },
                    { hd: '56%', lines: ['100%', '65%'] },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-3"
                      style={{
                        background: 'rgba(255,255,255,0.038)',
                        border: '1px solid rgba(255,255,255,0.075)',
                      }}
                    >
                      <div
                        className="h-2 rounded-full mb-2.5"
                        style={{ width: card.hd, background: 'rgba(255,255,255,0.22)' }}
                      />
                      {card.lines.map((w, j) => (
                        <div
                          key={j}
                          className={`h-1.5 rounded-full ${j < card.lines.length - 1 ? 'mb-1.5' : ''}`}
                          style={{ width: w, background: 'rgba(255,255,255,0.09)' }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[5px] h-[5px] rounded-full"
                        style={{
                          background: i < 3 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)',
                        }}
                      />
                    ))}
                    <span
                      className="text-[10px] font-mono ml-1"
                      style={{ color: 'rgba(255,255,255,0.28)' }}
                    >
                      3 / 8
                    </span>
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(134,239,172,0.85)' }}
                    />
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.38)' }}
                    >
                      Generated in 9s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating pill caption */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-5 inline-flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap"
              style={{
                background: 'rgba(255,255,255,0.055)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.5)' }}
              />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                AI-generated deck
              </span>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="relative z-10 px-12 pb-8">
          <p
            className="font-serif tracking-tightest leading-[1.08]"
            style={{ fontSize: 'clamp(24px, 2.6vw, 34px)', color: '#fff' }}
          >
            "Designed for the
            <br />
            <span
              className="font-serif-italic"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              quiet professional."
            </span>
          </p>
        </div>

        {/* Feature grid */}
        <div className="relative z-10 px-12 pb-10">
          <div
            className="h-px mb-8"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          />
          <div className="grid grid-cols-3 gap-6">
            {[
              { n: '01', t: 'AI generation', d: 'Decks from a prompt.' },
              { n: '02', t: 'Premium templates', d: 'Hand-tuned by designers.' },
              { n: '03', t: 'Export ready', d: 'PPTX, PDF, HTML.' },
            ].map((f) => (
              <div key={f.n}>
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.18em] mb-2"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                >
                  {f.n}
                </p>
                <p
                  className="font-serif text-[15px] leading-tight tracking-tighter mb-1"
                  style={{ color: 'rgba(255,255,255,0.92)' }}
                >
                  {f.t}
                </p>
                <p
                  className="text-[11.5px] leading-snug"
                  style={{ color: 'rgba(255,255,255,0.38)' }}
                >
                  {f.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
