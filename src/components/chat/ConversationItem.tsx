// src/ConversationItem.tsx
import React from 'react';

// Définition de l'interface pour une conversation
export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isSelected, onClick }) => {
  return (
    <div
      className={`conversation-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <img src={conversation.avatar} alt={conversation.name} className="conversation-avatar" />
      <div className="conversation-info">
        <h4>{conversation.name}</h4>
        <p>{conversation.lastMessage}</p>
      </div>
      <span className="conversation-timestamp">{conversation.timestamp}</span>
    </div>
  );
};

export default ConversationItem;
