const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");

// Connect MongoDB
connectDB();

const app = express();

// Hide Express Information
app.disable("x-powered-by");

// ================================
// Security Middleware
// ================================

app.use(cors());

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "https:", "data:", "blob:"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.jsdelivr.net",
          "https://code.jquery.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:"
        ],
        connectSrc: [
          "'self'",
          "https:"
        ]
      }
    }
  })
);

app.use(mongoSanitize());

app.use(xss());

// ================================
// Rate Limiter
// ================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

app.use("/api", limiter);

// ================================
// Body Parser
// ================================

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ================================
// Static Folders
// ================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.static(path.join(__dirname, "public")));

// ================================
// Health Check
// ================================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    project: "CampusConnect Pro",
    status: "Running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date()
  });
});

// ================================
// API Routes
// ================================

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/events", require("./routes/eventRoutes"));

app.use("/api/registrations", require("./routes/registrationRoutes"));

app.use("/api/volunteers", require("./routes/volunteerRoutes"));

app.use("/api/quizzes", require("./routes/quizRoutes"));

app.use("/api/polls", require("./routes/pollRoutes"));

app.use("/api/rewards", require("./routes/rewardRoutes"));

app.use("/api/forum", require("./routes/forumRoutes"));

app.use("/api/feedback", require("./routes/feedbackRoutes"));

app.use("/api/gallery", require("./routes/galleryRoutes"));

app.use("/api/dashboards", require("./routes/dashboardRoutes"));

app.use("/api/notifications", require("./routes/notificationRoutes"));

// ================================
// Frontend Routes
// ================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    return next();
  }

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================================
// 404 Handler
// ================================

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found"
  });
});

// ================================
// Global Error Handler
// ================================

app.use(errorHandler);

// ================================
// Server
// ================================

const PORT = process.env.PORT || 3000;

const { startReminderService } = require('./services/reminderService');

app.listen(PORT, () => {
  console.log("======================================");
  console.log("🚀 CampusConnect Pro Server Started");
  console.log(`🌐 Port : ${PORT}`);
  console.log(`🛢️ Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`❤️ Health Check : http://localhost:${PORT}/health`);
  console.log("======================================");

  // Initialize reminder scheduler
  startReminderService();
});