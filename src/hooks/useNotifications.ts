'use client'

import { useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store'

export function useNotifications() {
  const { user } = useAuthStore()
  const permissionRef = useRef<NotificationPermission>('default')
  const supabase = getSupabaseClient()
  // ✅ Cast pour bypasser les conflits de types Supabase SSR
  const db = supabase as any

  // Demander la permission au montage
  useEffect(() => {
    if (!('Notification' in window)) return

    if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        permissionRef.current = perm
      })
    } else {
      permissionRef.current = Notification.permission
    }
  }, [])

  // Écouter les nouveaux messages pour toutes les conversations de l'utilisateur
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const msg = payload.new as any

          // Ne pas notifier ses propres messages
          if (msg.sender_id === user.id) return

          // Vérifier que la fenêtre n'est pas au premier plan
          if (document.visibilityState === 'visible') return

          // Vérifier la permission
          if (permissionRef.current !== 'granted') return

          // ✅ Utilise db au lieu de supabase
          const { data: sender } = await db
            .from('users')
            .select('username')
            .eq('id', msg.sender_id)
            .single()

          const senderName = sender?.username || 'Quelqu\'un'
          const body = msg.message_type === 'image'
            ? '📷 Vous a envoyé une photo'
            : msg.message_type === 'file'
            ? `📎 ${msg.file_name || 'Fichier partagé'}`
            : msg.content?.slice(0, 100) || 'Nouveau message'

          const notification = new Notification(`MessageApp — ${senderName}`, {
            body,
            icon: '/icon.png',
            badge: '/badge.png',
            tag: msg.conversation_id,
            renotify: true,
          })

          notification.onclick = () => {
            window.focus()
            notification.close()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
}
