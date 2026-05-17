'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Send, LogOut } from 'lucide-react'

export default function ChatPage() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [username, setUsername] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
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
    loadMessages()

    // Écouter les nouveaux messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    await supabase
      .from('messages')
      .insert([{ 
        user_id: userId, 
        username: username,
        content: input 
      }])

    setInput('')
  }

  const logout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    router.push('/')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">💬 Simple Chat</h1>
          <p className="text-sm text-gray-500">Connecté en tant que <span className="font-semibold">{username}</span></p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
        >
          <LogOut size={18} />
          Quitter
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.user_id === userId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${isMe ? 'order-2' : 'order-1'}`}>
                {!isMe && (
                  <div className="text-xs text-gray-500 mb-1 ml-1">{msg.username}</div>
                )}
                <div className={`p-3 rounded-2xl ${
                  isMe 
                    ? 'bg-blue-500 text-white rounded-br-sm' 
                    : 'bg-white text-gray-800 rounded-bl-sm shadow'
                }`}>
                  {msg.content}
                </div>
                <div className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right mr-1' : 'text-left ml-1'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="bg-white border-t p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 p-3 border rounded-xl focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 rounded-xl transition"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}
