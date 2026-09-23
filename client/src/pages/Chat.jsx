import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import chatService from '../services/chatService';
import socketService from '../services/socketService';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Initialize socket and fetch conversations
  useEffect(() => {
    fetchConversations();
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Handle specific conversation loading
  useEffect(() => {
    if (id) {
      fetchConversationData(id);
      socketService.joinConversation(id, (res) => {
        if (res?.error) {
          console.error(res.error);
          navigate('/messages');
        }
      });

      // Socket Listeners for the active conversation
      socketService.onNewMessage(handleNewMessage);
      socketService.onTypingStart(handleTypingStart);
      socketService.onTypingStop(handleTypingStop);
      socketService.onMessageRead(handleMessageRead);

      return () => {
        socketService.leaveConversation(id);
        socketService.offNewMessage(handleNewMessage);
        socketService.offTypingStart(handleTypingStart);
        socketService.offTypingStop(handleTypingStop);
        socketService.offMessageRead(handleMessageRead);
      };
    } else {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [id]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await chatService.getConversations();
      if (res.success) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationData = async (convId) => {
    try {
      const [convRes, msgRes] = await Promise.all([
        chatService.getConversation(convId),
        chatService.getMessages(convId)
      ]);

      if (convRes.success) setCurrentConversation(convRes.data.conversation);
      if (msgRes.success) setMessages(msgRes.data.messages);

      // Mark messages read if any unread
      await chatService.markMessagesRead(convId);
      
      // Update local unread count in sidebar
      setConversations(prev => prev.map(c => 
        c._id === convId ? { ...c, unreadCount: 0 } : c
      ));

    } catch (err) {
      console.error(err);
      navigate('/messages');
    }
  };

  // Socket Handlers
  const handleNewMessage = (msg) => {
    if (id && msg.conversation === id) {
      setMessages(prev => [...prev, msg]);
      
      // Mark it read immediately since we are in the active conversation
      if (msg.sender !== currentUser._id) {
        socketService.markAsRead(id);
      }
    }

    // Update conversation list with latest message and unread count
    setConversations(prev => {
      let updated = [...prev];
      const idx = updated.findIndex(c => c._id === msg.conversation);
      
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          latestMessage: msg,
          lastMessageAt: msg.createdAt,
          unreadCount: (msg.conversation !== id && msg.sender !== currentUser._id) 
            ? updated[idx].unreadCount + 1 
            : updated[idx].unreadCount
        };
        // Sort newest to top
        updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      } else {
        // If it's a completely new conversation we don't have yet, we could refetch
        fetchConversations();
      }
      return updated;
    });
  };

  const handleTypingStart = ({ conversationId, senderId }) => {
    if (id === conversationId && senderId !== currentUser._id) {
      setIsTyping(true);
      if (typingTimeout) clearTimeout(typingTimeout);
      setTypingTimeout(setTimeout(() => setIsTyping(false), 3000));
    }
  };

  const handleTypingStop = ({ conversationId, senderId }) => {
    if (id === conversationId && senderId !== currentUser._id) {
      setIsTyping(false);
      if (typingTimeout) clearTimeout(typingTimeout);
    }
  };

  const handleMessageRead = ({ conversationId, readAt }) => {
    if (id === conversationId) {
      setMessages(prev => prev.map(m => 
        (!m.readAt && m.sender === currentUser._id) ? { ...m, readAt } : m
      ));
    }
  };

  // UI Actions
  const handleSendMessage = (content) => {
    socketService.sendMessage(id, content, (res) => {
      if (res?.error) {
        console.error(res.error);
        alert(res.error);
      } else if (res?.success) {
        // Optimistically add message or rely on broadcast
        // The server currently broadcasts to everyone in the room (including sender) 
        // via `io.to().emit()`, so handleNewMessage will catch it.
      }
    });
  };

  const handleTypingStartUi = () => {
    if (id) socketService.startTyping(id);
  };

  const handleTypingStopUi = () => {
    if (id) socketService.stopTyping(id);
  };

  if (loading && !id) {
    return <div className="p-8 text-center">Loading conversations...</div>;
  }

  // Mobile layout detection (simple approach using CSS classes to hide/show)
  const isMobileDetailView = !!id;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-64px)] flex overflow-hidden bg-white shadow-sm border-x border-gray-200">
      {/* Sidebar List */}
      <div className={`w-full md:w-1/3 lg:w-1/4 h-full border-r border-gray-200 flex flex-col ${isMobileDetailView ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList conversations={conversations} currentId={id} />
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={`w-full md:flex-1 h-full flex flex-col ${!isMobileDetailView ? 'hidden md:flex' : 'flex'}`}>
        {id ? (
          <>
            {/* Mobile back button header extension */}
            <div className="md:hidden p-3 bg-gray-50 border-b border-gray-200 flex items-center">
              <button onClick={() => navigate('/messages')} className="text-indigo-600 font-medium text-sm flex items-center">
                ← Back to Messages
              </button>
            </div>
            <ChatWindow 
              conversation={currentConversation}
              messages={messages}
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStartUi}
              onTypingStop={handleTypingStopUi}
              isTyping={isTyping}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Your Conversations</h2>
            <p className="max-w-xs text-sm">Select a conversation from the left to view messages and coordinate the return of items.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
