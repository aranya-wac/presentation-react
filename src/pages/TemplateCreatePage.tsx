import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Loader2,
  Type,
  List,
  Image as ImageIcon,
  Columns,
} from 'lucide-react'
import { AppLayout } from '../components/Layout/AppLayout'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { projectsApi, templatesApi, themesApi } from '../api/client'
import type {
  TemplateLayoutType,
  TemplateSlideInput,
} from '../api/client'

interface ThemeRow {
  id: string
  name: string
  colors: Record<string, string>
  fonts: Record<string, unknown>
}

interface RoleRow {
  role: string
  audience: string
  focus: string
}

const LAYOUT_OPTIONS: { value: TemplateLayoutType; label: string; Icon: any; help: string }[] = [
  { value: 'title',   label: 'Title',   Icon: Type,       help: 'Big headline + subtitle. Good for openers and section breaks.' },
  { value: 'bullets', label: 'Bullets', Icon: List,       help: '4–6 concise points. Most common slide.' },
  { value: 'image',   label: 'Image',   Icon: ImageIcon,  help: 'Image on the left, caption on the right.' },
  { value: 'columns', label: 'Columns', Icon: Columns,    help: '2–3 equal columns of heading + body.' },
]

interface DraftSlide extends TemplateSlideInput {
  _key: string  // stable key for React lists during reorder
}

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

function makeBlankSlide(order: number): DraftSlide {
  return {
    _key: newKey(),
    order,
    title: '',
    layout_type: 'bullets',
    prompt_hint: '',
  }
}

