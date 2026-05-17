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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon"><span>💬</span></div>
          <h1>Messenger</h1>
          <p>Connectez-vous pour discuter</p>
        </div>
        <div className="login-body">
          {!showNewUser ? (
            <>
              <div className="user-buttons">
                {users.map((user) => (
                  <button key={user.id} onClick={() => login(user)} className="user-button">
                    <div className="user-avatar-small">{user.username[0].toUpperCase()}</div>
                    <div>
                      <div className="user-name">{user.username}</div>
                      <div className="user-status">Cliquez pour discuter</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowNewUser(true)} className="new-user-btn">
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
                className="new-user-input"
                autoFocus
              />
              <button onClick={createUser} className="create-btn">
                Commencer à chatter
              </button>
              <button onClick={() => setShowNewUser(false)} className="back-btn">
                Retour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
