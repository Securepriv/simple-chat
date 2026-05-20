'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useConversationsStore, useAuthStore } from '@/store'
import type { Conversation, User } from '@/types'

export function useConversations() {
  const supabase = getSupabaseClient()
  const db = supabase as any
  const { user } = useAuthStore()
  const { 
    conversations, 
    activeConversationId, 
    loading, 
    setConversations, 
    setActiveConversation, 
    updateConversation, 
    addConversation, 
    setLoading 
  } = useConversationsStore()
  
  // Référence pour stocker les conversations actuelles (évite les fermetures)
  const conversationsRef = useRef(conversations)
  conversationsRef.current = conversations

  // Référence pour le channel Realtime
  const channelRef = useRef<any>(null)
  
  // ✅ State pour tracker le channel ID valide
  const validChannelIdRef = useRef<string | null>(null)

  // Chargement initial des conversations
  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      setLoading(true)
      
      try {
        // Récupérer les conversations de l'utilisateur
        const { data: memberRows, error: memberError } = await db
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', user.id)

        if (memberError) throw memberError

        if (!memberRows?.length) {
          setConversations([])
          setLoading(false)
          return
        }

        const convIds = memberRows.map((r: any) => r.conversation_id)
        const enriched: Conversation[] = []

        for (const convId of convIds) {
          // Récupérer l'autre utilisateur
          const { data: members } = await db
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', convId)
            .neq('user_id', user.id)

          const otherUserId = members?.[0]?.user_id
          if (!otherUserId) continue

          const { data: otherUser } = await db
            .from('users')
            .select('*')
            .eq('id', otherUserId)
            .single()

          // Récupérer le dernier message
          const { data: lastMessages } = await db
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .eq('deleted_for_everyone', false)
            .order('created_at', { ascending: false })
            .limit(1)

          // Compter les messages non lus
          const { count: unreadCount } = await db
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .neq('sender_id', user.id)
            .eq('is_seen', false)

          enriched.push({
            id: convId,
            created_at: new Date().toISOString(),
            other_user: otherUser as User,
            last_message: lastMessages?.[0] || null,
            unread_count: unreadCount || 0
          })
        }

        // Trier par date du dernier message
        enriched.sort((a, b) =>
          new Date(b.last_message?.created_at || b.created_at).getTime() -
          new Date(a.last_message?.created_at || a.created_at).getTime()
        )
        
        setConversations(enriched)
      } catch (error) {
        console.error('Error loading conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [user?.id, setConversations, setLoading])

  // Configuration du Realtime pour les nouveaux messages
  useEffect(() => {
    if (!user) return

    // ✅ Générer un ID unique pour ce channel
    const currentChannelId = `conv-updates-${user.id}-${Date.now()}`
    validChannelIdRef.current = currentChannelId

    // ✅ Nettoyer l'ancien channel s'il existe
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current)
      } catch (error) {
        console.error('Error removing old channel:', error)
      }
      channelRef.current = null
    }

    // ✅ Créer le channel SANS chaîner les méthodes
    const channel = supabase.channel(`conv-updates-${user.id}`, {
      config: {
        broadcast: { self: false }
      }
    })

    // ✅ Créer un wrapper pour vérifier que ce channel est valide
    const isValidChannel = () => validChannelIdRef.current === currentChannelId

    // ✅ Ajouter le callback INSERT
    channel.on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, 
      (payload) => {
        if (!isValidChannel()) return

        const newMessage = payload.new as any
        const conversation = conversationsRef.current.find(
          (c) => c.id === newMessage.conversation_id
        )
        
        if (!conversation) return

        const isUnread = newMessage.sender_id !== user.id
        updateConversation(newMessage.conversation_id, {
          last_message: newMessage,
          unread_count: isUnread
            ? (conversation.unread_count || 0) + 1
            : conversation.unread_count
        })
      }
    )

    // ✅ Ajouter le callback UPDATE
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `is_seen=eq.true`
      },
      (payload) => {
        if (!isValidChannel()) return

        const updatedMessage = payload.new as any
        const conversation = conversationsRef.current.find(
          (c) => c.id === updatedMessage.conversation_id
        )
        
        if (conversation && updatedMessage.sender_id !== user.id) {
          updateConversation(updatedMessage.conversation_id, {
            unread_count: Math.max(0, (conversation.unread_count || 0) - 1)
          })
        }
      }
    )

    // ✅ Subscribe UNE SEULE FOIS, avec callback
    const subscription = channel.subscribe((status) => {
      if (!isValidChannel()) return

      if (status === 'SUBSCRIBED') {
        console.log(`✅ Realtime connected for user ${user.id}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Realtime error for user ${user.id}`)
      } else if (status === 'CLOSED') {
        console.log(`⚠️ Channel closed for user ${user.id}`)
      }
    })

    channelRef.current = channel

    // ✅ Cleanup: marquer comme invalide et désincrire
    return () => {
      validChannelIdRef.current = null
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current)
        } catch (error) {
          console.error('Error in cleanup:', error)
        }
        channelRef.current = null
      }
    }
  }, [user?.id, updateConversation])

  // Ouvrir ou créer une conversation avec un utilisateur
  const openConversationWith = useCallback(async (otherUser: User) => {
    if (!user) return null

    try {
      const { data: convId, error } = await db.rpc('get_or_create_conversation', {
        user_a: user.id,
        user_b: otherUser.id
      })

      if (error || !convId) {
        console.error('Error creating conversation:', error)
        return null
      }

      // Vérifier si la conversation existe déjà dans le store
      const existingConversation = conversations.find((c) => c.id === convId)
      
      if (!existingConversation) {
        // Ajouter la nouvelle conversation
        addConversation({
          id: convId,
          created_at: new Date().toISOString(),
          other_user: otherUser,
          last_message: null,
          unread_count: 0
        })
      }

      setActiveConversation(convId)
      return convId
    } catch (error) {
      console.error('Error in openConversationWith:', error)
      return null
    }
  }, [user, conversations, addConversation, setActiveConversation])

  // Rechercher des utilisateurs
  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    if (!query.trim() || !user) return []

    try {
      const { data, error } = await db
        .from('users')
        .select('*')
        .neq('id', user.id)
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)

      if (error) throw error
      return (data as User[]) || []
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }, [user])

  // Marquer les messages comme lus dans une conversation
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!user) return

    try {
      const { error } = await db
        .from('messages')
        .update({ is_seen: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_seen', false)

      if (error) throw error

      // Mettre à jour le compteur local
      updateConversation(conversationId, { unread_count: 0 })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [user, updateConversation])

  return {
    conversations,
    activeConversationId,
    loading,
    setActiveConversation,
    openConversationWith,
    searchUsers,
    markConversationAsRead
  }
}
