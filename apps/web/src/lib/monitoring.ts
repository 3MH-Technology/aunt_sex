import { logger } from "./logger";

interface ErrorPayload {
  message: string;
  code?: string;
  stack?: string;
  userId?: string;
  route?: string;
  method?: string;
  severity?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, unknown>;
}

class MonitoringService {
  private enabled = !!process.env.SENTRY_DSN;

  captureError(payload: ErrorPayload) {
    const {
      message,
      code,
      stack,
      userId,
      route,
      method,
      severity = "medium",
      metadata,
    } = payload;

    logger.error(`[${severity.toUpperCase()}] ${code || "ERROR"}: ${message}`, {
      userId,
      route: `${method || "UNKNOWN"} ${route || ""}`,
      stack,
      ...metadata,
    });

    if (severity === "critical" || severity === "high") {
      this.sendAlert(payload);
    }
  }

  private sendAlert(payload: ErrorPayload) {
    if (!this.enabled) return;
    try {
      const Sentry = require("@sentry/nextjs");
      Sentry.captureException(new Error(payload.message), {
        tags: { code: payload.code, severity: payload.severity },
        user: payload.userId ? { id: payload.userId } : undefined,
        extra: payload.metadata,
      });
    } catch {}
  }

  setUser(userId: string, email?: string) {
    if (!this.enabled) return;
    try {
      const Sentry = require("@sentry/nextjs");
      Sentry.setUser({ id: userId, email });
    } catch {}
  }

  clearUser() {
    if (!this.enabled) return;
    try {
      const Sentry = require("@sentry/nextjs");
      Sentry.setUser(null);
    } catch {}
  }
}

export const monitoring = new MonitoringService();
