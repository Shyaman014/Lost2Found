import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId, callback) {
    if (this.socket) {
      this.socket.emit('conversation:join', conversationId, callback);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('conversation:leave', conversationId);
    }
  }

  sendMessage(conversationId, content, callback) {
    if (this.socket) {
      this.socket.emit('message:send', { conversationId, content }, callback);
    }
  }

  startTyping(conversationId) {
    if (this.socket) {
      this.socket.emit('typing:start', conversationId);
    }
  }

  stopTyping(conversationId) {
    if (this.socket) {
      this.socket.emit('typing:stop', conversationId);
    }
  }

  markAsRead(conversationId) {
    if (this.socket) {
      this.socket.emit('message:read', conversationId);
    }
  }

  // Listeners
  onNewMessage(callback) {
    if (this.socket) this.socket.on('message:new', callback);
  }
  offNewMessage(callback) {
    if (this.socket) this.socket.off('message:new', callback);
  }

  onTypingStart(callback) {
    if (this.socket) this.socket.on('typing:start', callback);
  }
  offTypingStart(callback) {
    if (this.socket) this.socket.off('typing:start', callback);
  }

  onTypingStop(callback) {
    if (this.socket) this.socket.on('typing:stop', callback);
  }
  offTypingStop(callback) {
    if (this.socket) this.socket.off('typing:stop', callback);
  }

  onMessageRead(callback) {
    if (this.socket) this.socket.on('message:read', callback);
  }
  offMessageRead(callback) {
    if (this.socket) this.socket.off('message:read', callback);
  }
}

const socketService = new SocketService();
export default socketService;
