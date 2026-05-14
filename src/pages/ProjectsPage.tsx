import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, Search, FileText, Sparkles, X, MoreHorizontal } from 'lucide-react'
import { AppLayout } from '../components/Layout/AppLayout'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { projectsApi } from '../api/client'
import type { ProjectListItem } from '../api/client'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`
  if (hours < 24) return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const PAGE_SIZE = 20

export function ProjectsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? Documents and generated decks will be removed.')) return
    try {
      await projectsApi.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      setTotal((t) => Math.max(0, t - 1))
      toast.success('Project deleted')
    } catch (e: any) {
      toast.error('Could not delete', e?.response?.data?.detail ?? e?.message ?? '')
    } finally {
      setOpenMenu(null)
    }
  }

  // Debounce search → trigger refetch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  const fetchPage = async (resetOffset: boolean) => {
    const nextOffset = resetOffset ? 0 : offset
    if (resetOffset) setLoading(true)
    else setLoadingMore(true)
    try {
      const { data } = await projectsApi.listPaged({
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        offset: nextOffset,
      })
      setTotal(data.total)
      setOffset(nextOffset + data.items.length)
      setProjects((prev) => (resetOffset ? data.items : [...prev, ...data.items]))
    } catch (e: any) {
      toast.error('Failed to load projects', e?.response?.data?.detail ?? e?.message ?? '')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial load + reload when search changes
  useEffect(() => {
    fetchPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const filtered = projects
  const hasMore = projects.length < total

  return (
    <AppLayout>
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => {
            setShowCreate(false)
            toast.success('Project created', p.name)
            navigate(`/projects/${p.id}`)
          }}
        />
      )}

      <div className="px-12 pt-12 pb-20 max-w-[1280px] mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="eyebrow mb-3">— Studio</p>
            <h1
              className="font-serif leading-[1.05] tracking-tighter text-[34px] md:text-[44px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              Projects
            </h1>
            <p className="text-[14px] mt-3 max-w-md" style={{ color: 'var(--ink-soft)' }}>
              Group documents and let AI build role-targeted decks from them.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreate(true)}
            leadingIcon={<Plus size={13} />}
          >
            New project
          </Button>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md">
          <div
            className="flex items-center gap-2 px-3 h-10 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
          >
            <Search size={14} style={{ color: 'var(--ink-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color: 'var(--ink-strong)' }}
            />
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl p-6 shimmer h-[170px]" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div
            className="rounded-3xl px-12 py-16 text-center"
            style={{ background: 'var(--surface)', border: '1px dashed var(--line-strong)' }}
          >
            <p
              className="font-serif text-[28px] md:text-[34px] leading-tight tracking-tighter mb-3"
              style={{ color: 'var(--ink-strong)' }}
            >
              No projects yet,
              <br />
              <span className="font-serif-italic" style={{ color: 'var(--accent)' }}>
                start one.
              </span>
            </p>
            <p
              className="text-[14px] mb-7 max-w-sm mx-auto leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              A project holds your source documents and the role-specific decks generated from
              them. Upload a brief, choose a role, get a deck.
            </p>
            <Button variant="primary" onClick={() => setShowCreate(true)} leadingIcon={<Plus size={13} />}>
              Create your first project
            </Button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <ProjectCard
                  key={p.id}
                  p={p}
                  menuOpen={openMenu === p.id}
                  onToggleMenu={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                  onCloseMenu={() => setOpenMenu(null)}
                  onOpen={() => navigate(`/projects/${p.id}`)}
                  onDelete={() => handleDelete(p.id)}
                />
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="eyebrow" style={{ color: 'var(--ink-muted)' }}>
                Showing {filtered.length} of {total}
              </span>
              {hasMore && (
                <Button
                  variant="secondary"
                  onClick={() => fetchPage(false)}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────

function ProjectCard({
  p,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpen,
  onDelete,
}: {
  p: ProjectListItem
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <div
      onClick={onOpen}
      className="group relative text-left rounded-2xl p-6 transition-all cursor-pointer"
      style={{
        background: 'var(--paper-2)',
        border: '1px solid var(--line)',
        boxShadow: '0 1px 1px rgba(15,14,12,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 1px rgba(15,14,12,0.06), 0 14px 30px -10px rgba(15,14,12,0.14)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 1px rgba(15,14,12,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Kebab menu — hover-reveal in the top-right corner */}
      <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleMenu}
          className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          style={{ color: 'var(--ink-muted)', background: menuOpen ? 'rgba(10,9,7,0.06)' : 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
            e.currentTarget.style.color = 'var(--ink-strong)'
          }}
          onMouseLeave={(e) => {
            if (!menuOpen) e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--ink-muted)'
          }}
          aria-label="Project options"
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-9 rounded-xl py-1.5 w-40 shadow-lift"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
          >
            <button
              onClick={() => { onOpen(); onCloseMenu() }}
              className="w-full text-left px-3.5 py-2 text-[13px] transition-colors"
              style={{ color: 'var(--ink)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Open
            </button>
            <button
              onClick={onDelete}
              className="w-full text-left px-3.5 py-2 text-[13px] transition-colors"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--ink-strong)', color: '#fff' }}
        >
          <FolderKanban size={16} />
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <p
            className="font-serif text-[18px] leading-tight tracking-tighter truncate"
            style={{ color: 'var(--ink-strong)' }}
          >
            {p.name}
          </p>
          <span className="eyebrow">{timeAgo(p.updated_at)}</span>
        </div>
        {p.status !== 'active' && (
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide"
            style={{
              background: p.status === 'archived' ? 'rgba(10,9,7,0.06)' : 'var(--accent-soft)',
              color: p.status === 'archived' ? 'var(--ink-muted)' : 'var(--accent)',
            }}
          >
            {p.status}
          </span>
        )}
      </div>

      {p.description && (
        <p
          className="text-[13px] leading-relaxed mb-4 line-clamp-2"
          style={{ color: 'var(--ink-soft)' }}
        >
          {p.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-[12px]" style={{ color: 'var(--ink-muted)' }}>
        <span className="inline-flex items-center gap-1.5">
          <FileText size={12} />
          {p.document_count} {p.document_count === 1 ? 'doc' : 'docs'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles size={12} />
          {p.presentation_count} {p.presentation_count === 1 ? 'deck' : 'decks'}
        </span>
      </div>

      {p.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: 'var(--surface)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Create modal ─────────────────────────────────────────────────────────────

function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (p: ProjectListItem) => void
}) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Name required')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await projectsApi.create({
        name: name.trim(),
        description: description.trim(),
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      })
      onCreated(data)
    } catch (e: any) {
      toast.error('Could not create project', e?.response?.data?.detail ?? e?.message ?? '')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,9,7,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl"
        style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--line)' }}>
          <h2 className="font-serif text-[22px] tracking-tighter" style={{ color: 'var(--ink-strong)' }}>
            New project
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--ink-muted)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="eyebrow mb-2 block">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Internal CRM Refresh"
              className="w-full px-3 h-10 rounded-xl text-[13px] outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
            />
          </div>
          <div>
            <label className="eyebrow mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-[13px] outline-none resize-none leading-relaxed"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
            />
          </div>
          <div>
            <label className="eyebrow mb-2 block">Tags <span style={{ color: 'var(--ink-faint)' }}>(comma-separated)</span></label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="crm, internal, 2026-h2"
              className="w-full px-3 h-10 rounded-xl text-[13px] outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
            />
          </div>
        </div>

        <div
          className="px-6 py-4 flex items-center justify-end gap-2"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </div>
    </div>
  )
}
