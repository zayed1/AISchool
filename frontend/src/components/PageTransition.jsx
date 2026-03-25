// #1 — Page transition wrapper with fade animation
import { useState, useEffect } from 'react'

function PageTransition({ children, viewKey }) {
  const [visible, setVisible] = useState(false)
  const [content, setContent] = useState(children)

  useEffect(() => {
    setVisible(false)
    const timer = setTimeout(() => {
      setContent(children)
      setVisible(true)
    }, 150)
    return () => clearTimeout(timer)
  }, [viewKey])

  // Check reduced motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
     localStorage.getItem('reduced_motion') === 'true')

  if (prefersReduced) return <>{children}</>

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      {content}
    </div>
  )
}

export default PageTransition
