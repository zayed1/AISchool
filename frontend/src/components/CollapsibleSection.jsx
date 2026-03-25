// #16 — Collapsible report section wrapper
import { useState } from 'react'

function CollapsibleSection({ id, title, icon, children, defaultOpen = true, primary = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div id={id} className={`bg-white dark:bg-slate-800 rounded-xl border ${primary ? 'border-primary-200 dark:border-primary-800' : 'border-slate-200 dark:border-slate-700'} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-right transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500`}
        aria-expanded={open}
      >
        <h3 className={`flex items-center gap-2 font-bold ${primary ? 'text-lg text-slate-800 dark:text-slate-100' : 'text-base text-slate-700 dark:text-slate-200'}`}>
          {icon && <span className="text-primary-500">{icon}</span>}
          {title}
        </h3>
        <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {children}
        </div>
      )}
    </div>
  )
}

export default CollapsibleSection
