/**
 * CampusConnect-Pro - Enterprise Production Server
 * 
 * Production-ready server startup, database connection, real-time Socket.IO gateway,
 * security middleware stack, process lifecycle management, and graceful shutdown handlers.
 */

const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const app = require('./app');
const config = require('../config/env');
const logger = require('../utils/logger');
const { initSocketServer } = require('./sockets/socketServer');
const { startReminderService } = require('../services/reminderService');

// Port & Environment Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || config.env || 'development';
const MONGODB_URI = process.env.MONGODB_URI || config.mongodbUri || 'mongodb://127.0.0.1:27017/campusconnect_pro';
const CORS_ORIGIN = process.env.CORS_ORIGIN || config.corsOrigin || '*';

/**
 * Configure & Inject Enterprise Middleware and System Endpoints onto Express App
 */
const configureMiddlewaresAndRoutes = (expressApp) => {
  const initialStackLength = expressApp._router ? expressApp._router.stack.length : 0;

  // Logging & Security Middlewares
  expressApp.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
  expressApp.use(helmet({ crossOriginEmbedderPolicy: false }));
  expressApp.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  expressApp.use(compression());
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));
  expressApp.use(cookieParser());

  // Health Check Endpoint (GET /health)
  expressApp.get('/health', (req, res) => {
    return res.status(200).json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      success: true,
      message: 'CampusConnect Pro API is operational',
      data: {
        project: 'CampusConnect Pro',
        status: 'Operational',
        environment: NODE_ENV,
        uptime: `${process.uptime().toFixed(2)}s`,
        dbState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date(),
      },
    });
  });

  // Root Endpoint (GET /)
  expressApp.get('/', (req, res) => {
    return res.status(200).send('CampusConnect-Pro Enterprise API Running Successfully');
  });

  // Re-order router stack to place new middlewares & root/health routes at top
  if (expressApp._router && expressApp._router.stack) {
    const addedCount = expressApp._router.stack.length - initialStackLength;
    if (addedCount > 0) {
      const addedLayers = expressApp._router.stack.splice(initialStackLength, addedCount);
      expressApp._router.stack.unshift(...addedLayers);
    }
  }
};

// Apply enterprise configurations to app
configureMiddlewaresAndRoutes(app);

// Create HTTP Server & Initialize Real-Time WebSockets Gateway
const httpServer = http.createServer(app);
initSocketServer(httpServer);

let server = null;

/**
 * Centralized Server Startup Function
 * Connects to MongoDB first, then starts listening on the designated PORT.
 */
async function startServer() {
  try {
    // Wait for MongoDB Connection
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✓ MongoDB Connected');
    if (logger && logger.info) {
      logger.info('✓ MongoDB Connected');
    }

    // Start HTTP Server
    server = httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('✓ Server Running');
      console.log(`✓ Environment: ${NODE_ENV}`);
      console.log(`✓ Port: ${PORT}`);

      if (logger && logger.info) {
        logger.info('✓ Server Running');
        logger.info(`✓ Environment: ${NODE_ENV}`);
        logger.info(`✓ Port: ${PORT}`);
      }

      // Initialize Background Cron/Reminder Services if present
      if (typeof startReminderService === 'function') {
        try {
          startReminderService();
        } catch (serviceErr) {
          if (logger && logger.error) {
            logger.error('Failed to start reminder service:', serviceErr);
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ MongoDB Connection Failed / Server Startup Error:', error);
    if (logger && logger.error) {
      logger.error('❌ Server startup error:', error);
    }
    // Exit only when database connection or server start fails
    process.exit(1);
  }
}

/**
 * Graceful Shutdown Procedure
 * Handles server teardown without dropping active HTTP connections or DB queries.
 */
let isShuttingDown = false;
const gracefulShutdown = (signal, err) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);
  if (logger && logger.warn) {
    logger.warn(`Received ${signal}. Initiating graceful shutdown...`);
  }

  if (err) {
    console.error('Error causing shutdown:', err);
  }

  const forceTimeout = setTimeout(() => {
    console.error('Forced shutdown due to timeout (10s)');
    process.exit(1);
  }, 10000);

  const closeDbAndExit = async (code) => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log('✓ MongoDB connection closed');
        if (logger && logger.info) logger.info('✓ MongoDB connection closed');
      }
    } catch (dbErr) {
      console.error('Error closing MongoDB connection:', dbErr);
    } finally {
      clearTimeout(forceTimeout);
      process.exit(code);
    }
  };

  if (server && server.listening) {
    server.close(() => {
      console.log('✓ HTTP server closed');
      if (logger && logger.info) logger.info('✓ HTTP server closed');
      closeDbAndExit(err ? 1 : 0);
    });
  } else {
    closeDbAndExit(err ? 1 : 0);
  }
};

// Global Handlers for System Signals & Uncaught Failures
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION! 💥', error);
  gracefulShutdown('uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION! 💥', reason);
  gracefulShutdown('unhandledRejection', reason);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start Server in Non-Test Environments
if (NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server: httpServer };
