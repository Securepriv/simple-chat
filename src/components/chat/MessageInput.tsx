'use client'

import { useState, useRef, useCallback } from 'react'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import { useDropzone } from 'react-dropzone'
import { useFileUpload } from '@/hooks/useFileUpload'
import type { SendMessagePayload } from '@/types'

interface Props {
  conversationId: string
  onSend: (payload: SendMessagePayload) => Promise<void>
  onTyping: () => void
}

export function MessageInput({ conversationId, onSend, onTyping }: Props) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { uploadFile, getMessageType, uploading, progress } = useFileUpload()

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    onTyping()
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // Envoyer le message texte
  const handleSend = async () => {
    const content = text.trim()
    if (!content || sending) return

    setSending(true)
    try {
      await onSend({ conversation_id: conversationId, content, message_type: 'text' })
      setText('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } finally {
      setSending(false)
    }
  }

  // Envoyer avec Entrée (Shift+Entrée = nouvelle ligne)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Insérer emoji au curseur
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = text.slice(0, start) + emojiData.emoji + text.slice(end)
    setText(newText)

    // Replacer le curseur après l'emoji
    setTimeout(() => {
      textarea.selectionStart = start + emojiData.emoji.length
      textarea.selectionEnd = start + emojiData.emoji.length
      textarea.focus()
    }, 0)

    setShowEmoji(false)
  }

  // Upload fichier via dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    setUploadError('')

    for (const file of acceptedFiles) {
      try {
        const uploaded = await uploadFile(file)
        const messageType = getMessageType(file.type)
        await onSend({
          conversation_id: conversationId,
          message_type: messageType,
          file_url: uploaded.url,
          file_name: uploaded.name,
          file_size: uploaded.size,
          content: messageType === 'image' ? undefined : uploaded.name,
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur upload'
        setUploadError(msg)
        setTimeout(() => setUploadError(''), 4000)
      }
    }
  }, [conversationId, onSend, uploadFile, getMessageType])

  const { getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    maxSize: 10 * 1024 * 1024,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
    },
  })

  return (
    <div className="relative">
      {/* Erreur upload */}
      {uploadError && (
        <div className="absolute -top-10 left-0 right-0 mx-4 bg-red-500/90 text-white text-xs py-2 px-4 rounded-lg text-center">
          {uploadError}
        </div>
      )}

      {/* Barre de progression upload */}
      {uploading && (
        <div className="bg-[#202c33] px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#2a3942] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#25d366] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[#aebac1] text-xs">
              Upload {progress}%
            </span>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowEmoji(false)}
          />
          <div className="absolute bottom-full left-4 mb-2 z-20">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              lazyLoadEmojis
              searchPlaceholder="Rechercher un emoji…"
              width={320}
              height={380}
            />
          </div>
        </>
      )}

      {/* Zone de saisie principale */}
      <div className="flex items-end gap-2 px-4 py-3 bg-[#202c33]">
        {/* Bouton emoji */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={`p-2 rounded-full transition-colors flex-shrink-0 ${
            showEmoji ? 'bg-[#25d366] text-white' : 'hover:bg-white/10 text-[#aebac1]'
          }`}
          title="Emojis"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        </button>

        {/* Bouton pièce jointe */}
        <button
          onClick={open}
          disabled={uploading}
          className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 text-[#aebac1] disabled:opacity-40"
          title="Joindre un fichier"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
          </svg>
        </button>

        {/* Input caché pour le dropzone */}
        <input {...getInputProps()} />

        {/* Textarea */}
        <div className="flex-1 bg-[#2a3942] rounded-xl px-4 py-2.5">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Saisissez un message"
            rows={1}
            className="w-full bg-transparent text-white text-sm placeholder-[#aebac1] outline-none resize-none leading-relaxed"
            style={{ maxHeight: '120px' }}
          />
        </div>

        {/* Bouton envoyer */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-full bg-[#25d366] hover:bg-[#1ebe58] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
          title="Envoyer"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
