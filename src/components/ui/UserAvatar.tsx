'use client'

import Image from 'next/image'
import type { User } from '@/types'

interface Props {
  user: User
  size?: number
  showStatus?: boolean
}

function getInitials(username: string): string {
  return username
    .split(/[\s_-]/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Couleur déterministe basée sur le username
function getAvatarColor(username: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#82E0AA', '#F8C471',
  ]
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function UserAvatar({ user, size = 40, showStatus = false }: Props) {
  const initials = getInitials(user.username)
  const bgColor = getAvatarColor(user.username)

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {user.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt={user.username}
          width={size}
          height={size}
          className="rounded-full object-cover"
          unoptimized
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center font-semibold text-white select-none"
          style={{
            width: size,
            height: size,
            backgroundColor: bgColor,
            fontSize: size * 0.35,
          }}
        >
          {initials}
        </div>
      )}

      {/* Badge statut */}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-[#111b21] ${
            user.status === 'online'
              ? 'bg-[#25d366]'
              : user.status === 'inactive'
              ? 'bg-yellow-400'
              : 'bg-[#aebac1]'
          }`}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  )
}
