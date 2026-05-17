'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store'
import { UserAvatar } from '@/components/ui/UserAvatar'
import type { User } from '@/types'

export default function AdminPage() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [stats, setStats] = useState({ messages: 0, conversations: 0, users: 0 })
  const supabase = getSupabaseClient()

  // Charger les données
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    // Utilisateurs
    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersData) setUsers(usersData as User[])

    // Stats
    const [{ count: msgCount }, { count: convCount }] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('conversations').select('*', { count: 'exact', head: true }),
    ])

    setStats({
      messages: msgCount || 0,
      conversations: convCount || 0,
      users: usersData?.length || 0,
    })

    setLoading(false)
  }

  // Supprimer tous les messages
  const handleClearAllMessages = async () => {
    setActionLoading('clear')
    try {
      await supabase.rpc('admin_clear_all_messages')
      setStats((s) => ({ ...s, messages: 0 }))
      setConfirmClear(false)
      alert('Tous les messages ont été supprimés.')
    } catch (err) {
      alert('Erreur lors de la suppression.')
    } finally {
      setActionLoading(null)
    }
  }

  // Bannir un utilisateur (suppression du compte)
  const handleBanUser = async (userId: string, username: string) => {
    if (!confirm(`Bannir "${username}" ? Cette action est irréversible.`)) return
    setActionLoading(userId)
    try {
      // Supprimer le profil (la suppression de auth.users nécessite le service role)
      await supabase.from('users').delete().eq('id', userId)
      setUsers((u) => u.filter((user) => user.id !== userId))
      setStats((s) => ({ ...s, users: s.users - 1 }))
    } catch (err) {
      alert('Erreur lors du bannissement.')
    } finally {
      setActionLoading(null)
    }
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-[#111b21] text-white">
      {/* Header */}
      <div className="bg-[#202c33] border-b border-[#2a3942] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/chat"
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-[#aebac1]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </a>
          <h1 className="text-white font-semibold text-lg">Administration</h1>
        </div>
        <button
          onClick={loadData}
          className="text-[#aebac1] hover:text-white transition-colors text-sm flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          Actualiser
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Utilisateurs', value: stats.users, icon: '👥', color: '#25d366' },
            { label: 'Conversations', value: stats.conversations, icon: '💬', color: '#53bdeb' },
            { label: 'Messages', value: stats.messages, icon: '✉️', color: '#f7b731' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#202c33] rounded-xl p-5 border border-[#2a3942]"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value.toLocaleString()}
              </div>
              <div className="text-[#aebac1] text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Actions dangereuses */}
        <div className="bg-[#202c33] rounded-xl border border-[#2a3942] p-6 mb-8">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-red-400">⚠️</span> Actions administratives
          </h2>

          <div className="flex items-center justify-between py-3 border-b border-[#2a3942]">
            <div>
              <p className="text-white text-sm font-medium">Supprimer tous les messages</p>
              <p className="text-[#aebac1] text-xs mt-0.5">
                Efface définitivement tous les messages de toutes les conversations
              </p>
            </div>
            <button
              onClick={() => setConfirmClear(true)}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Vider la BDD
            </button>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-[#202c33] rounded-xl border border-[#2a3942] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2a3942]">
            <h2 className="text-white font-semibold">
              Utilisateurs ({stats.users})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[#aebac1]">Chargement...</div>
          ) : (
            <div className="divide-y divide-[#2a3942]">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#2a3942]/40 transition-colors"
                >
                  <UserAvatar user={u} size={44} showStatus />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{u.username}</span>
                      {u.id === currentUser.id && (
                        <span className="bg-[#25d366]/20 text-[#25d366] text-xs px-2 py-0.5 rounded-full">
                          Vous
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          u.status === 'online'
                            ? 'bg-[#25d366]/20 text-[#25d366]'
                            : 'bg-[#aebac1]/10 text-[#aebac1]'
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                    <p className="text-[#aebac1] text-xs mt-0.5">{u.email}</p>
                    <p className="text-[#aebac1] text-xs">
                      Inscrit le{' '}
                      {new Date(u.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {u.id !== currentUser.id && (
                    <button
                      onClick={() => handleBanUser(u.id, u.username)}
                      disabled={actionLoading === u.id}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === u.id ? 'En cours…' : 'Bannir'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmation clear */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#233138] rounded-xl p-6 max-w-sm w-full border border-red-500/20">
            <div className="text-4xl text-center mb-4">⚠️</div>
            <h3 className="text-white font-semibold text-center text-lg mb-2">
              Supprimer tous les messages ?
            </h3>
            <p className="text-[#aebac1] text-sm text-center mb-6">
              Cette action est <strong className="text-red-400">irréversible</strong>. 
              Tous les messages de toutes les conversations seront définitivement supprimés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#aebac1]/30 text-[#aebac1] text-sm hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleClearAllMessages}
                disabled={actionLoading === 'clear'}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'clear' ? 'Suppression…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
