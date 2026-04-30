const socketIO = require('socket.io');
const logger = require('../utils/logger');

let io;

function initializeSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // logger.info(`Socket connected: ${socket.id}`);

    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined their room`);
    });

    socket.on('leave', (userId) => {
      socket.leave(`user:${userId}`);
      logger.info(`User ${userId} left their room`);
    });

    socket.on('join-post', (postId) => {
      socket.join(`post:${postId}`);
      logger.info(`Socket ${socket.id} joined post ${postId}`);
    });

    socket.on('leave-post', (postId) => {
      socket.leave(`post:${postId}`);
      logger.info(`Socket ${socket.id} left post ${postId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}


function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}


function emitNotification(userId, notification) {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
    logger.debug(`Notification emitted to user ${userId}`);
  }
}


function emitNewComment(postId, comment) {
  if (io) {
    io.to(`post:${postId}`).emit('new-comment', comment);
    logger.debug(`New comment emitted to post ${postId}`);
  }
}


function emitTrendUpdate(trend) {
  if (io) {
    io.emit('trend-update', trend);
    logger.debug('Trend update emitted');
  }
}

function emitPostCreated(userId, post) {
  if (io) {
    io.to(`user:${userId}`).emit('post-created', {
      postId: post._id,
      title: post.title,
      type: post.type,
      createdAt: post.createdAt,
      message: `Post "${post.title}" has been created successfully!`,
    });
    logger.debug(`Post created notification emitted to user ${userId}`);
  }
}

module.exports = {
  initializeSocket,
  getIO,
  emitNotification,
  emitNewComment,
  emitTrendUpdate,
  emitPostCreated,
};
