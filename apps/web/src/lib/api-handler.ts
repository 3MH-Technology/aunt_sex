import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ServiceError, AuthError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { monitoring } from "@/lib/monitoring";
import { rateLimit } from "@/lib/rate-limit";

type HandlerContext = {
  userId: string;
  userEmail: string;
  userRole: string;
};

type ApiHandler<T = unknown> = (
  req: Request,
  context: HandlerContext & { params: T }
) => Promise<NextResponse>;

type RateLimitConfig = {
  windowMs?: number;
  max?: number;
};

async function applyRateLimit(
  req: Request,
  prefix: string,
  config?: RateLimitConfig
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`${prefix}:${ip}`, config);
  if (rl.limited) {
    throw new ServiceError("RATE_LIMITED", "طلبات كثيرة جداً. حاول مرة أخرى لاحقاً.", 429);
  }
}

export function withAuth<T = unknown>(
  handler: ApiHandler<T>,
  options?: { requireAdmin?: boolean; rateLimit?: RateLimitConfig }
) {
  return async (req: Request, context?: { params: T }) => {
    try {
      if (options?.rateLimit) {
        await applyRateLimit(req, "api", options.rateLimit);
      }

      const session = await getServerSession(authOptions);
      const email = session?.user?.email;
      if (!email) throw new AuthError();

      const userId = (session.user as Record<string, unknown>).id as string;
      const userRole = (session.user as Record<string, unknown>).role as string;
      const params = (context?.params ?? {}) as T;

      if (options?.requireAdmin && userRole !== "admin") {
        monitoring.captureError({
          message: "Unauthorized admin access attempt",
          code: "FORBIDDEN",
          userId,
          route: req.url,
          method: req.method,
          severity: "high",
        });
        return NextResponse.json(
          { error: "يتطلب صلاحية مدير" },
          { status: 403 }
        );
      }

      monitoring.setUser(userId, email);
      return handler(req, { userId, userEmail: email, userRole, params });
    } catch (error) {
      return handleError(error);
    }
  };
}

export function withOptionalAuth<T = unknown>(
  handler: (req: Request, context: { userId?: string; params: T }) => Promise<NextResponse>,
  options?: { rateLimit?: RateLimitConfig }
) {
  return async (req: Request, context?: { params: T }) => {
    try {
      if (options?.rateLimit) {
        await applyRateLimit(req, "api", options.rateLimit);
      }

      const session = await getServerSession(authOptions);
      const userId = (session?.user as Record<string, unknown>)?.id as string | undefined;
      const params = (context?.params ?? {}) as T;
      return handler(req, { userId, params });
    } catch (error) {
      return handleError(error);
    }
  };
}

export function withRateLimit(
  handler: (req: Request) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (req: Request) => {
    try {
      await applyRateLimit(req, "public", config);
      return handler(req);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof ServiceError) {
    if (error.statusCode >= 500) {
      monitoring.captureError({
        message: error.message,
        code: error.code,
        severity: "high",
        metadata: { details: error.details },
      });
    }
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error("Unhandled API error", { error: message, stack });

  monitoring.captureError({
    message,
    code: "INTERNAL_ERROR",
    stack,
    severity: "critical",
  });

  return NextResponse.json(
    { error: "حدث خطأ داخلي" },
    { status: 500 }
  );
}
