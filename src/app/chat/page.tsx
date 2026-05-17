'use client'
import { useAuth } from '@/hooks/useAuth'
import { useConversations } from '@/hooks/useConversations'
import { Sidebar } from '@/components/chat/Sidebar'
import { ChatArea } from '@/components/chat/ChatArea'
import { EmptyState } from '@/components/chat/EmptyState'

export default function ChatPage() {
  const { user, loading } = useAuth()
  const { activeConversationId } = useConversations()

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#111b21]">
      <div className="w-12 h-12 bg-[#25d366] rounded-full animate-pulse" />
    </div>
  )
  if (!user) return null

  return (
    <div className="h-screen flex overflow-hidden bg-[#111b21]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeConversationId ? <ChatArea conversationId={activeConversationId} /> : <EmptyState />}
      </div>
    </div>
  )
}
