import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<{
  requestId: string;
  userId?: string;
  traceId?: string;
}>();

export interface LogContext {
  requestId: string;
  userId?: string;
  traceId?: string;
  service?: string;
  file?: string;
  line?: number;
  [key: string]: unknown;
}

export function getLogContext(): LogContext | undefined {
  return asyncLocalStorage.getStore();
}

export function runWithContext<T>(
  context: LogContext,
  fn: () => T
): T {
  return asyncLocalStorage.run(context, fn);
}

function createPinoLogger() {
  const baseLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label) => ({ level: label }),
      bindings: () => ({}),
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  });

  return baseLogger;
}

const pinoLogger = createPinoLogger();

function formatMessage(
  message: string,
  context?: LogContext
): { message: string; context: Record<string, unknown> } {
  const formattedContext: Record<string, unknown> = {
    service: context?.service || process.env.SERVICE_NAME || 'owntube-api',
  };

  if (context?.requestId) {
    formattedContext.requestId = context.requestId;
  }

  if (context?.userId) {
    formattedContext.userId = context.userId;
  }

  if (context?.traceId) {
    formattedContext.traceId = context.traceId;
  }

  if (context?.file) {
    formattedContext.file = context.file;
  }

  if (context?.line) {
    formattedContext.line = context.line;
  }

  return { message, context: formattedContext };
}

export const log = {
  error(
    message: string,
    error?: Error | unknown,
    context?: Partial<LogContext>
  ): void {
    const { message: formattedMessage, context: formattedContext } = formatMessage(
      message,
      context as LogContext | undefined
    );

    if (error instanceof Error) {
      pinoLogger.error({
        ...formattedContext,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
      }, formattedMessage);
    } else if (error) {
      pinoLogger.error({ ...formattedContext, error }, formattedMessage);
    } else {
      pinoLogger.error(formattedContext, formattedMessage);
    }
  },

  warn(
    message: string,
    context?: Partial<LogContext>
  ): void {
    const { message: formattedMessage, context: formattedContext } = formatMessage(
      message,
      context as LogContext | undefined
    );
    pinoLogger.warn(formattedContext, formattedMessage);
  },

  info(
    message: string,
    context?: Partial<LogContext>
  ): void {
    const { message: formattedMessage, context: formattedContext } = formatMessage(
      message,
      context as LogContext | undefined
    );
    pinoLogger.info(formattedContext, formattedMessage);
  },

  debug(
    message: string,
    context?: Partial<LogContext>
  ): void {
    const { message: formattedMessage, context: formattedContext } = formatMessage(
      message,
      context as LogContext | undefined
    );
    pinoLogger.debug(formattedContext, formattedMessage);
  },

  child(bindings: Record<string, unknown>): pino.Logger {
    return pinoLogger.child(bindings);
  },
};

export function createRequestLogger(requestId: string, userId?: string, traceId?: string) {
  return {
    error: (message: string, error?: Error | unknown, extra?: Record<string, unknown>) => {
      const ctx = { requestId, userId, traceId, ...extra };
      if (error instanceof Error) {
        log.error(message, error, ctx);
      } else {
        log.error(message, error as Error | undefined, ctx);
      }
    },
    warn: (message: string, extra?: Record<string, unknown>) => {
      log.warn(message, { requestId, userId, traceId, ...extra });
    },
    info: (message: string, extra?: Record<string, unknown>) => {
      log.info(message, { requestId, userId, traceId, ...extra });
    },
    debug: (message: string, extra?: Record<string, unknown>) => {
      log.debug(message, { requestId, userId, traceId, ...extra });
    },
  };
}

export type RequestLogger = ReturnType<typeof createRequestLogger>;

/** Structured app logger (alias of `log` for legacy imports) */
export const logger = log;