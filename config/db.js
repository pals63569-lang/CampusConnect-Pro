const mongoose = require("mongoose");
const config = require("./env");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
  } catch (error) {
    logger.error("❌ MongoDB Connection Failed:", error);
    if (config.env === "test") {
      mongoose.set('bufferCommands', false);
      logger.warn("⚠️ Continuing test execution without active MongoDB connection...");
    } else {
      process.exit(1);
    }
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("⚠️ MongoDB disconnected. Attempting reconnection...");
});

mongoose.connection.on("error", (err) => {
  logger.error("❌ Mongoose connection error:", err);
});

module.exports = connectDB;