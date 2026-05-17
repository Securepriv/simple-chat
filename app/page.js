'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2">💬 Simple Chat</h1>
        <p className="text-center text-gray-500 mb-8">Choisissez votre pseudo</p>

        {!showNewUser ? (
          <>
            <div className="space-y-2 mb-4">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => login(user)}
                  className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition text-left px-4"
                >
                  {user.username}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNewUser(true)}
              className="w-full p-3 border-2 border-blue-500 text-blue-500 rounded-xl hover:bg-blue-50 transition"
            >
              + Nouvel utilisateur
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Entrez votre pseudo"
              className="w-full p-3 border rounded-xl mb-4"
              autoFocus
            />
            <button
              onClick={createUser}
              className="w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition"
            >
              Commencer à chatter
            </button>
            <button
              onClick={() => setShowNewUser(false)}
              className="w-full p-3 mt-2 text-gray-500 hover:text-gray-700"
            >
              Retour
            </button>
          </>
        )}
      </div>
    </div>
  )
}
