'use client'
import { useMessages } from '@/hooks/useMessages'
import { useEffect, useRef } from 'react'

export function ChatArea({ conversationId }: { conversationId: string }) {
  const { messages, sendMessage, loading } = useMessages(conversationId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement
    if (input.value.trim()) {
      await sendMessage(input.value)
      input.value = ''
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 z-10 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[65%] p-2 rounded-lg text-sm shadow-sm ${msg.is_me ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#202c33] text-[#e9edef]'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-[#202c33] flex items-center z-10">
        <input 
          name="message"
          autoComplete="off"
          placeholder="Taper un message"
          className="flex-1 bg-[#2a3942] text-[#e9edef] rounded-lg px-4 py-2 outline-none"
        />
      </form>
    </div>
  )
}
