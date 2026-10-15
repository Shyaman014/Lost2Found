import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import aiService from '../services/aiService';

// ── Simple inline markdown renderer ─────────────────────────────────────────
// Converts **bold** and *italic* in AI responses to JSX without a dependency.
const renderMarkdown = (text) => {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **...**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/s);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }
  return parts;
};

// ── Render message lines preserving newlines ─────────────────────────────────
const MessageText = ({ text }) => {
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, i) => (
        <span key={i}>
          {renderMarkdown(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AIChatbot = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Hi! I\'m the Lost2Found AI Assistant powered by Google Gemini. I can help you find lost or found items on campus. What are you looking for?',
    },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const messagesEndRef = useRef(null);

  const MAX_CHARS = 500;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setInput(val);
      setCharCount(val.length);
    }
  };

  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();
      if (!input.trim() || loading) return;

      const userMessage = input.trim();
      setInput('');
      setCharCount(0);

      // Append user message immediately for responsiveness
      setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
      setLoading(true);

      try {
        // Send history *before* the current message (already appended above)
        const response = await aiService.chat(userMessage, messages);

        if (response.success) {
          const aiText = response.data.reply;
          setMessages((prev) => [
            ...prev,
            {
              role:     'ai',
              text:     aiText,
              fallback: response.data.fallback,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'ai',
              text: response.message || "Sorry, I'm having trouble connecting right now. Please try again.",
            },
          ]);
        }
      } catch (error) {
        const status = error.response?.status;
        let errText;

        if (status === 429) {
          errText =
            "You've sent a lot of messages! Please wait a few minutes before trying again.";
        } else if (status === 400) {
          errText =
            error.response?.data?.message ||
            'Your message could not be processed. Please try rephrasing it.';
        } else {
          errText =
            error.response?.data?.message ||
            "Sorry, something went wrong. Please try again in a moment.";
        }

        setMessages((prev) => [...prev, { role: 'ai', text: errText }]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'ai',
        text: "Hi! I'm the Lost2Found AI Assistant. How can I help you today?",
      },
    ]);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 w-[calc(100vw-2rem)] sm:w-96 max-w-sm flex flex-col overflow-hidden transition-all duration-300 h-[480px] sm:h-[520px] max-h-[82vh]">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h3 className="font-semibold text-sm leading-tight">Lost2Found AI</h3>
                <p className="text-indigo-200 text-xs leading-tight">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                title="Clear conversation"
                className="text-indigo-200 hover:text-white transition-colors p-1 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-indigo-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4 text-sm">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : `bg-white border text-slate-700 rounded-bl-sm shadow-sm ${
                          msg.fallback ? 'border-amber-200 bg-amber-50' : 'border-slate-200'
                        }`
                  }`}
                >
                  <MessageText text={msg.text} />
                  {msg.fallback && (
                    <p className="text-xs text-amber-600 mt-1.5 opacity-75">
                      ⚡ Fallback mode — AI service temporarily unavailable
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about a lost or found item…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                  style={{ maxHeight: '96px', overflowY: 'auto' }}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end flex-shrink-0"
              >
                <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            {charCount > MAX_CHARS * 0.8 && (
              <p className={`text-xs mt-1 text-right ${charCount >= MAX_CHARS ? 'text-red-500' : 'text-slate-400'}`}>
                {charCount}/{MAX_CHARS}
              </p>
            )}
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group relative"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute right-full mr-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm">
            Ask AI Assistant
          </span>
        </button>
      )}
    </div>
  );
};

export default AIChatbot;
