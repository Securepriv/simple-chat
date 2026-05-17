// src/Sidebar.tsx
import React, { useState } from 'react';
import ConversationItem, { Conversation } from './ConversationItem'; // Importe l'interface et le composant

interface SidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ conversations, selectedConversationId, onSelectConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sidebar">
      <input
        type="text"
        placeholder="Rechercher une conversation..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <div className="conversation-list">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedConversationId}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))
        ) : (
          <p className="no-conversations">Aucune conversation trouvée.</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
