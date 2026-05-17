'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MessageStatus } from '../ui/MessageStatus'
import type { Message } from '@/types'

interface Props {
  message: Message
  isOwn: boolean
  onDeleteForMe: () => void
  onDeleteForEveryone: () => void
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export function MessageBubble({ message, isOwn, onDeleteForMe, onDeleteForEveryone }: Props) {
  const [showMenu, setShowMenu] = useState(false)

  const canDeleteForEveryone = isOwn && !message.is_seen

  return (
    <div className={`flex msg-animate ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`relative max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>

        {/* Menu contextuel (au survol) */}
        <div className={`absolute top-1 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} z-10 hidden group-hover:flex items-center px-2`}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full hover:bg-[#2a3942] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#aebac1]">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowMenu(false)}
            />
            <div className={`absolute top-6 ${isOwn ? 'right-0' : 'left-0'} bg-[#233138] rounded-lg shadow-xl z-30 min-w-[180px] overflow-hidden`}>
              {canDeleteForEveryone && (
                <button
                  onClick={() => { onDeleteForEveryone(); setShowMenu(false) }}
                  className="w-full text-left px-4 py-3 text-white/80 hover:bg-white/5 text-sm transition-colors"
                >
                  Supprimer pour tous
                </button>
              )}
              <button
                onClick={() => { onDeleteForMe(); setShowMenu(false) }}
                className="w-full text-left px-4 py-3 text-white/80 hover:bg-white/5 text-sm transition-colors"
              >
                Supprimer pour moi
              </button>
            </div>
          </>
        )}

        {/* Bulle du message */}
        <div className={`px-3 py-2 rounded-lg ${isOwn ? 'msg-bubble-out' : 'msg-bubble-in'}`}>

          {/* Image */}
          {message.message_type === 'image' && message.file_url && (
            <div className="mb-1 rounded-md overflow-hidden max-w-[280px]">
              <Image
                src={message.file_url}
                alt="Image partagée"
                width={280}
                height={200}
                className="object-cover w-full"
                unoptimized
              />
            </div>
          )}

          {/* Fichier */}
          {message.message_type === 'file' && message.file_url && (
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-black/10 rounded-lg p-3 mb-1 hover:bg-black/20 transition-colors min-w-[200px]"
            >
              <div className="w-10 h-10 bg-[#25d366]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25d366]">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[#111b21] text-sm font-medium truncate">
                  {message.file_name || 'Fichier'}
                </p>
                {message.file_size && (
                  <p className="text-[#111b21]/60 text-xs">
                    {formatFileSize(message.file_size)}
                  </p>
                )}
              </div>
            </a>
          )}

          {/* Texte */}
          {message.content && (
            <p className="text-[#111b21] text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Heure + statut */}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-end'}`}>
            <span className="text-[10px] text-[#111b21]/50">
              {formatTime(message.created_at)}
            </span>
            {isOwn && <MessageStatus message={message} size="md" />}
          </div>
        </div>
      </div>
    </div>
  )
}
