'use client'
import { useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useMessagesStore, useAuthStore } from '@/store'
import type { Message, SendMessagePayload } from '@/types'

export function useMessages(conversationId: string | null) {
  const supabase = getSupabaseClient()
  const { user } = useAuthStore()
  const { messages, loading, typingUsers, setMessages, addMessage, updateMessage, removeMessage, addTypingUser, removeTypingUser, setLoading } = useMessagesStore()
  const typingTimeout = useRef<NodeJS.Timeout | null>(null)
  const conversationMessages = conversationId ? (messages[conversationId] || []) : []

  useEffect(() => {
    if (!conversationId) return
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('messages').select('*, sender:users(*)').eq('conversation_id', conversationId).eq('deleted_for_everyone', false).order('created_at', { ascending: true }).limit(50)
      if (!error && data) setMessages(conversationId, data as Message[])
      setLoading(false)
    }
    load()
  }, [conversationId]) // eslint-disable-line

  useEffect(() => {
    if (!conversationId || !user) return
    const markReceived = async () => {
      await supabase.from('messages').update({ is_received: true }).eq('conversation_id', conversationId).neq('sender_id', user.id).eq('is_received', false)
    }
    const markSeen = async () => {
      if (document.visibilityState === 'visible') {
        await supabase.from('messages').update({ is_seen: true }).eq('conversation_id', conversationId).neq('sender_id', user.id).eq('is_received', true).eq('is_seen', false)
      }
    }
    markReceived(); markSeen()
    const onVisible = () => { if (document.visibilityState === 'visible') markSeen() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [conversationId, conversationMessages.length]) // eslint-disable-line

  useEffect(() => {
    if (!conversationId) return
    const channel = supabase.channel(`msgs:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, async (payload) => {
        const newMsg = payload.new as Message
        const { data: sender } = await supabase.from('users').select('*').eq('id', newMsg.sender_id).single()
        addMessage(conversationId, { ...newMsg, sender: sender || undefined })
        if (user && newMsg.sender_id !== user.id) {
          await supabase.from('messages').update({ is_received: true, is_seen: document.visibilityState === 'visible' }).eq('id', newMsg.id)
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const updated = payload.new as Message
        if (updated.deleted_for_everyone) removeMessage(conversationId, updated.id)
        else updateMessage(conversationId, updated.id, updated)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_status', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        if (!user) return
        const typing = payload.new as { user_id: string; is_typing: boolean }
        if (typing.user_id === user.id) return
        if (typing.is_typing) addTypingUser(conversationId, typing.user_id)
        else removeTypingUser(conversationId, typing.user_id)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, user?.id]) // eslint-disable-line

  const sendMessage = useCallback(async (payload: SendMessagePayload) => {
    if (!user) return
    const { error } = await supabase.from('messages').insert({ ...payload, sender_id: user.id, message_type: payload.message_type || 'text' })
    if (error) throw error
    await supabase.from('typing_status').upsert({ conversation_id: payload.conversation_id, user_id: user.id, is_typing: false })
  }, [user]) // eslint-disable-line

  const deleteForMe = useCallback(async (messageId: string) => {
    if (!user || !conversationId) return
    await supabase.from('deleted_messages').insert({ message_id: messageId, user_id: user.id })
    removeMessage(conversationId, messageId)
  }, [user, conversationId]) // eslint-disable-line

  const deleteForEveryone = useCallback(async (message: Message) => {
    if (!user || message.sender_id !== user.id) return
    if (message.is_seen) throw new Error('Message déjà vu')
    await supabase.from('messages').update({ deleted_for_everyone: true }).eq('id', message.id)
  }, [user]) // eslint-disable-line

  const clearConversation = useCallback(async () => {
    if (!user || !conversationId) return
    const msgs = messages[conversationId] || []
    if (!msgs.length) return
    await supabase.from('deleted_messages').upsert(msgs.map((m) => ({ message_id: m.id, user_id: user.id })))
    setMessages(conversationId, [])
  }, [user, conversationId, messages]) // eslint-disable-line

  const handleTyping = useCallback(() => {
    if (!user || !conversationId) return
    supabase.from('typing_status').upsert({ conversation_id: conversationId, user_id: user.id, is_typing: true })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      supabase.from('typing_status').upsert({ conversation_id: conversationId, user_id: user.id, is_typing: false })
    }, 2000)
  }, [user, conversationId]) // eslint-disable-line

  return { messages: conversationMessages, loading, typingUserIds: conversationId ? (typingUsers[conversationId] || []) : [], sendMessage, deleteForMe, deleteForEveryone, clearConversation, handleTyping }
}
