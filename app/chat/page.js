'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function ChatPage() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [username, setUsername] = useState('')
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    const storedUsername = localStorage.getItem('username')
    
    if (!storedUserId || !storedUsername) {
      router.push('/')
      return
    }
    
    setUserId(storedUserId)
    setUsername(storedUsername)
    loadUsers()
    loadMessages()
    setupRealtimeSubscription()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadUsers = async () => {
    const { data } = await supabase.from('users').select('*')
    if (data) setUsers(data.filter(u => u.id !== userId))
  }

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const setupRealtimeSubscription = () => {
    supabase
      .channel('messages-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || !selectedUser) return

    await supabase
      .from('messages')
      .insert([{ 
        user_id: userId, 
        username: username,
        content: input 
      }])

    setInput('')
    setShowEmoji(false)
  }

  const logout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    router.push('/')
  }

  const getConversationMessages = () => {
    if (!selectedUser) return []
    return messages.filter(msg => 
      msg.user_id === userId || msg.user_id === selectedUser.id
    )
  }

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>💬 Messages</h1>
          <div className="search-box">
            <input type="text" placeholder="Rechercher..." />
          </div>
        </div>
        <div className="user-list">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
            >
              <div className="user-avatar">
                {user.username[0].toUpperCase()}
                <div className="online-dot"></div>
              </div>
              <div className="user-info">
                <div className="user-name">{user.username}</div>
                <div className="user-status">Cliquez pour discuter</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="chat-user-name">{selectedUser.username}</div>
                  <div className="chat-status">En ligne</div>
                </div>
              </div>
              <div className="chat-actions">
                <button>📞</button>
                <button>🎥</button>
                <button>⋯</button>
              </div>
            </div>

            <div className="messages-area">
              {getConversationMessages().map((msg) => {
                const isMe = msg.user_id === userId
                return (
                  <div key={msg.id} className={`message ${isMe ? 'me' : 'other'}`}>
                    {!isMe && <div className="message-avatar"></div>}
                    <div className="message-bubble">
                      {msg.content}
                      <div className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {isMe && <div className="message-avatar-placeholder"></div>}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <form onSubmit={sendMessage} className="input-form">
                <div className="input-wrapper">
                  <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="emoji-button">
                    😊
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message à ${selectedUser.username}...`}
                    className="message-input"
                  />
                </div>
                <button type="submit" disabled={!input.trim()} className="send-button">
                  Envoyer
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div>
              <div className="empty-icon"><span>💬</span></div>
              <div className="empty-title">Messenger</div>
              <div className="empty-text">Sélectionnez une conversation pour commencer</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
