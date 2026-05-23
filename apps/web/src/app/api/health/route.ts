import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (e) {
    checks.database = "error";
    logger.error("Health check - database failed", {
      error: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  const status = Object.values(checks).every((s) => s === "ok") ? "healthy" : "degraded";
  const statusCode = status === "healthy" ? 200 : 503;

  return NextResponse.json(
    { status, timestamp: new Date().toISOString(), checks },
    { status: statusCode }
  );
}
