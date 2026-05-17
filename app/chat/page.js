'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import EmojiPicker from 'emoji-picker-react'

export default function ChatPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/')
      return
    }
    
    const user = JSON.parse(storedUser)
    setCurrentUser(user)
    loadOtherUser(user.username)
    loadMessages(user.id)
    setupRealtimeSubscriptions(user.id)
    updateOnlineStatus(true)
    
    return () => {
      updateOnlineStatus(false)
    }
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const setupRealtimeSubscriptions = (userId) => {
    // Subscription pour les nouveaux messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          if (payload.new.sender_id === userId || payload.new.receiver_id === userId) {
            setMessages(prev => [...prev, payload.new])
          }
        }
      )
      .subscribe()
    
    // Subscription pour le statut en ligne
    const usersSubscription = supabase
      .channel('users')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        (payload) => {
          if (otherUser && payload.new.id === otherUser.id) {
            setOtherUserOnline(payload.new.is_online)
          }
        }
      )
      .subscribe()
    
    return () => {
      messagesSubscription.unsubscribe()
      usersSubscription.unsubscribe()
    }
  }

  const loadOtherUser = async (username) => {
    const otherName = username === 'Alice' ? 'Bob' : 'Alice'
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('username', otherName)
      .single()
    
    if (data) {
      setOtherUser(data)
      setOtherUserOnline(data.is_online)
    }
  }

  const loadMessages = async (userId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true })
    
    if (data) setMessages(data)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || !otherUser) return
    
    const { error } = await supabase
      .from('messages')
      .insert([{
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
        content: input
      }])
    
    if (!error) {
      setInput('')
      setShowEmoji(false)
      inputRef.current?.focus()
    }
  }

  const updateOnlineStatus = async (isOnline) => {
    if (currentUser) {
      await supabase
        .from('users')
        .update({ is_online: isOnline, last_seen: new Date() })
        .eq('id', currentUser.id)
    }
  }

  const onEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji)
    inputRef.current?.focus()
  }

  if (!currentUser || !otherUser) {
    return <div style={styles.loading}>Chargement...</div>
  }

  return (
    <div style={styles.container}>
      {/* Header Messenger */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerAvatar}>
            {otherUser.username[0].toUpperCase()}
            <span style={{ ...styles.onlineDot, backgroundColor: otherUserOnline ? '#22c55e' : '#9ca3af' }}></span>
          </div>
          <div>
            <div style={styles.headerName}>{otherUser.username}</div>
            <div style={styles.headerStatus}>
              {otherUserOnline ? 'En ligne' : 'Hors ligne'}
            </div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.iconButton}>📞</button>
          <button style={styles.iconButton}>🎥</button>
          <button style={styles.iconButton}>⋯</button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser.id
          return (
            <div key={msg.id} style={{ ...styles.messageRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && (
                <div style={styles.messageAvatar}>
                  {otherUser.username[0].toUpperCase()}
                </div>
              )}
              <div style={{ ...styles.messageBubble, ...(isMe ? styles.messageBubbleMe : styles.messageBubbleOther) }}>
                <div style={styles.messageText}>{msg.content}</div>
                <div style={styles.messageTime}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && <span style={styles.messageCheck}> ✓✓</span>}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area avec Emoji Picker */}
      <div style={styles.inputArea}>
        <form onSubmit={sendMessage} style={styles.inputForm}>
          <div style={styles.inputWrapper}>
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              style={styles.emojiButton}
            >
              😊
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message à ${otherUser.username}...`}
              style={styles.messageInput}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{ ...styles.sendButton, opacity: input.trim() ? 1 : 0.5 }}
            >
              Envoyer
            </button>
          </div>
        </form>
        
        {showEmoji && (
          <div style={styles.emojiPickerContainer}>
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#64748b'
  },
  header: {
    backgroundColor: 'white',
    padding: '16px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerAvatar: {
    position: 'relative',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px'
  },
  onlineDot: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white'
  },
  headerName: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#1e293b'
  },
  headerStatus: {
    fontSize: '12px',
    color: '#64748b'
  },
  headerActions: {
    display: 'flex',
    gap: '8px'
  },
  iconButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background 0.2s'
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px'
  },
  messageAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    flexShrink: 0
  },
  messageBubble: {
    maxWidth: '60%',
    padding: '10px 14px',
    borderRadius: '20px',
    position: 'relative'
  },
  messageBubbleMe: {
    backgroundColor: '#667eea',
    color: 'white',
    borderBottomRightRadius: '4px'
  },
  messageBubbleOther: {
    backgroundColor: 'white',
    color: '#1e293b',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  messageText: {
    fontSize: '14px',
    wordBreak: 'break-word'
  },
  messageTime: {
    fontSize: '10px',
    marginTop: '4px',
    opacity: 0.7,
    textAlign: 'right'
  },
  messageCheck: {
    marginLeft: '4px'
  },
  inputArea: {
    backgroundColor: 'white',
    borderTop: '1px solid #e2e8f0',
    padding: '16px 24px',
    position: 'relative'
  },
  inputForm: {
    display: 'flex',
    gap: '12px'
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  emojiButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background 0.2s'
  },
  messageInput: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  sendButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'transform 0.1s'
  },
  emojiPickerContainer: {
    position: 'absolute',
    bottom: '80px',
    right: '24px',
    zIndex: 1000
  }
}
