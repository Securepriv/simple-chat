'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store'
import type { User } from '@/types'

export function useAuth() {
  const { user, loading, setUser, setLoading, signOut } = useAuthStore()
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (profile) {
          setUser(profile as User)
          // ✅ Cast explicite pour éviter l'erreur TypeScript
          await supabase
            .from('users')
            .update({ status: 'online' } as any)
            .eq('id', session.user.id)
        }
      }
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (profile) {
            setUser(profile as User)
            // ✅ Cast explicite pour éviter l'erreur TypeScript
            await supabase
              .from('users')
              .update({ status: 'online' } as any)
              .eq('id', session.user.id)
          }
          router.push('/chat')
        }
        if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/login')
        }
      }
    )

    const handleUnload = async () => {
      const u = useAuthStore.getState().user
      if (u) {
        await supabase
          .from('users')
          .update({
            status: 'offline',
            last_seen: new Date().toISOString()
          } as any)
          .eq('id', u.id)
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, []) // eslint-disable-line

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
