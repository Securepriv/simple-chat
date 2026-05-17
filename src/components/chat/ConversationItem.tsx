'use client'
import { Conversation } from '@/types'

interface Props {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, isActive, onClick }: Props) {
  const otherUser = conversation.other_user
  const lastMsg = conversation.last_message

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer hover:bg-[#202c33] transition-colors ${
        isActive ? 'bg-[#2a3942]' : ''
      }`}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-[#6a7175] flex-shrink-0 overflow-hidden">
        {otherUser?.avatar_url ? (
          <img
            src={otherUser.avatar_url}
            alt={otherUser.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
            {otherUser?.username?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="ml-3 flex-1 border-b border-[#222d34] pb-3 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-[#e9edef] font-medium truncate">
            {otherUser?.username || 'Utilisateur inconnu'}
          </span>
          <span className="text-[#8696a0] text-xs flex-shrink-0 ml-2">
            {lastMsg?.created_at
              ? new Date(lastMsg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-[#8696a0] text-sm truncate">
            {lastMsg?.content || 'Pas de message'}
          </p>

          {/* Badge non lus */}
          {conversation.unread_count && conversation.unread_count > 0 ? (
            <span className="bg-[#25d366] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
              {conversation.unread_count}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
