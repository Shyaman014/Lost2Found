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
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-8 text-center text-slate-400">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl mb-3">
          💬
        </div>
        <p className="text-sm font-semibold text-slate-700">Select a conversation to start messaging</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">Coordinate secure handoffs and exchanges with verified campus members.</p>
      </div>
    );
  }

  const isClosed = conversation.status === 'closed';

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 bg-white/90 backdrop-blur-md gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AnonymousAvatar role={conversation.otherRole} />
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
              {conversation.item.title}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-indigo-600">{conversation.otherRole}</span>
              <span>•</span>
              {isClosed ? (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Closed</span>
              ) : (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Exchange
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          to={`/items/${conversation.item._id}`}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 transition-colors shrink-0"
        >
          View Item →
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/60">
        {messages.map((msg, idx) => {
          const isMine = msg.sender === currentUser._id || msg.sender === currentUser.id;
          const showRole = idx === 0 || messages[idx - 1].sender !== msg.sender;

          return (
            <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMine && showRole && (
                  <span className="text-[11px] font-bold text-slate-400 mb-1 ml-1">{conversation.otherRole}</span>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed shadow-xs ${
                    isMine
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none'
                      : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
                <div className={`text-[10px] text-slate-400 mt-1 flex items-center gap-1 ${isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMine && msg.readAt && (
                    <span className="text-indigo-500 font-bold ml-0.5">✓✓</span>
                  )}
                  {isMine && !msg.readAt && (
                    <span className="text-slate-400 font-bold ml-0.5">✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 text-slate-500 px-3.5 py-2 rounded-2xl rounded-bl-none text-xs flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
              <span className="italic ml-1">{conversation.otherRole} is typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100">
        {isClosed ? (
          <div className="text-center text-xs text-slate-400 py-2 bg-slate-50 rounded-xl">
            🔒 This conversation is closed because the item has been returned.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <textarea
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message (Enter to send, Shift+Enter for newline)..."
              className="flex-1 resize-none border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 bg-slate-50 hover:bg-white transition-all block max-h-28"
              rows="1"
            />
            <button
              type="submit"
              disabled={!content.trim()}
              className="btn-primary py-2.5 px-4 text-xs font-bold shrink-0 disabled:opacity-40"
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
