'use client'
import { useMessages } from '@/hooks/useMessages'
import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import { useMessagesStore, useAuthStore } from '@/store'

export function ChatArea({ conversationId }: { conversationId: string }) {
  const { user } = useAuthStore()
  const { messages, sendMessage, loading, handleTyping, typingUserIds } = useMessages(conversationId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement
    const text = input.value.trim()
    if (text) {
      try {
        await sendMessage({
          conversation_id: conversationId,
          content: text,
          message_type: 'text'
        })
        input.value = ''
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0b141a]">
      <div className="w-8 h-8 bg-[#25d366] rounded-full animate-pulse" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] relative">

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {messages.map((msg) => {
          // ✅ Vérifier si le message est de l'utilisateur actuel
          const isMe = user && msg.sender_id === user.id

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[65%] px-3 py-2 rounded-lg text-sm shadow-sm ${
                isMe ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#202c33] text-[#e9edef]'
              }`}>
                {msg.content}
                <span className="text-[10px] text-[#8696a0] ml-2 block mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          )
        })}
        
        {/* Typing Indicator */}
        {typingUserIds && typingUserIds.length > 0 && (
          <TypingIndicator />
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-[#202c33] flex items-center gap-3"
      >
        <input
          name="message"
          autoComplete="off"
          onChange={handleTyping}
          placeholder="Taper un message"
          className="flex-1 bg-[#2a3942] text-[#e9edef] rounded-lg px-4 py-2 outline-none placeholder:text-[#8696a0]"
        />
        <button
          type="submit"
          className="bg-[#25d366] text-white px-4 py-2 rounded-lg hover:bg-[#1da851] transition-colors"
        >
          Envoyer
        </button>
      </form>
    </div>
  )
}
