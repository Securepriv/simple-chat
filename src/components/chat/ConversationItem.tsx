'use client'
import { Conversation } from '@/types'

interface Props {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, isActive, onClick }: Props) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer hover:bg-[#202c33] transition-colors ${isActive ? 'bg-[#2a3942]' : ''}`}
    >
      <div className="w-12 h-12 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
        {conversation.avatar_url ? (
          <img src={conversation.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#6a7175]" />
        )}
      </div>
      <div className="ml-3 flex-1 border-b border-[#222d34] pb-3">
        <div className="flex justify-between items-center">
          <span className="text-[#e9edef] font-medium">{conversation.name}</span>
          <span className="text-[#8696a0] text-xs">
            {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
          </span>
        </div>
        <p className="text-[#8696a0] text-sm truncate">{conversation.last_message || 'Pas de message'}</p>
      </div>
    </div>
  )
}
