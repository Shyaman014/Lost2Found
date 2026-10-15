import { Server } from 'socket.io';
import * as cookie from 'cookie';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { createNotification } from '../services/notificationService.js';

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
      const parseCookie = cookie.parseCookie || cookie.parse;
      const rawCookie = socket.request.headers.cookie || socket.handshake?.headers?.cookie || '';
      const cookies = parseCookie(rawCookie);
      let token = cookies.jwt || socket.handshake?.auth?.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // JWT is signed with { userId, role } — must use decoded.userId
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (!user.isActive) {
        return next(new Error('Authentication error: Account is inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('[Socket Auth Error]', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join a private room for the user to receive targeted real-time notifications
    socket.join(`user:${socket.user._id}`);
    
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
        const roomName = `conversation:${conversationId}`;
        io.to(roomName).emit('message:new', message);

        if (callback) callback({ success: true, message });

        // Determine if the recipient is actively in the room. If not, send a notification.
        const recipientId = conversation.participants.find(
          (p) => p.toString() !== socket.user._id.toString()
        );

        if (recipientId) {
          const socketsInRoom = await io.in(roomName).fetchSockets();
          const isRecipientInRoom = socketsInRoom.some(
            (s) => s.user && s.user._id.toString() === recipientId.toString()
          );

          if (!isRecipientInRoom) {
            await createNotification({
              recipient: recipientId,
              type: 'new_message',
              title: 'New Message',
              message: `You have a new message regarding ${conversation.item?.title || 'an item'}.`,
              actionUrl: `/messages/${conversationId}`,
              relatedConversation: conversationId,
              relatedItem: conversation.item,
            });
          }
        }
      } catch (error) {
        console.error('[Socket Message Error]', error);
        if (callback) callback({ error: 'Failed to send message' });
      }
    });

    // Handle typing indicators (requires active conversation participant authorization)
    socket.on('typing:start', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation || conversation.status !== 'active') return;

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        );
        if (!isParticipant) return;

        socket.to(`conversation:${conversationId}`).emit('typing:start', {
          conversationId,
        });
      } catch (err) {
        console.error('[Socket Typing Start Error]', err.message);
      }
    });

    socket.on('typing:stop', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation || conversation.status !== 'active') return;

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        );
        if (!isParticipant) return;

        socket.to(`conversation:${conversationId}`).emit('typing:stop', {
          conversationId,
        });
      } catch (err) {
        console.error('[Socket Typing Stop Error]', err.message);
      }
    });

    // Handle read receipts (requires participant authorization)
    socket.on('message:read', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) return;

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        );
        if (!isParticipant) return;

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
