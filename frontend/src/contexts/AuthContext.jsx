import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

const API_URL = import.meta.env.VITE_API_URL || ''
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [plan, setPlan] = useState({ plan: 'free', plan_name: 'مجاني', usage_today: 0, daily_limit: 10, max_words: 1000, features: [], authenticated: false })
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState(null)

  // Initialize Supabase client
  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setLoading(false)
      return
    }
    import('@supabase/supabase-js').then(({ createClient }) => {
      const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      setSupabase(sb)

      sb.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s)
        setUser(s?.user || null)
        setLoading(false)
      })

      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, s) => {
        setSession(s)
        setUser(s?.user || null)
      })

      return () => subscription.unsubscribe()
    })
  }, [])

  // Fetch plan status when user changes
  const refreshPlan = useCallback(async () => {
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`${API_URL}/api/billing/status`, { headers })
      if (res.ok) {
        const data = await res.json()
        setPlan(data)
      }
    } catch {}
  }, [session])

  useEffect(() => {
    refreshPlan()
  }, [refreshPlan])

  const signInWithGoogle = async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const signInWithEmail = async (email, password) => {
    if (!supabase) throw new Error('Supabase غير متاح')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUpWithEmail = async (email, password) => {
    if (!supabase) throw new Error('Supabase غير متاح')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setPlan({ plan: 'free', plan_name: 'مجاني', usage_today: 0, daily_limit: 10, max_words: 1000, features: [], authenticated: false })
  }

  const getAuthHeaders = () => {
    if (!session?.access_token) return {}
    return { Authorization: `Bearer ${session.access_token}` }
  }

  return (
    <AuthContext.Provider value={{
      user, session, plan, loading, supabase,
      signInWithGoogle, signInWithEmail, signUpWithEmail, signOut,
      getAuthHeaders, refreshPlan,
      isAuthenticated: !!user,
      isPro: plan.plan === 'pro' || plan.plan === 'enterprise',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
