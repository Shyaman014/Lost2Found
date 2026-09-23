import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AnonymousAvatar from './AnonymousAvatar';

const ChatWindow = ({ 
  conversation, 
  messages, 
  currentUser, 
  onSendMessage, 
  onTypingStart, 
  onTypingStop,
  isTyping
}) => {
  const [content, setContent] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSendMessage(content.trim());
      setContent('');
      onTypingStop();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    if (e.target.value) {
      onTypingStart();
    } else {
      onTypingStop();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
        Select a conversation to start messaging
      </div>
    );
  }

  const isClosed = conversation.status === 'closed';

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <AnonymousAvatar role={conversation.otherRole} />
          <div>
            <h2 className="text-lg font-bold text-gray-900">{conversation.item.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">{conversation.otherRole}</span>
              {isClosed && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold">Closed</span>}
            </div>
          </div>
        </div>
        <Link to={`/items/${conversation.item._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          View Item
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => {
          const isMine = msg.sender === currentUser._id;
          const showRole = idx === 0 || messages[idx - 1].sender !== msg.sender;

          return (
            <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMine ? 'order-1 items-end' : 'order-2 items-start'} flex flex-col`}>
                {!isMine && showRole && (
                  <span className="text-xs text-gray-500 mb-1 ml-1">{conversation.otherRole}</span>
                )}
                <div className={`px-4 py-2 rounded-2xl ${isMine ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'} shadow-sm whitespace-pre-wrap break-words`}>
                  {msg.content}
                </div>
                <div className={`text-[10px] text-gray-400 mt-1 flex items-center gap-1 ${isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMine && msg.readAt && (
                    <span className="text-indigo-500 ml-1">✓✓</span>
                  )}
                  {isMine && !msg.readAt && (
                    <span className="text-gray-400 ml-1">✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl rounded-bl-none text-sm italic shadow-sm">
              {conversation.otherRole} is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        {isClosed ? (
          <div className="text-center text-sm text-gray-500 py-2">
            This conversation is closed because the item has been returned.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 resize-none border border-gray-300 rounded-lg p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 block max-h-32"
              rows="1"
            />
            <button
              type="submit"
              disabled={!content.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
