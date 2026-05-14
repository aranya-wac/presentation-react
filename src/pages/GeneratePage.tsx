import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { generationApi } from '../api/client'
import { AppLayout } from '../components/Layout/AppLayout'
import type { GenerationStatusResponse } from '../types'
import { Sparkles } from 'lucide-react'

export function GeneratePage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<GenerationStatusResponse | null>(null)

  useEffect(() => {
    if (!jobId) return
    const poll = setInterval(async () => {
      try {
        const { data } = await generationApi.status(jobId)
        setStatus(data)
        if (data.status === 'completed' && data.presentation_id) {
          clearInterval(poll)
          setTimeout(() => navigate(`/presentations/${data.presentation_id}`), 800)
        }
        if (data.status === 'failed') {
          clearInterval(poll)
        }
      } catch {
        clearInterval(poll)
      }
    }, 2000)
    return () => clearInterval(poll)
  }, [jobId, navigate])

  const progress = status?.progress ?? 0
  const statusLabel: Record<string, string> = {
    pending: 'Preparing your presentation...',
    processing: 'Generating slides...',
    completed: 'Done! Redirecting...',
    failed: 'Generation failed',
  }

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        {/* Animated icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-200">
            <Sparkles size={32} className="text-white animate-pulse" />
          </div>
          {status?.status === 'processing' && (
            <div className="absolute -inset-2 rounded-3xl border-2 border-purple-300 animate-ping opacity-30" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Generating your presentation
        </h1>
        <p className="text-gray-500 text-sm mb-10 text-center max-w-xs">
          {status ? statusLabel[status.status] ?? 'Working on it...' : 'This typically takes 30–60 seconds.'}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-sm">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>{status?.status === 'completed' ? 'Complete' : 'In progress'}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {status?.status === 'failed' && (
          <div className="mt-8 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 max-w-sm text-center">
            {status.error_message ?? 'Something went wrong. Please try again.'}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
