'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store'
import type { User } from '@/types'

export function useAuth() {
  const { user, loading, setUser, setLoading, signOut } = useAuthStore()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const db = supabase as any
  const initRef = useRef(false)

  useEffect(() => {
    // ✅ Éviter les double initialisations en Strict Mode
    if (initRef.current) return
    initRef.current = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profile) {
            setUser(profile as User)
            try {
              await db.from('users')
                .update({ status: 'online' })
                .eq('id', session.user.id)
            } catch (e) {
              console.error('Error updating status:', e)
            }
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error in auth init:', error)
        setUser(null)
      } finally {
        // ✅ TOUJOURS appeler setLoading(false)
        setLoading(false)
      }
    }

    init()

    // ✅ Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (profile) {
              setUser(profile as User)
              try {
                await db.from('users')
                  .update({ status: 'online' })
                  .eq('id', session.user.id)
              } catch (e) {
                console.error('Error updating status:', e)
              }
            }
            router.push('/chat')
          } catch (error) {
            console.error('Error in SIGNED_IN:', error)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/login')
        }
      }
    )

    const handleUnload = async () => {
      const u = useAuthStore.getState().user
      if (u) {
        try {
          await db.from('users')
            .update({ status: 'offline', last_seen: new Date().toISOString() })
            .eq('id', u.id)
        } catch (e) {
          console.error('Error in unload:', e)
        }
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    
    return () => {
      subscription?.unsubscribe()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const register = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      },
    })
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })
    if (error) throw error
  }

  return { user, loading, login, register, resetPassword, signOut }
}
