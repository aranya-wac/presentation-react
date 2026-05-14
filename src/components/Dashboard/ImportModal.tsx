import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { importApi } from '../../api/client'
import { Upload, X, AlertCircle, Loader2, Check } from 'lucide-react'

interface ImportModalProps {
  onClose: () => void
}

export function ImportModal({ onClose }: ImportModalProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File) => {
    setError(null)
    if (!f.name.toLowerCase().endsWith('.pptx')) {
      setError('Only .pptx files are supported.')
      return
    }
    setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await importApi.importPptx(file)
      navigate(`/presentations/${data.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Import failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,9,7,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-3xl w-full max-w-md overflow-hidden"
        style={{
          background: 'var(--paper)',
          boxShadow: '0 2px 4px rgba(15,14,12,0.08), 0 28px 56px -12px rgba(15,14,12,0.30)',
        }}
      >
        {/* Header */}
        <div
          className="px-7 pt-7 pb-5 flex items-start justify-between"
          style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--line)' }}
        >
          <div>
            <p className="eyebrow mb-2">— Import</p>
            <h2
              className="font-serif text-[26px] leading-tight tracking-tighter"
              style={{ color: 'var(--ink-strong)' }}
            >
              Bring a deck in.
            </h2>
            <p className="text-[12.5px] mt-1" style={{ color: 'var(--ink-soft)' }}>
              Upload a .pptx file to edit in Deck Studio.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: 'var(--ink-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
              e.currentTarget.style.color = 'var(--ink-strong)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--ink-muted)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-7">
          {/* Drop zone */}
          <div
            className="relative rounded-2xl transition-all cursor-pointer"
            style={{
              border: dragging
                ? '2px dashed var(--ink-strong)'
                : file
                ? '2px solid var(--ink-strong)'
                : '2px dashed var(--line-strong)',
              background: dragging
                ? 'rgba(10,9,7,0.04)'
                : file
                ? 'var(--surface)'
                : 'var(--surface)',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !loading && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pptx"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              {file ? (
                <>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: 'var(--ink-strong)' }}
                  >
                    <Check size={20} style={{ color: '#fff' }} />
                  </div>
                  <p
                    className="font-serif text-[16px] tracking-tighter truncate max-w-[260px]"
                    style={{ color: 'var(--ink-strong)' }}
                  >
                    {file.name}
                  </p>
                  <p className="eyebrow mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    className="mt-3 text-[12px] font-semibold underline-offset-4 hover:underline transition-colors flex items-center gap-1"
                    style={{ color: 'var(--ink-soft)' }}
                    onClick={(e) => { e.stopPropagation(); setFile(null); setError(null) }}
                  >
                    <X size={11} />
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
                  >
                    <Upload size={20} style={{ color: 'var(--ink-strong)' }} />
                  </div>
                  <p
                    className="font-serif text-[18px] tracking-tighter"
                    style={{ color: 'var(--ink-strong)' }}
                  >
                    Drop your .pptx here
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--ink-soft)' }}>
                    or click to browse · max 50 MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Notice */}
          <div className="flex items-center gap-2 mt-4">
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: 'var(--ink-faint)' }}
            />
            <p className="text-[11.5px]" style={{ color: 'var(--ink-muted)' }}>
              Only PowerPoint (.pptx) files are accepted.
            </p>
          </div>

          {error && (
            <div
              className="mt-4 flex items-start gap-2 px-3.5 py-3 rounded-xl"
              style={{ background: 'var(--accent-soft)', border: "1px solid var(--line)" }}
            >
              <AlertCircle size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
              <p className="text-[12.5px]" style={{ color: 'var(--accent)' }}>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-7">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 rounded-full text-[13px] font-semibold transition-colors disabled:opacity-40"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink-strong)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="flex-1 h-11 rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: file && !loading ? 'var(--ink-strong)' : 'rgba(10,9,7,0.15)',
                color: '#fff',
                cursor: file && !loading ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (file && !loading) e.currentTarget.style.background = '#2A2620'
              }}
              onMouseLeave={(e) => {
                if (file && !loading) e.currentTarget.style.background = 'var(--ink-strong)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload size={13} />
                  Import & edit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
