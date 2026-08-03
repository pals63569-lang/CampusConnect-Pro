const winston = require("winston");
const path = require("path");
const config = require("../config/env");

const logFormat = winston.format.printf(({ level, message, timestamp, requestId, stack }) => {
  const reqStr = requestId ? ` [ReqID: ${requestId}]` : "";
  return `${timestamp} [${level.toUpperCase()}]${reqStr}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: config.env === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "campusconnect-pro" },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/combined.log"),
    }),
  ],
});

if (config.env !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        logFormat
      ),
    })
  );
}

module.exports = logger;

