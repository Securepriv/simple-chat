'use client'
import { useConversations } from '@/hooks/useConversations'
import { ConversationItem } from './ConversationItem'

export function Sidebar() {
  const { conversations, activeConversationId, setActiveConversation } = useConversations()

  return (
    <aside className="w-[400px] flex-shrink-0 border-r border-[#222d34] bg-[#111b21] flex flex-col">
      <div className="p-4 bg-[#202c33] flex items-center justify-between">
        <h1 className="text-[#e9edef] font-bold text-xl">Messages</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {conversations?.map((conv) => (
          <ConversationItem 
            key={conv.id} 
            conversation={conv} 
            isActive={activeConversationId === conv.id}
            onClick={() => setActiveConversation(conv.id)}
          />
        ))}
        {conversations?.length === 0 && (
          <p className="text-[#8696a0] text-center mt-10">Aucune discussion</p>
        )}
      </div>
    </aside>
  )
}
