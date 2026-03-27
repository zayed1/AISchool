// #84 — Enhanced page transition with direction-aware animations
import { useState, useEffect, useRef } from 'react'

function PageTransition({ children, viewKey }) {
  const [visible, setVisible] = useState(true)
  const [content, setContent] = useState(children)
  const prevKey = useRef(viewKey)
  const isFirstRender = useRef(true)

  const prefersReduced =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
     localStorage.getItem('reduced_motion') === 'true')

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const goingToReport = viewKey === 'report'
    const goingHome = viewKey === 'home'

    // Phase 1: Fade out current content
    setVisible(false)

    const timer = setTimeout(() => {
      setContent(children)
      prevKey.current = viewKey
      // Phase 2: Fade in new content
      requestAnimationFrame(() => setVisible(true))
    }, goingToReport ? 200 : 150)

    return () => clearTimeout(timer)
  }, [viewKey])

  if (prefersReduced) return <>{children}</>

  const goingToReport = viewKey === 'report'

  return (
    <div
      className={`transition-all ease-out ${
        visible
          ? 'opacity-100 translate-y-0 scale-100 duration-400'
          : goingToReport
          ? 'opacity-0 -translate-y-2 scale-[0.98] duration-200'
          : 'opacity-0 translate-y-3 scale-100 duration-150'
      }`}
    >
      {content}
    </div>
  )
}

export default PageTransition
