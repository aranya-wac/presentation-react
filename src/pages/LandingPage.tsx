import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Layers,
  Wand2,
  Presentation,
  Palette,
  Type,
  CheckCircle2,
  Star,
  PlayCircle,
  X,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   Dummy Slide Previews — small components used throughout the landing page
   to convey the "premium deck" feel without dragging real data through.
   ───────────────────────────────────────────────────────────────────────── */

function SlideFrame({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`relative aspect-[16/10] w-full rounded-2xl overflow-hidden ${className}`}
      style={{
        background: '#fff',
        border: '1px solid var(--line)',
        boxShadow:
          '0 1px 0 rgba(0,0,0,0.02), 0 24px 60px -28px rgba(0,0,0,0.18), 0 8px 20px -12px rgba(0,0,0,0.08)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SlideCover() {
  return (
    <SlideFrame style={{ background: '#0A0907' }}>
      <div className="absolute inset-0 p-7 flex flex-col justify-between text-white">
        <div className="flex items-center justify-between">
          <span
            className="text-[9px] tracking-[0.2em] uppercase font-medium"
            style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: '#BFBFBF' }}
          >
            Q4 · Board Update
          </span>
          <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
            <span className="text-[8px] font-bold tracking-tight">WAC</span>
          </div>
        </div>
        <div>
          <p
            className="text-[9px] tracking-[0.22em] uppercase mb-3"
            style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: '#888' }}
          >
            — Annual Report
          </p>
          <h3
            className="font-serif leading-[0.98] tracking-tightest"
            style={{ fontSize: 'clamp(20px, 2.6vw, 34px)' }}
          >
            Building a quieter
            <br />
            <span className="font-serif-italic">kind of growth.</span>
          </h3>
          <div className="mt-5 flex items-center gap-2">
            <div className="h-px w-8 bg-white/40" />
            <span className="text-[10px] text-white/60">Corporate Excellence · 24 slides</span>
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}

