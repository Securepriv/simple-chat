// src/ChatArea.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Conversation } from './ConversationItem'; // Importe l'interface

// Définition de l'interface pour un message
export interface Message {
  id: string;
  senderId: string; // 'me' pour l'utilisateur actuel, ou l'id de l'autre personne
  text: string;
  timestamp: string;
}

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ conversation, messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null); // Pour scroller automatiquement

  // Scroll vers le bas à chaque nouveau message ou changement de conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && conversation) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  if (!conversation) {
    return (
      <div className="chat-area empty-chat">
        <p>Sélectionnez une conversation pour commencer à discuter.</p>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <img src={conversation.avatar} alt={conversation.name} className="chat-avatar" />
        <h3>{conversation.name}</h3>
      </div>
      <div className="message-list">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.senderId === 'me' ? 'sent' : 'received'}`}>
            <p>{msg.text}</p>
            <span className="message-timestamp">{msg.timestamp}</span>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Element pour le scroll automatique */}
      </div>
      <form onSubmit={handleSubmit} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrire un message..."
          className="message-input"
        />
        <button type="submit" className="send-button">Envoyer</button>
      </form>
    </div>
  );
};

export default ChatArea;
