import { useCallback, useEffect, useRef, useState } from 'react'
import type { Slide } from '../types'

const MAX_HISTORY = 50
// Within this window, two updates that touch the same "edit key" are merged
// into a single history entry (so one typing burst = one undo step).
const MERGE_WINDOW_MS = 600

type Updater = Slide[] | ((prev: Slide[]) => Slide[])

interface HistoryEntry {
  slides: Slide[]
  /** Optional key identifying what was edited (e.g. block id). Consecutive
   *  edits with the same key within MERGE_WINDOW_MS collapse to one entry. */
  mergeKey?: string
  ts: number
}

interface UseSlideHistoryOptions {
  /** Called whenever the slides change (any source: user edit, undo, redo).
   *  Use this to drive autosave. */
  onChange?: (next: Slide[]) => void
}

export interface SlideHistoryAPI {
  slides: Slide[]
  /** Replace slides. Pass `mergeKey` for granular edits (e.g. typing a block).
   *  Pass `replace: true` to overwrite history (e.g. on initial load). */
  setSlides: (updater: Updater, opts?: { mergeKey?: string; replace?: boolean }) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** Replace history entirely without recording (e.g. after loading from server). */
  resetTo: (slides: Slide[]) => void
}

export function useSlideHistory(initial: Slide[] = [], opts: UseSlideHistoryOptions = {}): SlideHistoryAPI {
  // We hold history in refs so successive sync setSlides calls can see the
  // latest stack (React batches setState — refs don't).
  const pastRef = useRef<HistoryEntry[]>([])
  const futureRef = useRef<HistoryEntry[]>([])
  const [slides, setSlidesState] = useState<Slide[]>(initial)
  const [, force] = useState(0)
  const rerender = useCallback(() => force((n) => n + 1), [])

  const onChangeRef = useRef(opts.onChange)
  onChangeRef.current = opts.onChange

  const apply = useCallback((next: Slide[]) => {
    setSlidesState(next)
    onChangeRef.current?.(next)
  }, [])

  const setSlides = useCallback<SlideHistoryAPI['setSlides']>((updater, options) => {
    setSlidesState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Slide[]) => Slide[])(prev) : updater
      // No-op skip: object reference equality avoids dead history entries
      // when an early-return setSlides happens to return the same array.
      if (next === prev) return prev

      if (options?.replace) {
        // Don't record (used for initial load / external set).
        onChangeRef.current?.(next)
        return next
      }

      const top = pastRef.current[pastRef.current.length - 1]
      const now = Date.now()
      const canMerge =
        top &&
        options?.mergeKey &&
        top.mergeKey === options.mergeKey &&
        now - top.ts < MERGE_WINDOW_MS

      if (canMerge && top) {
        // Replace the snapshot in place — keep mergeKey/ts fresh so further
        // edits in the same burst keep merging.
        top.slides = prev   // <- preserve the state BEFORE this edit
        top.ts = now
      } else {
        pastRef.current.push({ slides: prev, mergeKey: options?.mergeKey, ts: now })
        if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift()
      }
      // Any new edit invalidates redo.
      if (futureRef.current.length) futureRef.current = []

      onChangeRef.current?.(next)
      rerender()
      return next
    })
  }, [rerender])

  const undo = useCallback(() => {
    const entry = pastRef.current.pop()
    if (!entry) return
    setSlidesState((curr) => {
      futureRef.current.push({ slides: curr, ts: Date.now() })
      apply(entry.slides)
      return entry.slides
    })
    rerender()
  }, [apply, rerender])

  const redo = useCallback(() => {
    const entry = futureRef.current.pop()
    if (!entry) return
    setSlidesState((curr) => {
      pastRef.current.push({ slides: curr, ts: Date.now() })
      if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift()
      apply(entry.slides)
      return entry.slides
    })
    rerender()
  }, [apply, rerender])

  const resetTo = useCallback((next: Slide[]) => {
    pastRef.current = []
    futureRef.current = []
    setSlidesState(next)
    onChangeRef.current?.(next)
  }, [])

  // Global keyboard bindings — Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z (or Ctrl+Y).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      // Don't hijack browser undo inside text inputs / editable elements —
      // contentEditable slide blocks should keep native undo behavior. We only
      // intercept when the focused element is not editable.
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        const isField =
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.isContentEditable
        if (isField) return
      }
      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          e.preventDefault()
          redo()
        } else {
          e.preventDefault()
          undo()
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  return {
    slides,
    setSlides,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    resetTo,
  }
}
