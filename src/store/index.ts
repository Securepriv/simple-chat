import { create } from 'zustand'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { User, Conversation, Message } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    const supabase = getSupabaseClient()
    // ✅ Cast pour bypasser le type never
    const db = supabase as any
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await db.from('users')
        .update({ status: 'offline', last_seen: new Date().toISOString() })
        .eq('id', user.id)
    }
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

interface ConversationsState {
  conversations: Conversation[]
  activeConversationId: string | null
  loading: boolean
  setConversations: (conversations: Conversation[]) => void
  setActiveConversation: (id: string | null) => void
  updateConversation: (id: string, data: Partial<Conversation>) => void
  addConversation: (conversation: Conversation) => void
  setLoading: (loading: boolean) => void
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],
  activeConversationId: null,
  loading: false,
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  updateConversation: (id, data) => set((state) => ({
    conversations: state.conversations.map((c) => c.id === id ? { ...c, ...data } : c),
  })),
  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations],
  })),
  setLoading: (loading) => set({ loading }),
}))

interface MessagesState {
  messages: Record<string, Message[]>
  loading: boolean
  typingUsers: Record<string, string[]>
  setMessages: (conversationId: string, messages: Message[]) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, data: Partial<Message>) => void
  removeMessage: (conversationId: string, messageId: string) => void
  addTypingUser: (conversationId: string, userId: string) => void
  removeTypingUser: (conversationId: string, userId: string) => void
  setLoading: (loading: boolean) => void
}

export const useMessagesStore = create<MessagesState>((set) => ({
  messages: {},
  loading: false,
  typingUsers: {},
  setMessages: (conversationId, messages) => set((state) => ({
    messages: { ...state.messages, [conversationId]: messages }
  })),
  addMessage: (conversationId, message) => set((state) => ({
    messages: { ...state.messages, [conversationId]: [...(state.messages[conversationId] || []), message] },
  })),
  updateMessage: (conversationId, messageId, data) => set((state) => ({
    messages: { ...state.messages, [conversationId]: (state.messages[conversationId] || []).map((m) => m.id === messageId ? { ...m, ...data } : m) },
  })),
  removeMessage: (conversationId, messageId) => set((state) => ({
    messages: { ...state.messages, [conversationId]: (state.messages[conversationId] || []).filter((m) => m.id !== messageId) },
  })),
  addTypingUser: (conversationId, userId) => set((state) => {
    const current = state.typingUsers[conversationId] || []
    if (current.includes(userId)) return state
    return { typingUsers: { ...state.typingUsers, [conversationId]: [...current, userId] } }
  }),
  removeTypingUser: (conversationId, userId) => set((state) => ({
    typingUsers: { ...state.typingUsers, [conversationId]: (state.typingUsers[conversationId] || []).filter((id) => id !== userId) },
  })),
  setLoading: (loading) => set({ loading }),
}))
