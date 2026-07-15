const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const logger = require('../config/logger');

const userSockets = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const isLocalhostOrIP =
          origin.startsWith('http://localhost') ||
          origin.startsWith('http://127.0.0.1') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://172.');

        if (isLocalhostOrIP || origin === process.env.CLIENT_URL || process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const accessSecret = process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret_key_12345';
      const decoded = jwt.verify(token, accessSecret);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      if (user.isBlocked) {
        return next(new Error('Account suspended'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      logger.error(`Socket authentication error: ${err}`);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.data.user;
    const userId = user._id.toString();

    logger.info(`Socket client connected: User ${user.username} (${userId})`);

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    socket.join(`user:${userId}`);

    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    io.emit('presence:update', { userId, isOnline: true });

    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
      logger.debug(`Socket ${socket.id} joined chat room chat:${chatId}`);
    });

    socket.on('typing:status', ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit('typing:status', { chatId, userId, isTyping });
    });

    socket.on('message:receipt', async ({ messageId, chatId, status }) => {
      socket.to(`chat:${chatId}`).emit('message:receipt_update', { messageId, userId, status });
    });

    socket.on('call:request', ({ targetUserId, type, chatName }) => {
      logger.info(`Call requested from ${user.username} to User ${targetUserId} (${type})`);
      socket.to(`user:${targetUserId}`).emit('call:request', {
        callerId: userId,
        callerName: user.displayName || user.username,
        callerAvatar: user.avatar,
        type,
        chatName,
      });
    });

    socket.on('call:accept', ({ callerId }) => {
      logger.info(`Call accepted by ${userId} from Caller ${callerId}`);
      socket.to(`user:${callerId}`).emit('call:accept', { calleeId: userId });
    });

    socket.on('call:reject', ({ callerId }) => {
      logger.info(`Call rejected by ${userId} from Caller ${callerId}`);
      socket.to(`user:${callerId}`).emit('call:reject', { calleeId: userId });
    });

    socket.on('call:hangup', ({ targetUserId }) => {
      socket.to(`user:${targetUserId}`).emit('call:hangup');
    });

    socket.on('permission:request', ({ targetUserId }) => {
      logger.info(`Chat permission requested from User ${userId} to User ${targetUserId}`);
      socket.to(`user:${targetUserId}`).emit('permission:request_received', {
        requesterId: userId,
        requesterName: user.displayName || user.username,
        requesterAvatar: user.avatar,
      });
    });

    socket.on('permission:accept', async ({ requesterId }) => {
      logger.info(`Chat permission accepted by User ${userId} for Requester ${requesterId}`);
      try {
        const existingChat = await Chat.findOne({
          type: 'direct',
          participants: { $all: [requesterId, userId] },
        }).populate('participants', 'username displayName avatar email isOnline e2ePublicKey');

        if (existingChat) {
          io.to(`user:${requesterId}`).emit('permission:approved', existingChat);
          io.to(`user:${userId}`).emit('permission:approved', existingChat);
          return;
        }

        const chat = new Chat({
          type: 'direct',
          participants: [requesterId, userId],
        });
        await chat.save();

        const populatedChat = await Chat.findById(chat._id).populate(
          'participants',
          'username displayName avatar email isOnline e2ePublicKey'
        );

        io.to(`user:${requesterId}`).emit('permission:approved', populatedChat);
        io.to(`user:${userId}`).emit('permission:approved', populatedChat);
      } catch (err) {
        logger.error(`Error in permission:accept: ${err.message}`);
      }
    });

    socket.on('permission:decline', ({ requesterId }) => {
      logger.info(`Chat permission declined by User ${userId} for Requester ${requesterId}`);
      socket.to(`user:${requesterId}`).emit('permission:denied', { targetUserId: userId });
    });

    socket.on('webrtc:ice-candidate', ({ targetUserId, candidate }) => {
      socket.to(`user:${targetUserId}`).emit('webrtc:ice-candidate', { senderId: userId, candidate });
    });

    socket.on('webrtc:offer', ({ targetUserId, offer }) => {
      socket.to(`user:${targetUserId}`).emit('webrtc:offer', { senderId: userId, offer });
    });

    socket.on('webrtc:answer', ({ targetUserId, answer }) => {
      socket.to(`user:${targetUserId}`).emit('webrtc:answer', { senderId: userId, answer });
    });

    socket.on('whiteboard:draw', ({ workspaceId, drawAction }) => {
      socket.to(`workspace:${workspaceId}`).emit('whiteboard:draw', drawAction);
    });

    socket.on('whiteboard:clear', ({ workspaceId }) => {
      socket.to(`workspace:${workspaceId}`).emit('whiteboard:clear');
    });

    socket.on('workspace:join', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      logger.debug(`Socket joined workspace:${workspaceId}`);
    });

    socket.on('note:typing', ({ noteId, workspaceId, content }) => {
      socket.to(`workspace:${workspaceId}`).emit('note:typing', { noteId, content, updaterId: userId });
    });

    socket.on('disconnect', async () => {
      logger.info(`Socket client disconnected: User ${user.username} (${userId})`);

      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
          io.emit('presence:update', { userId, isOnline: false, lastSeen: new Date() });
        }
      }
    });
  });

  return io;
};

const isUserOnline = (userId) => {
  const sockets = userSockets.get(userId);
  return sockets ? sockets.size > 0 : false;
};

module.exports = {
  initSocket,
  isUserOnline,
};
