'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const { data } = await supabase.from('users').select('*')
    if (data) setUsers(data)
  }

  const testSupabase = async () => {
  console.log('Test Supabase...')
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...')
  
  const { data, error } = await supabase.from('users').select('*')
  
  if (error) {
    console.error('❌ Erreur Supabase:', error)
  } else {
    console.log('✅ Succès! Utilisateurs:', data)
  }
}

useEffect(() => {
  testSupabase()
  loadUsers()
}, [])

  const login = async (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    
    await supabase
      .from('users')
      .update({ is_online: true, last_seen: new Date() })
      .eq('id', user.id)
    
    router.push('/chat')
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>💬</div>
          <h1 style={styles.title}>Messenger</h1>
          <p style={styles.subtitle}>Choisissez votre compte</p>
        </div>
        <div style={styles.body}>
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => login(user)}
              style={styles.userButton}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div style={styles.avatar}>
                {user.username[0].toUpperCase()}
              </div>
              <div style={styles.userInfo}>
                <div style={styles.userName}>{user.username}</div>
                <div style={styles.userStatus}>Cliquez pour discuter</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  card: {
    background: 'white',
    borderRadius: '24px',
    maxWidth: '400px',
    width: '100%',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '32px',
    textAlign: 'center'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  title: {
    color: 'white',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px'
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%'
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '20px'
  },
  userInfo: {
    flex: 1,
    textAlign: 'left'
  },
  userName: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '16px'
  },
  userStatus: {
    fontSize: '12px',
    color: '#9ca3af'
  }
}
