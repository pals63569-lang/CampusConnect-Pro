const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');

const config = require('../config/env');
const setupSwagger = require('../config/swagger');
const requestIdMiddleware = require('../middleware/requestId');
const responseTimeMiddleware = require('./middleware/responseTime');
const { errorHandler } = require('../middleware/errorMiddleware');
const ResponseFormatter = require('./utils/responseFormatter');

const Sentry = require('@sentry/node');
const { metricsMiddleware, getMetrics, getLiveness, getReadiness } = require('./utils/metrics');

const app = express();

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: config.env });
}

app.disable('x-powered-by');

// Observability & Metrics Middlewares
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);
app.use(metricsMiddleware);
app.use(compression());

// Prometheus & Health Probes
app.get('/metrics', getMetrics);
app.get('/health/liveness', getLiveness);
app.get('/health/readiness', getReadiness);

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'https:', 'data:', 'blob:'],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://cdn.jsdelivr.net',
          'https://code.jquery.com',
          'https://unpkg.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdn.jsdelivr.net',
          'https://cdnjs.cloudflare.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
      },
    },
  })
);

app.use(mongoSanitize());
app.use(xss());

// Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    errors: [],
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many login/registration attempts from this IP. Please try again later.',
    errors: [],
  },
});

app.use('/api', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Swagger Documentation
setupSwagger(app);

// Health Check Endpoint
app.get(['/health', '/api/v1/health'], (req, res) => {
  return ResponseFormatter.success(res, 'CampusConnect Pro API is operational', {
    project: 'CampusConnect Pro',
    status: 'Operational',
    environment: config.env,
    uptime: `${process.uptime().toFixed(2)}s`,
    memoryUsage: process.memoryUsage(),
    dbState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date(),
  });
});

// Route Imports
const authRoutes = require('../routes/authRoutes');
const eventRoutes = require('../routes/eventRoutes');
const registrationRoutes = require('../routes/registrationRoutes');
const volunteerRoutes = require('../routes/volunteerRoutes');
const quizRoutes = require('../routes/quizRoutes');
const pollRoutes = require('../routes/pollRoutes');
const rewardRoutes = require('../routes/rewardRoutes');
const forumRoutes = require('../routes/forumRoutes');
const feedbackRoutes = require('../routes/feedbackRoutes');
const galleryRoutes = require('../routes/galleryRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const searchRoutes = require('./routes/searchRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Mount Versioned Routes (/api/v1/*)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/registrations', registrationRoutes);
app.use('/api/v1/volunteers', volunteerRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/polls', pollRoutes);
app.use('/api/v1/rewards', rewardRoutes);
app.use('/api/v1/forum', forumRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/gallery', galleryRoutes);
app.use('/api/v1/dashboards', dashboardRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Backward Compatibility Routes Mapping (/api/*)
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);

// Frontend SPA Fallback
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/api-docs')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 404 Handler
app.use((req, res) => {
  return ResponseFormatter.error(res, `Route Not Found: ${req.originalUrl}`, [], 404);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
