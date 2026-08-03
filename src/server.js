const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const config = require('../config/env');
const logger = require('../utils/logger');
const connectDB = require('../config/db');
const { initSocketServer } = require('./sockets/socketServer');
const { startReminderService } = require('../services/reminderService');

// Initialize Database Connection
connectDB();

const httpServer = http.createServer(app);

// Initialize Socket.IO Real-time Gateway
initSocketServer(httpServer);

const PORT = config.port;
let server;

if (config.env !== 'test') {
  server = httpServer.listen(PORT, () => {
    logger.info(`======================================`);
    logger.info(`🚀 CampusConnect Pro Server Started`);
    logger.info(`🌐 Port : ${PORT}`);
    logger.info(`🛢️ Environment : ${config.env}`);
    logger.info(`❤️ Health Check : http://localhost:${PORT}/health`);
    logger.info(`📚 Swagger Docs : http://localhost:${PORT}/api-docs`);
    logger.info(`⚡ WebSockets   : Enabled (Socket.IO)`);
    logger.info(`======================================`);

    startReminderService();
  });
}

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Gracefully closing HTTP server and connections...`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      mongoose.connection.close(false, () => {
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, server: httpServer };
