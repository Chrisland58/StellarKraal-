import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { mkdirSync } from "fs";
import { config } from "../config";

const isProd = config.NODE_ENV === "production";

/**
 * Configure log rotation settings.
 * - LOG_MAX_SIZE: Maximum size of a single log file (e.g., "10m", "100m")
 * - LOG_MAX_FILES: Number of log files to retain before deleting older ones (e.g., "7" for 7 days)
 */
const LOG_DIR = path.join(process.cwd(), "backend", "logs");
const LOG_MAX_SIZE = config.LOG_MAX_SIZE || "10m";
const LOG_MAX_FILES = parseInt(config.LOG_MAX_FILES, 10) || 7;

// Ensure logs directory exists
try {
  mkdirSync(LOG_DIR, { recursive: true });
} catch (err) {
  // Directory may already exist
}

const transports: winston.transport[] = [new winston.transports.Console()];

// Add daily rotation file transport in production
if (isProd) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(LOG_DIR, "app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    })
  );
}

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: isProd
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    : winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
          const id = requestId ? ` [${requestId}]` : "";
          const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
          return `${timestamp} [${level}]${id}: ${message}${rest}`;
        })
      ),
  defaultMeta: { service: "stellarkraal-api" },
  transports,
});

/**
 * Create a child logger bound to a specific request ID.
 * @param requestId - The unique request identifier to attach to all log entries.
 * @returns A Winston child logger with the requestId field pre-set.
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

export default logger;
