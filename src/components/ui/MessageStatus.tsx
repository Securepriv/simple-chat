'use client'

import type { Message } from '@/types'

interface Props {
  message: Message
  size?: 'sm' | 'md'
}

export function MessageStatus({ message, size = 'md' }: Props) {
  const dim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  // ✓ — Envoyé seulement
  if (!message.is_received && !message.is_seen) {
    return (
      <svg viewBox="0 0 16 11" className={`${dim} inline-block flex-shrink-0`} style={{ fill: 'var(--tick-sent)' }}>
        <path d="M11.071.653a.75.75 0 0 1 .257 1.028l-6 9.5a.75.75 0 0 1-1.2.063l-3.5-4a.75.75 0 0 1 1.143-.977L4.8 9.632l5.243-8.722a.75.75 0 0 1 1.028-.257z" />
      </svg>
    )
  }

  // ✓✓ gris — Reçu mais pas vu
  if (message.is_received && !message.is_seen) {
    return (
      <svg viewBox="0 0 18 11" className={`${dim} inline-block flex-shrink-0`} style={{ fill: 'var(--tick-sent)' }}>
        <path d="M17.394.614a.75.75 0 0 1 .235 1.034l-6 9.5a.75.75 0 0 1-1.2.063l-.974-1.112-1.88 2.977a.75.75 0 0 1-1.2.063l-3.5-4a.75.75 0 0 1 1.143-.977l2.938 3.357 1.93-3.056L7 7.232a.75.75 0 0 1 .03-1.02l1.063-1.063L6.8 4.032a.75.75 0 0 1 1.143-.977L9.8 5.1l.5-.566 4.043-6.4a.75.75 0 0 1 1.034-.235l2.018 1.715z" />
        <path d="M13.394.614a.75.75 0 0 1 .235 1.034l-6 9.5a.75.75 0 0 1-1.2.063L3 7.5a.75.75 0 0 1 1.143-.977l2.73 3.12 5.487-8.793A.75.75 0 0 1 13.394.614z" />
      </svg>
    )
  }

  // ✓✓ bleu — Vu
  if (message.is_seen) {
    return (
      <svg viewBox="0 0 18 11" className={`${dim} inline-block flex-shrink-0`} style={{ fill: 'var(--tick-seen)' }}>
        <path d="M17.394.614a.75.75 0 0 1 .235 1.034l-6 9.5a.75.75 0 0 1-1.2.063l-.974-1.112-1.88 2.977a.75.75 0 0 1-1.2.063l-3.5-4a.75.75 0 0 1 1.143-.977l2.938 3.357 1.93-3.056L7 7.232a.75.75 0 0 1 .03-1.02l1.063-1.063L6.8 4.032a.75.75 0 0 1 1.143-.977L9.8 5.1l.5-.566 4.043-6.4a.75.75 0 0 1 1.034-.235l2.018 1.715z" />
        <path d="M13.394.614a.75.75 0 0 1 .235 1.034l-6 9.5a.75.75 0 0 1-1.2.063L3 7.5a.75.75 0 0 1 1.143-.977l2.73 3.12 5.487-8.793A.75.75 0 0 1 13.394.614z" />
      </svg>
    )
  }

  return null
}
