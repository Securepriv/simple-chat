'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { MessageCircle, UserPlus, LogIn, Sparkles } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [newUsername, setNewUsername] = useState('')
  const [showNewUser, setShowNewUser] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const { data } = await supabase.from('users').select('*')
    if (data) setUsers(data)
  }

  const login = (user) => {
    localStorage.setItem('userId', user.id)
    localStorage.setItem('username', user.username)
    router.push('/chat')
  }

  const createUser = async () => {
    if (!newUsername.trim()) return
    const { data } = await supabase
      .from('users')
      .insert([{ username: newUsername }])
      .select()
      .single()
    if (data) login(data)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Messenger</h1>
          <p className="text-indigo-100 mt-1">Connectez-vous pour discuter</p>
        </div>

        <div className="p-6">
          {!showNewUser ? (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => login(user)}
                    className="w-full p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-all duration-200 flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-800">{user.username}</div>
                      <div className="text-xs text-gray-400">Cliquez pour discuter</div>
                    </div>
                    <LogIn className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowNewUser(true)}
                className="w-full p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition flex items-center justify-center gap-2 font-medium"
              >
                <UserPlus size={18} />
                Nouvel utilisateur
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choisissez votre pseudo
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Entrez un pseudo..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                onClick={createUser}
                className="w-full p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium"
              >
                <Sparkles size={18} />
                Commencer l'aventure
              </button>
              <button
                onClick={() => setShowNewUser(false)}
                className="w-full p-3 mt-2 text-gray-500 hover:text-gray-700 transition text-sm"
              >
                Retour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