function SlideMetrics() {
  const stats = [
    { k: 'ARR', v: '$48.2M', d: '+34%' },
    { k: 'NRR', v: '127%', d: '+9pt' },
    { k: 'Margin', v: '71%', d: '+4pt' },
  ]
  return (
    <SlideFrame>
      <div className="absolute inset-0 p-6 flex flex-col">
        <p
          className="text-[9px] tracking-[0.22em] uppercase mb-1"
          style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
        >
          02 — Performance
        </p>
        <h4
          className="font-serif leading-[1.05] tracking-tightest mb-5"
          style={{ fontSize: 'clamp(14px, 1.6vw, 20px)', color: 'var(--ink-strong)' }}
        >
          A year measured in <span className="font-serif-italic">discipline.</span>
        </h4>
        <div className="grid grid-cols-3 gap-3 flex-1">
          {stats.map((s) => (
            <div
              key={s.k}
              className="rounded-xl p-3 flex flex-col justify-between"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
            >
              <span
                className="text-[8px] tracking-[0.2em] uppercase"
                style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
              >
                {s.k}
              </span>
              <div>
                <div
                  className="font-serif leading-none tracking-tightest"
                  style={{ fontSize: 'clamp(15px, 1.8vw, 22px)', color: 'var(--ink-strong)' }}
                >
                  {s.v}
                </div>
                <div className="text-[9px] mt-1" style={{ color: 'var(--ink-soft)' }}>
                  {s.d} YoY
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Sparkline */}
        <svg viewBox="0 0 200 36" className="w-full mt-3" preserveAspectRatio="none">
          <path
            d="M0,28 L20,24 L40,26 L60,18 L80,20 L100,12 L120,14 L140,8 L160,10 L180,4 L200,6"
            fill="none"
            stroke="#0A0907"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M0,28 L20,24 L40,26 L60,18 L80,20 L100,12 L120,14 L140,8 L160,10 L180,4 L200,6 L200,36 L0,36 Z"
            fill="rgba(10,9,7,0.06)"
          />
        </svg>
      </div>
    </SlideFrame>
  )
}

function SlideQuote() {
  return (
    <SlideFrame>
      <div className="absolute inset-0 p-7 flex flex-col justify-between">
        <p
          className="text-[9px] tracking-[0.22em] uppercase"
          style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
        >
          07 — A note from the CEO
        </p>
        <div>
          <span
            className="font-serif-italic block leading-[1.05] tracking-tightest"
            style={{ fontSize: 'clamp(18px, 2.4vw, 30px)', color: 'var(--ink-strong)' }}
          >
            “We chose patience over performance —
            <br />
            and the numbers followed.”
          </span>
          <div className="mt-5 flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full"
              style={{ background: 'linear-gradient(135deg, #2A2620, #0A0907)' }}
            />
            <div>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--ink-strong)' }}>
                Mira Castellan
              </div>
              <div className="text-[9.5px]" style={{ color: 'var(--ink-soft)' }}>
                Chief Executive
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}

function SlideAgenda() {
  const items = ['The year in numbers', 'Product & platform', 'People & culture', 'What comes next']
  return (
    <SlideFrame>
      <div className="absolute inset-0 p-6 flex flex-col">
        <p
          className="text-[9px] tracking-[0.22em] uppercase mb-1"
          style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
        >
          01 — Agenda
        </p>
        <h4
          className="font-serif leading-[1.05] tracking-tightest mb-4"
          style={{ fontSize: 'clamp(14px, 1.6vw, 20px)', color: 'var(--ink-strong)' }}
        >
          What we’ll <span className="font-serif-italic">cover.</span>
        </h4>
        <ul className="flex-1 flex flex-col justify-center gap-2.5">
          {items.map((t, i) => (
            <li key={t} className="flex items-baseline gap-3">
              <span
                className="text-[9px] tracking-[0.18em]"
                style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
              >
                0{i + 1}
              </span>
              <span
                className="font-serif leading-tight tracking-tightest"
                style={{ fontSize: 'clamp(11px, 1.25vw, 15px)', color: 'var(--ink-strong)' }}
              >
                {t}
              </span>
              <div className="flex-1 h-px ml-2" style={{ background: 'var(--line)' }} />
            </li>
          ))}
        </ul>
      </div>
    </SlideFrame>
  )
}

function SlideChart() {
  const bars = [38, 52, 47, 64, 71, 82, 76, 90]
  return (
    <SlideFrame>
      <div className="absolute inset-0 p-6 flex flex-col">
        <div className="flex items-baseline justify-between">
          <p
            className="text-[9px] tracking-[0.22em] uppercase"
            style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
          >
            04 — Revenue cadence
          </p>
          <span className="text-[9px]" style={{ color: 'var(--ink-soft)' }}>FY2025 · quarterly</span>
        </div>
        <h4
          className="font-serif leading-[1.05] tracking-tightest mt-1 mb-4"
          style={{ fontSize: 'clamp(14px, 1.6vw, 20px)', color: 'var(--ink-strong)' }}
        >
          Eight quarters of <span className="font-serif-italic">consistency.</span>
        </h4>
        <div className="flex-1 flex items-end gap-1.5">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1">
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background: i === bars.length - 1 ? '#0A0907' : 'rgba(10,9,7,0.18)',
                }}
              />
              <span
                className="text-[7.5px]"
                style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
              >
                Q{(i % 4) + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  )
}

function SlideTwoCol() {
  return (
    <SlideFrame>
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="p-6 flex flex-col justify-between">
          <p
            className="text-[9px] tracking-[0.22em] uppercase"
            style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
          >
            05 — Product
          </p>
          <div>
            <h4
              className="font-serif leading-[1.05] tracking-tightest mb-2"
              style={{ fontSize: 'clamp(14px, 1.6vw, 20px)', color: 'var(--ink-strong)' }}
            >
              Built for the <span className="font-serif-italic">few who care.</span>
            </h4>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              Editorial typography. Considered defaults. A canvas that respects the reader.
            </p>
          </div>
          <div className="flex gap-1.5">
            <div className="h-1 w-6 rounded-full bg-[#0A0907]" />
            <div className="h-1 w-3 rounded-full" style={{ background: 'var(--line-strong)' }} />
            <div className="h-1 w-3 rounded-full" style={{ background: 'var(--line-strong)' }} />
          </div>
        </div>
        <div
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #F6F6F6 0%, #EAEAEA 100%)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3/4 aspect-[4/5] rounded-md"
              style={{
                background:
                  'repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0 6px, transparent 6px 12px), #fff',
                border: '1px solid var(--line)',
              }}
            />
          </div>
          <div className="absolute bottom-3 right-3 text-[8px] tracking-[0.2em] uppercase"
               style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}>
            Fig. 05
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Landing Page
   ───────────────────────────────────────────────────────────────────────── */

export function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!tourOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTourOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [tourOpen])

  const goLogin = () => navigate('/login')
  const openTour = () => setTourOpen(true)

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* ─── Nav ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.82)' : 'transparent',
          backdropFilter: scrolled ? 'saturate(180%) blur(14px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(14px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        }}
      >
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--ink-strong)' }}
            >
              <span className="text-white text-[10px] font-bold tracking-tight">WAC</span>
            </div>
            <span className="font-serif text-[18px] tracking-tighter" style={{ color: 'var(--ink-strong)' }}>
              Deck Studio
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-9">
            {['Product', 'Templates', 'Customers', 'Pricing'].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="text-[13px] transition-colors hover:opacity-100"
                style={{ color: 'var(--ink-soft)' }}
              >
                {l}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={goLogin}
              className="hidden sm:inline-flex text-[13px] font-semibold px-3 h-9 items-center rounded-full transition-colors"
              style={{ color: 'var(--ink-strong)' }}
            >
              Sign in
            </button>
            <button onClick={goLogin} className="btn-primary">
              Get started
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
        {/* soft radial grid */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage:
              'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%)',
          }}
        />

        <div className="relative max-w-[1240px] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-14 items-center">
          <div className="lg:col-span-6">
            <div
              className="inline-flex items-center gap-2 px-3 h-7 rounded-full mb-7"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
            >
              <Sparkles size={12} style={{ color: 'var(--ink-strong)' }} />
              <span
                className="text-[10.5px] tracking-[0.18em] uppercase font-medium"
                style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-strong)' }}
              >
                New · Editorial AI Engine
              </span>
            </div>

            <h1
              className="font-serif leading-[0.98] tracking-tightest"
              style={{ color: 'var(--ink-strong)', fontSize: 'clamp(44px, 6.4vw, 84px)' }}
            >
              Decks that read
              <br />
              like they were
              <br />
              <span className="font-serif-italic">written, not made.</span>
            </h1>

            <p
              className="mt-7 text-[16px] lg:text-[17px] leading-relaxed max-w-[520px]"
              style={{ color: 'var(--ink-soft)' }}
            >
              WAC Deck Studio turns a paragraph of intent into a publication-grade
              presentation — typography, hierarchy, and pacing handled by an
              AI trained on the editorial canon.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={goLogin} className="btn-primary btn-lg">
                Start creating — free
                <ArrowRight size={15} />
              </button>
              <button onClick={openTour} className="btn-secondary btn-lg">
                <PlayCircle size={15} />
                Watch the 90s tour
              </button>
            </div>

            <div className="mt-10 flex items-center gap-6 flex-wrap">
              <div className="flex -space-x-2">
                {['#1A1A1A', '#3A332B', '#5C5046', '#8A7B6B', '#B8A892'].map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} fill="#0A0907" stroke="#0A0907" />
                  ))}
                  <span className="ml-2 text-[12px] font-semibold" style={{ color: 'var(--ink-strong)' }}>
                    4.9
                  </span>
                </div>
                <div className="text-[11.5px]" style={{ color: 'var(--ink-soft)' }}>
                  Trusted by 12,400+ teams in 47 countries
                </div>
              </div>
            </div>
          </div>

          {/* Hero visual — stacked dummy slides */}
          <div className="lg:col-span-6 relative">
            {/* Mobile / tablet: single clean slide */}
            <div className="lg:hidden relative max-w-[560px] mx-auto">
              <SlideCover />
              <div
                className="absolute -top-3 left-3 px-3 py-1.5 rounded-full flex items-center gap-2"
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  boxShadow: '0 8px 24px -8px rgba(0,0,0,0.18)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0A0907' }} />
                <span
                  className="text-[10px] tracking-[0.18em] uppercase font-medium"
                  style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-strong)' }}
                >
                  Generating · 12 slides
                </span>
              </div>
            </div>

            {/* Desktop: layered stack, sized off the container width */}
            <div className="hidden lg:block relative w-full" style={{ aspectRatio: '5 / 4' }}>
              <div
                className="absolute top-[6%] right-0 w-[78%]"
                style={{ transform: 'rotate(3deg)', opacity: 0.9 }}
              >
                <SlideAgenda />
              </div>
              <div
                className="absolute top-[22%] left-0 w-[72%]"
                style={{ transform: 'rotate(-4deg)' }}
              >
                <SlideMetrics />
              </div>
              <div className="absolute bottom-0 right-[4%] w-[82%]">
                <SlideCover />
              </div>

              <div
                className="absolute top-0 left-0 px-3 py-2 rounded-full flex items-center gap-2 z-10"
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  boxShadow: '0 8px 24px -8px rgba(0,0,0,0.18)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0A0907' }} />
                <span
                  className="text-[10px] tracking-[0.18em] uppercase font-medium"
                  style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-strong)' }}
                >
                  Generating · 12 slides
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Logos strip ─────────────────────────────────────────────────── */}
      <section className="border-y" style={{ borderColor: 'var(--line)' }}>
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-10 flex items-center justify-between gap-8 flex-wrap">
          <span
            className="text-[10.5px] tracking-[0.22em] uppercase"
            style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
          >
            — In use at
          </span>
          <div className="flex items-center gap-10 flex-wrap opacity-60">
            {['Northwind', 'Halcyon', 'Beacon & Co.', 'Quartermast', 'Lysander', 'Pinewright'].map(
              (n) => (
                <span
                  key={n}
                  className="font-serif text-[19px] tracking-tighter"
                  style={{ color: 'var(--ink-strong)' }}
                >
                  {n}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ─── Showcase: a "deck" of dummy slides ──────────────────────────── */}
      <section id="product" className="py-24 lg:py-32">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div className="max-w-[640px]">
              <p className="eyebrow mb-4">— A deck, opened</p>
              <h2
                className="font-serif leading-[1] tracking-tightest"
                style={{ color: 'var(--ink-strong)', fontSize: 'clamp(32px, 4.4vw, 56px)' }}
              >
                Six slides. <span className="font-serif-italic">No template smell.</span>
              </h2>
              <p
                className="mt-5 text-[15.5px] leading-relaxed max-w-[520px]"
                style={{ color: 'var(--ink-soft)' }}
              >
                Every layout is composed — not assembled. Type sets itself in
                proper proportion, and the canvas knows what to leave out.
              </p>
            </div>
            <button onClick={goLogin} className="btn-secondary">
              Open a sample deck
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SlideCover />
            <SlideAgenda />
            <SlideMetrics />
            <SlideChart />
            <SlideTwoCol />
            <SlideQuote />
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section
        className="py-24 lg:py-32"
        style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}
      >
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
          <div className="max-w-[680px] mb-14">
            <p className="eyebrow mb-4">— What's inside</p>
            <h2
              className="font-serif leading-[1] tracking-tightest"
              style={{ color: 'var(--ink-strong)', fontSize: 'clamp(32px, 4.4vw, 56px)' }}
            >
              Less software. <span className="font-serif-italic">More craft.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Wand2 size={18} />,
                eyebrow: '01',
                title: 'Prompt to publication',
                body: 'Describe the talk. Get a draft deck with structure, narrative, and visual rhythm.',
              },
              {
                icon: <Type size={18} />,
                eyebrow: '02',
                title: 'Editorial typography',
                body: 'Inter, italic accents, optical sizing, kerning that earns its keep.',
              },
              {
                icon: <Palette size={18} />,
                eyebrow: '03',
                title: 'Considered themes',
                body: 'Twelve curated palettes, each tuned for projector, print, and reader.',
              },
              {
                icon: <Layers size={18} />,
                eyebrow: '04',
                title: 'Composable slides',
                body: 'Swap a layout, keep the voice. Sections stay coherent end-to-end.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-7 rounded-2xl bg-white flex flex-col"
                style={{ border: '1px solid var(--line)' }}
              >
                <div className="flex items-center justify-between mb-10">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--ink-strong)', color: '#fff' }}
                  >
                    {f.icon}
                  </div>
                  <span
                    className="text-[10px] tracking-[0.2em]"
                    style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
                  >
                    {f.eyebrow}
                  </span>
                </div>
                <h3
                  className="font-serif leading-tight tracking-tightest mb-2"
                  style={{ color: 'var(--ink-strong)', fontSize: '20px' }}
                >
                  {f.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-14">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-4">— The process</p>
            <h2
              className="font-serif leading-[1] tracking-tightest"
              style={{ color: 'var(--ink-strong)', fontSize: 'clamp(32px, 4.4vw, 56px)' }}
            >
              Three steps,<br />
              <span className="font-serif-italic">no busywork.</span>
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed max-w-[420px]" style={{ color: 'var(--ink-soft)' }}>
              From an empty page to a presentable deck in under four minutes —
              and you keep the cursor when you want it.
            </p>
            <button onClick={goLogin} className="btn-primary mt-8">
              Try it now
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="lg:col-span-7 space-y-5">
            {[
              {
                n: '01',
                t: 'Tell us the story',
                b: 'Paste a brief, drop a transcript, or write a sentence. The system listens for shape — beats, sections, evidence.',
                preview: <SlideAgenda />,
              },
              {
                n: '02',
                t: 'Choose a register',
                b: 'Pick a theme — corporate, editorial, scientific, soft. Each carries its own typography and pacing.',
                preview: <SlideTwoCol />,
              },
              {
                n: '03',
                t: 'Edit like a writer',
                b: 'Reorder by drag. Rephrase a heading and the layout adjusts. Export to PDF, PPTX, or share a live link.',
                preview: <SlideChart />,
              },
            ].map((step) => (
              <div
                key={step.n}
                className="grid grid-cols-12 gap-5 items-center p-5 rounded-2xl bg-white"
                style={{ border: '1px solid var(--line)' }}
              >
                <div className="col-span-12 md:col-span-7">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-[10px] tracking-[0.22em]"
                      style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
                    >
                      Step {step.n}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
                  </div>
                  <h3
                    className="font-serif leading-tight tracking-tightest mb-2"
                    style={{ fontSize: '24px', color: 'var(--ink-strong)' }}
                  >
                    {step.t}
                  </h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                    {step.b}
                  </p>
                </div>
                <div className="col-span-12 md:col-span-5">{step.preview}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Templates strip ─────────────────────────────────────────────── */}
      <section
        id="templates"
        className="py-24 lg:py-32"
        style={{ background: '#0A0907', color: '#fff' }}
      >
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div className="max-w-[640px]">
              <p
                className="text-[11px] tracking-[0.22em] uppercase mb-4"
                style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: '#888' }}
              >
                — Themes
              </p>
              <h2
                className="font-serif leading-[1] tracking-tightest"
                style={{ fontSize: 'clamp(32px, 4.4vw, 56px)' }}
              >
                Twelve voices. <span className="font-serif-italic">One studio.</span>
              </h2>
            </div>
            <button
              onClick={goLogin}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-full text-[13px] font-semibold"
              style={{ background: '#fff', color: '#0A0907' }}
            >
              Browse all templates
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Corporate Excellence', tag: 'Board · Annual', preview: <SlideCover /> },
              { name: 'Editorial Quarterly', tag: 'Long-form · Print', preview: <SlideQuote /> },
              { name: 'Civic Brief', tag: 'Policy · Research', preview: <SlideMetrics /> },
            ].map((t) => (
              <div key={t.name} className="space-y-4">
                {t.preview}
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="font-serif text-[18px] tracking-tighter">{t.name}</div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: '#888' }}>
                      {t.tag}
                    </div>
                  </div>
                  <Presentation size={16} style={{ color: '#888' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonial ─────────────────────────────────────────────────── */}
      <section id="customers" className="py-24 lg:py-32">
        <div className="max-w-[920px] mx-auto px-6 lg:px-10 text-center">
          <p className="eyebrow mb-6">— Word of mouth</p>
          <blockquote
            className="font-serif-italic leading-[1.05] tracking-tightest"
            style={{ color: 'var(--ink-strong)', fontSize: 'clamp(28px, 4vw, 48px)' }}
          >
            “The first deck tool that doesn’t make me apologize for using a deck tool.
            We’ve cut review cycles in half.”
          </blockquote>
          <div className="mt-10 flex items-center justify-center gap-4">
            <div
              className="w-10 h-10 rounded-full"
              style={{ background: 'linear-gradient(135deg, #2A2620, #0A0907)' }}
            />
            <div className="text-left">
              <div className="text-[14px] font-semibold" style={{ color: 'var(--ink-strong)' }}>
                Adaeze Okonkwo
              </div>
              <div className="text-[12px]" style={{ color: 'var(--ink-soft)' }}>
                Head of Brand · Halcyon
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing tease + final CTA ───────────────────────────────────── */}
      <section id="pricing" className="pb-32">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
          <div
            className="relative overflow-hidden rounded-3xl px-8 lg:px-16 py-16 lg:py-20"
            style={{
              background:
                'radial-gradient(ellipse at top right, rgba(255,255,255,0.08), transparent 60%), #0A0907',
              color: '#fff',
            }}
          >
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <p
                  className="text-[11px] tracking-[0.22em] uppercase mb-5"
                  style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: '#888' }}
                >
                  — Begin
                </p>
                <h2
                  className="font-serif leading-[0.98] tracking-tightest"
                  style={{ fontSize: 'clamp(36px, 5.4vw, 68px)' }}
                >
                  Your next deck is
                  <br />
                  <span className="font-serif-italic">already half-written.</span>
                </h2>
                <p
                  className="mt-6 text-[15.5px] leading-relaxed max-w-[480px]"
                  style={{ color: '#BFBFBF' }}
                >
                  Free to start. No credit card. Three decks a month on the
                  house — keep what you make.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    onClick={goLogin}
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-semibold"
                    style={{ background: '#fff', color: '#0A0907' }}
                  >
                    Get started — free
                    <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={goLogin}
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-semibold"
                    style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    Sign in
                  </button>
                </div>

                <ul className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[560px]">
                  {['No credit card', 'PDF & PPTX export', 'Cancel anytime'].map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[12.5px]" style={{ color: '#BFBFBF' }}>
                      <CheckCircle2 size={14} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-5">
                {/* Mobile: single slide */}
                <div className="lg:hidden max-w-[480px] mx-auto">
                  <SlideQuote />
                </div>
                {/* Desktop: layered */}
                <div className="hidden lg:block relative w-full" style={{ aspectRatio: '5 / 4' }}>
                  <div
                    className="absolute top-0 right-0 w-[80%]"
                    style={{ transform: 'rotate(4deg)', opacity: 0.7 }}
                  >
                    <SlideChart />
                  </div>
                  <div className="absolute bottom-0 left-0 w-[88%]">
                    <SlideQuote />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--line)' }}>
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-12 grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
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
            <p className="mt-5 text-[13px] leading-relaxed max-w-[300px]" style={{ color: 'var(--ink-soft)' }}>
              An editorial AI for the people who still care how a slide is set.
            </p>
          </div>

          {[
            { h: 'Product', l: ['Features', 'Templates', 'Pricing', 'Changelog'] },
            { h: 'Company', l: ['About', 'Customers', 'Press', 'Contact'] },
            { h: 'Resources', l: ['Docs', 'Guides', 'Status', 'Privacy'] },
          ].map((c) => (
            <div key={c.h}>
              <div
                className="text-[10.5px] tracking-[0.22em] uppercase mb-4"
                style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
              >
                {c.h}
              </div>
              <ul className="space-y-2.5">
                {c.l.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="max-w-[1240px] mx-auto px-6 lg:px-10 py-6 flex items-center justify-between flex-wrap gap-4"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <span className="text-[11.5px]" style={{ color: 'var(--ink-faint)' }}>
            © 2026 WAC Deck Studio. All rights reserved.
          </span>
          <span
            className="text-[10.5px] tracking-[0.22em] uppercase"
            style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: 'var(--ink-muted)' }}
          >
            Made with care · Set in Inter
          </span>
        </div>
      </footer>

      {tourOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product tour video"
          onClick={() => setTourOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 9, 7, 0.82)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            animation: 'tourFadeIn 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <button
            onClick={() => setTourOpen(false)}
            aria-label="Close video"
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              width: 44,
              height: 44,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(1280px, 100%)',
              aspectRatio: '16 / 9',
              borderRadius: 18,
              overflow: 'hidden',
              background: '#000',
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.6)',
            }}
          >
            <video
              src="/promo.mp4"
              autoPlay
              controls
              playsInline
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
          <style>{`@keyframes tourFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  )
}
