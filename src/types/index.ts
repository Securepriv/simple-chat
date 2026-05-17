export type UserStatus = 'online' | 'offline' | 'inactive'
export type MessageType = 'text' | 'image' | 'file' | 'link'

export interface User {
  id: string; username: string; email: string; avatar_url: string | null
  status: UserStatus; last_seen: string; created_at: string
}
export interface Conversation {
  id: string; created_at: string
  other_user?: User; last_message?: Message | null; unread_count?: number
}
export interface ConversationMember { conversation_id: string; user_id: string; joined_at: string }
export interface Message {
  id: string; conversation_id: string; sender_id: string; content: string | null
  message_type: MessageType; file_url: string | null; file_name: string | null; file_size: number | null
  is_received: boolean; is_seen: boolean; deleted_for_everyone: boolean; created_at: string
  sender?: User
}
export interface DeletedMessage { message_id: string; user_id: string; deleted_at: string }
export interface TypingStatus { conversation_id: string; user_id: string; is_typing: boolean; updated_at: string }
export interface SendMessagePayload {
  conversation_id: string; content?: string; message_type?: MessageType
  file_url?: string; file_name?: string; file_size?: number
}
export interface UploadedFile { url: string; name: string; size: number; type: string }

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at'>
        // ✅ Corrigé : Update explicite avec les bons champs
        Update: {
          username?: string
          email?: string
          avatar_url?: string | null
          status?: UserStatus
          last_seen?: string
        }
      }
      conversations: {
        Row: Conversation
        Insert: { id?: string; created_at?: string }
        Update: never
      }
      conversation_members: {
        Row: ConversationMember
        Insert: Omit<ConversationMember, 'joined_at'>
        Update: never
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id'|'created_at'|'is_received'|'is_seen'|'deleted_for_everyone'> & {
          id?: string
          created_at?: string
          is_received?: boolean
          is_seen?: boolean
          deleted_for_everyone?: boolean
        }
        Update: Partial<Omit<Message, 'id'>>
      }
      deleted_messages: {
        Row: DeletedMessage
        Insert: Omit<DeletedMessage, 'deleted_at'>
        Update: never
      }
      typing_status: {
        Row: TypingStatus
        Insert: Omit<TypingStatus, 'updated_at'>
        Update: Partial<TypingStatus>
      }
    }
    Functions: {
      get_or_create_conversation: { Args: { user_a: string; user_b: string }; Returns: string }
      admin_clear_all_messages: { Args: Record<string, never>; Returns: void }
    }
  }
}