export function TemplateCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [role, setRole] = useState<string>('')  // empty = no role

  // Step 2
  const [slides, setSlides] = useState<DraftSlide[]>([
    { ...makeBlankSlide(1), title: 'Headline', layout_type: 'title', prompt_hint: 'Sets up the topic in one line.' },
    { ...makeBlankSlide(2), title: 'Key Points', layout_type: 'bullets', prompt_hint: '4–6 concise takeaways.' },
  ])
  const [activeSlideIdx, setActiveSlideIdx] = useState(0)

  // Step 3
  const [themeId, setThemeId] = useState<string>('')

  // Lookups
  const [themes, setThemes] = useState<ThemeRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])

  useEffect(() => {
    themesApi.list().then((r) => {
      const list = (Array.isArray(r.data) ? r.data : (r.data?.items ?? [])) as ThemeRow[]
      setThemes(list)
      if (list.length && !themeId) setThemeId(list[0].id)
    }).catch(() => {/* keep silent — Step 3 will show empty list */})
    projectsApi.roles().then((r) => setRoles(r.data)).catch(() => {/* roles optional */})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Step 2 helpers ─────────────────────────────────────────────────────────

  const reorderSlides = (next: DraftSlide[]) =>
    next.map((s, i) => ({ ...s, order: i + 1 }))

  const addSlide = () => {
    const next = reorderSlides([...slides, makeBlankSlide(slides.length + 1)])
    setSlides(next)
    setActiveSlideIdx(next.length - 1)
  }
  const removeSlide = (idx: number) => {
    if (slides.length <= 1) {
      toast.error('A template needs at least one slide')
      return
    }
    const next = reorderSlides(slides.filter((_, i) => i !== idx))
    setSlides(next)
    setActiveSlideIdx(Math.min(activeSlideIdx, next.length - 1))
  }
  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= slides.length) return
    const next = [...slides]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setSlides(reorderSlides(next))
    setActiveSlideIdx(target)
  }
  const updateActive = (patch: Partial<DraftSlide>) => {
    setSlides((prev) =>
      prev.map((s, i) => (i === activeSlideIdx ? { ...s, ...patch } : s)),
    )
  }

  const active = slides[activeSlideIdx]

  // ── Validation per step ────────────────────────────────────────────────────

  const step1Valid = name.trim().length > 0
  const step2Valid =
    slides.length > 0 && slides.every((s) => s.title.trim().length > 0)
  const step3Valid = !!themeId

  const goToStep = (next: 1 | 2 | 3) => {
    if (next === step) return
    if (next > step) {
      // Forward navigation requires earlier steps to be valid
      if (next >= 2 && !step1Valid) { toast.error('Add a name to continue'); return }
      if (next >= 3 && !step2Valid) { toast.error('Each slide needs a title'); return }
    }
    setStep(next)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (!step1Valid) return goToStep(1)
    if (!step2Valid) return goToStep(2)
    if (!step3Valid) return goToStep(3)
    setSubmitting(true)
    try {
      const { data } = await templatesApi.create({
        name: name.trim(),
        category: category.trim() || undefined,
        role: role || null,
        theme_id: themeId,
        slides: slides.map(({ _key, ...rest }) => rest),
      })
      toast.success('Template created', `${slides.length} slides ready.`)
      navigate(`/templates/${data.id}/use`, { state: { templateId: data.id } })
    } catch (e: any) {
      toast.error('Could not create template', e?.response?.data?.detail ?? e?.message ?? '')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="px-12 pt-10 pb-20 max-w-[1100px] mx-auto">
        <button
          onClick={() => navigate('/templates')}
          className="inline-flex items-center gap-1.5 text-[12.5px] mb-6 transition-colors"
          style={{ color: 'var(--ink-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-strong)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
        >
          <ArrowLeft size={13} />
          All templates
        </button>

        <div className="mb-8">
          <p className="eyebrow mb-3">— New template</p>
          <h1
            className="font-serif leading-[1.05] tracking-tighter text-[34px] md:text-[42px]"
            style={{ color: 'var(--ink-strong)' }}
          >
            Build a reusable deck
          </h1>
        </div>

        <Stepper step={step} onGo={goToStep} />

        <div className="mt-8">
          {step === 1 && (
            <Step1
              name={name} setName={setName}
              category={category} setCategory={setCategory}
              role={role} setRole={setRole}
              roles={roles}
            />
          )}
          {step === 2 && (
            <Step2
              slides={slides}
              activeIdx={activeSlideIdx}
              setActiveIdx={setActiveSlideIdx}
              onAdd={addSlide}
              onRemove={removeSlide}
              onMove={moveSlide}
              active={active}
              onPatch={updateActive}
            />
          )}
          {step === 3 && (
            <Step3
              themes={themes}
              themeId={themeId}
              setThemeId={setThemeId}
              summary={{
                name,
                category,
                role,
                slideCount: slides.length,
                roleLabel: roles.find((r) => r.role === role)?.role ?? '—',
              }}
            />
          )}
        </div>

        <div
          className="mt-10 flex items-center justify-between pt-5"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <Button
            variant="ghost"
            onClick={() => goToStep((Math.max(1, step - 1)) as 1 | 2 | 3)}
            disabled={step === 1 || submitting}
            leadingIcon={<ChevronLeft size={13} />}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button
              variant="primary"
              onClick={() => goToStep(((step + 1) as 1 | 2 | 3))}
              trailingIcon={<ChevronRight size={13} />}
              disabled={submitting}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={submit}
              disabled={submitting}
              leadingIcon={submitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            >
              {submitting ? 'Creating…' : 'Create template'}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

// ── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ step, onGo }: { step: 1 | 2 | 3; onGo: (n: 1 | 2 | 3) => void }) {
  const labels = ['Basics', 'Slides', 'Theme']
  return (
    <div className="flex items-center gap-3">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const active = step === n
        const done = step > n
        return (
          <div key={label} className="flex items-center gap-3">
            <button
              onClick={() => onGo(n)}
              className="flex items-center gap-2.5 transition-colors"
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors"
                style={{
                  background: active ? 'var(--ink-strong)' : (done ? '#16A34A' : 'var(--surface)'),
                  color: active || done ? '#fff' : 'var(--ink-soft)',
                  border: `1px solid ${active ? 'var(--ink-strong)' : (done ? '#16A34A' : 'var(--line)')}`,
                }}
              >
                {done ? <Check size={13} /> : n}
              </span>
              <span
                className="text-[13px] font-semibold"
                style={{ color: active ? 'var(--ink-strong)' : 'var(--ink-muted)' }}
              >
                {label}
              </span>
            </button>
            {n < 3 && (
              <span className="w-8 h-px" style={{ background: 'var(--line)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Basics ───────────────────────────────────────────────────────────

function Step1({
  name, setName,
  category, setCategory,
  role, setRole,
  roles,
}: {
  name: string; setName: (v: string) => void
  category: string; setCategory: (v: string) => void
  role: string; setRole: (v: string) => void
  roles: RoleRow[]
}) {
  return (
    <div className="rounded-2xl p-7 max-w-2xl"
      style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
    >
      <div className="mb-5">
        <label className="eyebrow mb-2 block">Name *</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Weekly Status Update"
          className="w-full px-3 h-11 rounded-xl text-[14px] outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
        />
      </div>
      <div className="mb-5">
        <label className="eyebrow mb-2 block">Category</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Internal · Sales · Engineering · …"
          className="w-full px-3 h-11 rounded-xl text-[14px] outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
        />
      </div>
      <div>
        <label className="eyebrow mb-2 block">
          Role <span style={{ color: 'var(--ink-faint)' }}>(optional)</span>
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 h-11 rounded-xl text-[14px] outline-none cursor-pointer"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
        >
          <option value="">— No role —</option>
          {roles.map((r) => (
            <option key={r.role} value={r.role}>
              {r.role.toUpperCase()} — {r.audience}
            </option>
          ))}
        </select>
        <p className="text-[12px] mt-2" style={{ color: 'var(--ink-muted)' }}>
          When set, generation applies the role's editorial focus (audience, tone) on top of your slides.
        </p>
      </div>
    </div>
  )
}

// ── Step 2: Slide Builder ────────────────────────────────────────────────────

function Step2({
  slides,
  activeIdx,
  setActiveIdx,
  onAdd,
  onRemove,
  onMove,
  active,
  onPatch,
}: {
  slides: DraftSlide[]
  activeIdx: number
  setActiveIdx: (n: number) => void
  onAdd: () => void
  onRemove: (idx: number) => void
  onMove: (idx: number, dir: -1 | 1) => void
  active: DraftSlide | undefined
  onPatch: (patch: Partial<DraftSlide>) => void
}) {
  const layoutMeta = useMemo(
    () => Object.fromEntries(LAYOUT_OPTIONS.map((o) => [o.value, o])),
    [],
  )
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Slide list */}
      <div
        className="rounded-2xl p-3"
        style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
      >
        <div className="flex flex-col gap-1.5 mb-2">
          {slides.map((s, i) => {
            const M = layoutMeta[s.layout_type]
            const isActive = i === activeIdx
            return (
              <div
                key={s._key}
                className="rounded-lg p-3 transition-all cursor-pointer"
                style={{
                  background: isActive ? 'var(--surface)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--line-strong, var(--line))' : 'transparent'}`,
                }}
                onClick={() => setActiveIdx(i)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="eyebrow">{s.order}</span>
                  {M && <M.Icon size={12} style={{ color: 'var(--ink-muted)' }} />}
                  <span
                    className="text-[10px] uppercase tracking-wide font-semibold ml-auto"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {s.layout_type}
                  </span>
                </div>
                <p
                  className="text-[13px] truncate"
                  style={{ color: 'var(--ink-strong)' }}
                >
                  {s.title || <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>Untitled</span>}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <RowBtn title="Move up"   disabled={i === 0}
                    onClick={(e) => { e.stopPropagation(); onMove(i, -1) }}>
                    <ArrowUp size={11} />
                  </RowBtn>
                  <RowBtn title="Move down" disabled={i === slides.length - 1}
                    onClick={(e) => { e.stopPropagation(); onMove(i, 1) }}>
                    <ArrowDown size={11} />
                  </RowBtn>
                  <span className="flex-1" />
                  <RowBtn title="Delete" danger
                    onClick={(e) => { e.stopPropagation(); onRemove(i) }}>
                    <Trash2 size={11} />
                  </RowBtn>
                </div>
              </div>
            )
          })}
        </div>
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12.5px] font-semibold transition-colors"
          style={{
            background: 'transparent',
            border: '1px dashed var(--line-strong, var(--line))',
            color: 'var(--ink-soft)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(10,9,7,0.04)'
            e.currentTarget.style.color = 'var(--ink-strong)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--ink-soft)'
          }}
        >
          <Plus size={12} />
          Add slide
        </button>
      </div>

      {/* Slide editor */}
      {active && (
        <div
          className="rounded-2xl p-7"
          style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
        >
          <div className="mb-5">
            <label className="eyebrow mb-2 block">Title *</label>
            <input
              value={active.title}
              onChange={(e) => onPatch({ title: e.target.value })}
              placeholder="Headline · Wins · Blockers · Next steps · …"
              className="w-full px-3 h-11 rounded-xl text-[14px] outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
            />
          </div>

          <div className="mb-5">
            <label className="eyebrow mb-2 block">Layout</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LAYOUT_OPTIONS.map(({ value, label, Icon }) => {
                const sel = active.layout_type === value
                return (
                  <button
                    key={value}
                    onClick={() => onPatch({ layout_type: value })}
                    className="flex flex-col items-start gap-1.5 px-3 py-3 rounded-xl text-left transition-all"
                    style={{
                      background: sel ? 'var(--ink-strong)' : 'var(--surface)',
                      color: sel ? '#fff' : 'var(--ink-soft)',
                      border: `1px solid ${sel ? 'var(--ink-strong)' : 'var(--line)'}`,
                    }}
                  >
                    <Icon size={14} />
                    <span className="text-[12.5px] font-semibold">{label}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[12px] mt-2" style={{ color: 'var(--ink-muted)' }}>
              {layoutMeta[active.layout_type]?.help}
            </p>
          </div>

          <div>
            <label className="eyebrow mb-2 block">
              Prompt hint <span style={{ color: 'var(--ink-faint)' }}>(guides the AI for this slide)</span>
            </label>
            <textarea
              value={active.prompt_hint}
              onChange={(e) => onPatch({ prompt_hint: e.target.value })}
              rows={4}
              placeholder="e.g., '3–5 wins from the past week, with concrete numbers'"
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none leading-relaxed"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function RowBtn({
  children, onClick, disabled, danger, title,
}: {
  children: any
  onClick: (e: React.MouseEvent) => void
  disabled?: boolean
  danger?: boolean
  title?: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
      style={{
        color: disabled ? 'var(--ink-faint)' : 'var(--ink-muted)',
        cursor: disabled ? 'default' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = danger
          ? 'var(--accent-soft, rgba(220,38,38,0.08))'
          : 'rgba(10,9,7,0.06)'
        e.currentTarget.style.color = danger ? 'var(--accent)' : 'var(--ink-strong)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = disabled ? 'var(--ink-faint)' : 'var(--ink-muted)'
      }}
    >
      {children}
    </button>
  )
}

// ── Step 3: Theme + summary ──────────────────────────────────────────────────

function Step3({
  themes,
  themeId,
  setThemeId,
  summary,
}: {
  themes: ThemeRow[]
  themeId: string
  setThemeId: (id: string) => void
  summary: {
    name: string
    category: string
    role: string
    roleLabel: string
    slideCount: number
  }
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div
        className="rounded-2xl p-7"
        style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
      >
        <p className="eyebrow mb-3">— Theme</p>
        <h2 className="font-serif text-[22px] tracking-tighter mb-5" style={{ color: 'var(--ink-strong)' }}>
          Pick a look
        </h2>
        {themes.length === 0 ? (
          <p style={{ color: 'var(--ink-muted)' }} className="text-[13px]">No themes available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((t) => {
              const sel = themeId === t.id
              const c = t.colors || {}
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className="text-left rounded-xl p-4 transition-all"
                  style={{
                    background: 'var(--surface)',
                    border: `2px solid ${sel ? 'var(--ink-strong)' : 'var(--line)'}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    {['heading', 'body', 'accent', 'background'].map((k) => (
                      <span
                        key={k}
                        className="w-5 h-5 rounded-full"
                        style={{
                          background: c[k] || c[k.toLowerCase()] || '#ddd',
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="font-serif text-[16px] tracking-tighter" style={{ color: 'var(--ink-strong)' }}>
                    {t.name}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
      >
        <p className="eyebrow mb-3">— Summary</p>
        <SummaryRow label="Name" value={summary.name || '—'} />
        <SummaryRow label="Category" value={summary.category || '—'} />
        <SummaryRow label="Role" value={summary.role ? summary.roleLabel.toUpperCase() : '—'} />
        <SummaryRow label="Slides" value={String(summary.slideCount)} />
        <p
          className="text-[12px] mt-4 pt-4 leading-relaxed"
          style={{ borderTop: '1px solid var(--line)', color: 'var(--ink-muted)' }}
        >
          <Sparkles size={11} className="inline mr-1" />
          New templates start as <strong>private</strong>. Ask an admin to publish if you'd like to share them.
        </p>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[11.5px] uppercase tracking-wide font-semibold" style={{ color: 'var(--ink-muted)' }}>
        {label}
      </span>
      <span className="text-[13px] truncate" style={{ color: 'var(--ink-strong)' }}>
        {value}
      </span>
    </div>
  )
}
