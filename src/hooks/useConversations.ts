'use client'
import { useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useConversationsStore, useAuthStore } from '@/store'
import type { Conversation, User } from '@/types'

export function useConversations() {
  const supabase = getSupabaseClient()
  const { user } = useAuthStore()
  const { conversations, activeConversationId, loading, setConversations, setActiveConversation, updateConversation, addConversation, setLoading } = useConversationsStore()

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data: memberRows } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id)
      if (!memberRows?.length) { setConversations([]); setLoading(false); return }
      const convIds = memberRows.map((r) => r.conversation_id)
      const enriched: Conversation[] = []
      for (const convId of convIds) {
        const { data: members } = await supabase.from('conversation_members').select('user_id').eq('conversation_id', convId).neq('user_id', user.id)
        const otherUserId = members?.[0]?.user_id
        if (!otherUserId) continue
        const { data: otherUser } = await supabase.from('users').select('*').eq('id', otherUserId).single()
        const { data: lastMessages } = await supabase.from('messages').select('*').eq('conversation_id', convId).eq('deleted_for_everyone', false).order('created_at', { ascending: false }).limit(1)
        const { count: unreadCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', convId).neq('sender_id', user.id).eq('is_seen', false)
        enriched.push({ id: convId, created_at: new Date().toISOString(), other_user: otherUser as User, last_message: lastMessages?.[0] || null, unread_count: unreadCount || 0 })
      }
      enriched.sort((a, b) => new Date(b.last_message?.created_at || b.created_at).getTime() - new Date(a.last_message?.created_at || a.created_at).getTime())
      setConversations(enriched); setLoading(false)
    }
    load()
  }, [user?.id]) // eslint-disable-line

  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('conv-updates').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      const newMsg = payload.new
      const conv = conversations.find((c) => c.id === newMsg.conversation_id)
      if (!conv) return
      updateConversation(newMsg.conversation_id, { last_message: newMsg, unread_count: newMsg.sender_id !== user.id ? (conv.unread_count || 0) + 1 : conv.unread_count })
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, conversations]) // eslint-disable-line

  const openConversationWith = useCallback(async (otherUser: User) => {
    if (!user) return null
    const { data: convId, error } = await supabase.rpc('get_or_create_conversation', { user_a: user.id, user_b: otherUser.id })
    if (error || !convId) return null
    const existing = conversations.find((c) => c.id === convId)
    if (!existing) addConversation({ id: convId, created_at: new Date().toISOString(), other_user: otherUser, last_message: null, unread_count: 0 })
    setActiveConversation(convId)
    return convId
  }, [user, conversations]) // eslint-disable-line

  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    if (!query.trim() || !user) return []
    const { data } = await supabase.from('users').select('*').neq('id', user.id).or(`username.ilike.%${query}%,email.ilike.%${query}%`).limit(10)
    return (data as User[]) || []
  }, [user]) // eslint-disable-line

  return { conversations, activeConversationId, loading, setActiveConversation, openConversationWith, searchUsers }
}
