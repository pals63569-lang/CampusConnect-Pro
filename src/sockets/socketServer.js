const { Server } = require('socket.io');
const logger = require('../../utils/logger');
const config = require('../../config/env');

let io = null;

const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`⚡ Socket Client Connected: ${socket.id}`);

    socket.on('join_event', (eventId) => {
      socket.join(`event_${eventId}`);
      logger.info(`Socket ${socket.id} joined room event_${eventId}`);
    });

    socket.on('leave_event', (eventId) => {
      socket.leave(`event_${eventId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`⚡ Socket Client Disconnected: ${socket.id}`);
    });
  });

  logger.info('🚀 Socket.IO Server Initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    logger.warn('Socket.IO is not initialized yet');
  }
  return io;
};

const emitSeatUpdate = (eventId, availableSeats) => {
  if (io) {
    io.to(`event_${eventId}`).emit('seat_update', { eventId, availableSeats });
    io.emit('global_seat_update', { eventId, availableSeats });
  }
};

const emitEventCreated = (event) => {
  if (io) {
    io.emit('event_created', event);
  }
};

const emitNotification = (userId, notification) => {
  if (io) {
    io.emit(`notification_${userId}`, notification);
  }
};

module.exports = {
  initSocketServer,
  getIO,
  emitSeatUpdate,
  emitEventCreated,
  emitNotification,
};
