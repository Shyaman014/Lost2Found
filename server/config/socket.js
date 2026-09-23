import { Server } from 'socket.io';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.request.headers.cookie || '');
      const token = cookies.jwt;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('[Socket Auth Error]', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

    // Handle joining a conversation room
    socket.on('conversation:join', async (conversationId, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          if (callback) callback({ error: 'Conversation not found' });
          return;
        }

        // Verify user is a participant
        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        );

        if (!isParticipant) {
          if (callback) callback({ error: 'Unauthorized to join this conversation' });
          return;
        }

        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);
        // console.log(`User ${socket.user._id} joined room ${roomName}`);
        
        if (callback) callback({ success: true });
      } catch (error) {
        if (callback) callback({ error: 'Internal server error' });
      }
    });

    // Handle leaving a conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle sending a new message
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, content } = data;

        if (!content || !content.trim()) {
          if (callback) callback({ error: 'Message cannot be empty' });
          return;
        }

        if (content.length > 2000) {
          if (callback) callback({ error: 'Message exceeds maximum length' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          if (callback) callback({ error: 'Conversation not found' });
          return;
        }

        if (conversation.status !== 'active') {
          if (callback) callback({ error: 'Conversation is closed' });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        );

        if (!isParticipant) {
          if (callback) callback({ error: 'Unauthorized to send messages in this conversation' });
          return;
        }

        // Save to DB
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          content: content.trim(),
        });

        // Update conversation lastMessageAt
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Broadcast to the room
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        if (callback) callback({ success: true, message });
      } catch (error) {
        console.error('[Socket Message Error]', error);
        if (callback) callback({ error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        senderId: socket.user._id,
      });
    });

    socket.on('typing:stop', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        senderId: socket.user._id,
      });
    });

    // Handle read receipts
    socket.on('message:read', async (conversationId) => {
      try {
        // Mark all unread messages from the OTHER participant as read
        const result = await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.user._id },
            readAt: null,
          },
          {
            $set: { readAt: new Date() },
          }
        );

        if (result.modifiedCount > 0) {
          io.to(`conversation:${conversationId}`).emit('message:read', {
            conversationId,
            readBy: socket.user._id,
            readAt: new Date(),
          });
        }
      } catch (error) {
        console.error('[Socket Read Receipt Error]', error);
      }
    });

    socket.on('disconnect', () => {
      // console.log(`User disconnected: ${socket.user._id}`);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
