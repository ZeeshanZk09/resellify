/**
 * Production-safe logger utility
 * Replaces console.log statements throughout the app
 */

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isClient = typeof window !== "undefined";

  /**
   * Log general information (dev only)
   */
  log(message: string, data?: any, context?: string): void {
    if (this.isDevelopment) {
      this.output("log", message, data, context);
    }
  }

  /**
   * Log informational messages (dev only)
   */
  info(message: string, data?: any, context?: string): void {
    if (this.isDevelopment) {
      this.output("info", message, data, context);
    }
  }

  /**
   * Log warnings (always logged, sent to monitoring in production)
   */
  warn(message: string, data?: any, context?: string): void {
    this.output("warn", message, data, context);

    if (!this.isDevelopment && this.isClient) {
      this.sendToMonitoring("warn", message, data, context);
    }
  }

  /**
   * Log errors (always logged, sent to monitoring)
   */
  error(message: string, error?: any, context?: string): void {
    this.output("error", message, error, context);

    if (this.isClient) {
      this.sendToMonitoring("error", message, error, context);
    }
  }

  /**
   * Debug logging (dev only, more verbose)
   */
  debug(message: string, data?: any, context?: string): void {
    if (this.isDevelopment) {
      this.output("debug", message, data, context);
    }
  }

  /**
   * Output to console with formatting
   */
  private output(
    level: LogLevel,
    message: string,
    data?: any,
    context?: string,
  ): void {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : "";
    const fullMessage = `${timestamp} ${prefix} ${message}`;

    switch (level) {
      case "error":
        console.error(fullMessage, data || "");
        break;
      case "warn":
        console.warn(fullMessage, data || "");
        break;
      case "info":
        console.info(fullMessage, data || "");
        break;
      case "debug":
        console.debug(fullMessage, data || "");
        break;
      default:
        console.log(fullMessage, data || "");
    }
  }

  /**
   * Send logs to monitoring service (Sentry, LogRocket, etc.)
   */
  private sendToMonitoring(
    level: LogLevel,
    message: string,
    data?: any,
    context?: string,
  ): void {
    try {
      // TODO: Integrate with your monitoring service
      // Example with Sentry:
      // if (window.Sentry) {
      //   window.Sentry.captureMessage(message, {
      //     level: level === 'error' ? 'error' : 'warning',
      //     extra: { data, context }
      //   });
      // }

      // For now, send to your analytics endpoint
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "log_event",
          level,
          message,
          data,
          context,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail if analytics endpoint is unavailable
      });
    } catch {
      // Silently fail to avoid breaking the app
    }
  }

  /**
   * Create a structured log entry (for server-side logging)
   */
  createEntry(
    level: LogLevel,
    message: string,
    data?: any,
    context?: string,
  ): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };
  }
}

export const logger = new Logger();

/**
 * Helper for logging with context
 */
export function createLogger(context: string) {
  return {
    log: (message: string, data?: any) => logger.log(message, data, context),
    info: (message: string, data?: any) => logger.info(message, data, context),
    warn: (message: string, data?: any) => logger.warn(message, data, context),
    error: (message: string, error?: any) =>
      logger.error(message, error, context),
    debug: (message: string, data?: any) =>
      logger.debug(message, data, context),
  };
}

// Export for backward compatibility
export default logger;
