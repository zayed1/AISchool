import { useRef, useCallback } from 'react'

// #3 — Debounce hook
export function useDebounce(fn, delay = 150) {
  const timerRef = useRef(null)

  return useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

// #3 — Debounced word count
export function countWords(text) {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}
