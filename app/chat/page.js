'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import EmojiPicker from 'emoji-picker-react'
import { 
  Send, 
  LogOut, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  Search,
  ChevronLeft,
  Check,
  CheckCheck,
  Circle,
  CircleCheck,
  MessageCircle
} from 'lucide-react'

export default function ChatPage() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [username, setUsername] = useState('')
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

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

  const onEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji)
  }

  const logout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    router.push('/')
  }

  const getConversationMessages = () => {
    if (!selectedUser) return []
    return messages.filter(msg => 
      (msg.user_id === userId && msg.username === username) ||
      (msg.user_id === selectedUser.id && msg.username === selectedUser.username)
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Liste des conversations */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} bg-white border-r transition-all duration-300 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <button
              onClick={logout}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <LogOut size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full p-2 pl-10 bg-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:bg-white/30"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                setSelectedUser(user)
                setShowSidebar(false)
              }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-all duration-200 ${
                selectedUser?.id === user.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800">{user.username}</div>
                <div className="text-xs text-gray-400">Cliquez pour discuter</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedUser.username[0].toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{selectedUser.username}</h2>
                  <p className="text-xs text-green-500">En ligne</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Phone size={18} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Video size={18} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <MoreVertical size={18} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100">
              {getConversationMessages().map((msg, index) => {
                const isMe = msg.user_id === userId
                const showAvatar = !isMe && (index === 0 || getConversationMessages()[index - 1]?.user_id !== msg.user_id)
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!isMe && showAvatar && (
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {msg.username[0].toUpperCase()}
                      </div>
                    )}
                    {!isMe && !showAvatar && <div className="w-8 flex-shrink-0"></div>}
                    
                    <div className={`max-w-xs lg:max-w-md ${isMe ? 'order-2' : 'order-1'}`}>
                      <div className={`p-3 rounded-2xl ${
                        isMe 
                          ? 'bg-indigo-500 text-white rounded-br-sm' 
                          : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          <span className="ml-1">
                            <CheckCheck size={12} className="inline text-indigo-400" />
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {isMe && (
                      <div className="w-8 flex-shrink-0"></div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t p-4">
              <form onSubmit={sendMessage} className="flex gap-2 items-end">
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="absolute left-3 bottom-3 text-gray-400 hover:text-indigo-500 transition"
                  >
                    <Smile size={20} />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message à ${selectedUser.username}...`}
                    className="w-full p-3 pl-12 pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="absolute right-3 bottom-2 text-indigo-500 hover:text-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={22} />
                  </button>
                </div>
              </form>
              {showEmoji && (
                <div className="absolute bottom-24 right-4 z-50">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Messenger</h2>
              <p className="text-gray-400 mt-2">Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
