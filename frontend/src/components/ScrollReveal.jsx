// #10 — Scroll reveal wrapper with #15 reduced motion support
import { useScrollReveal } from '../hooks/useUtilities'

function ScrollReveal({ children, className = '', delay = 0 }) {
  const [ref, isVisible] = useScrollReveal()

  // #15 — Check reduced motion preference (CSS + user setting)
  const prefersReduced =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
     localStorage.getItem('reduced_motion') === 'true')

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default ScrollReveal
