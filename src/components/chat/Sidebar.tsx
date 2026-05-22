'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useConversations } from '@/hooks/useConversations'
import { ConversationItem } from './ConversationItem'
import type { User } from '@/types'

export function Sidebar() {
  const { signOut } = useAuth()
  const { conversations, activeConversationId, setActiveConversation, searchUsers, openConversationWith } = useConversations()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length === 0) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const results = await searchUsers(query)
      setSearchResults(results)
    } finally {
      setIsSearching(false)
    }
  }, [searchUsers])

  const handleSelectUser = useCallback(async (user: User) => {
    const convId = await openConversationWith(user)
    if (convId) {
      setSearchQuery('')
      setSearchResults([])
      setActiveConversation(convId)
    }
  }, [openConversationWith, setActiveConversation])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [signOut])

  return (
    <aside className="w-[400px] flex-shrink-0 border-r border-[#222d34] bg-[#111b21] flex flex-col">
      {/* Header */}
      <div className="p-4 bg-[#202c33] flex items-center justify-between gap-3">
        <h1 className="text-[#e9edef] font-bold text-xl flex-1">Messages</h1>
        <button
          onClick={handleSignOut}
          className="px-3 py-1 text-sm bg-[#25d366] text-white rounded hover:bg-[#1da851] transition-colors"
        >
          Déconnexion
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-[#111b21]">
        <input
          type="text"
          placeholder="Rechercher ou démarrer une discussion"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-[#2a3942] text-[#e9edef] rounded-full px-4 py-2 outline-none placeholder:text-[#8696a0] text-sm"
        />
      </div>

      {/* Search Results or Conversations */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {searchQuery.trim().length > 0 ? (
          <div>
            {isSearching ? (
              <p className="text-[#8696a0] text-center mt-10 text-sm">Recherche...</p>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="p-3 border-b border-[#222d34] cursor-pointer hover:bg-[#202c33] transition-colors"
                >
                  <p className="text-[#e9edef] text-sm font-medium">{user.username}</p>
                  <p className="text-[#8696a0] text-xs">{user.email}</p>
                </div>
              ))
            ) : (
              <p className="text-[#8696a0] text-center mt-10 text-sm">Aucun utilisateur trouvé</p>
            )}
          </div>
        ) : (
          <div>
            {conversations?.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversationId === conv.id}
                onClick={() => setActiveConversation(conv.id)}
              />
            ))}
            {conversations?.length === 0 && (
              <p className="text-[#8696a0] text-center mt-10 text-sm">Aucune discussion</p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
