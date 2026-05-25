import { NextResponse } from "next/server";
import { maintenanceService } from "@/services/MaintenanceService";
import { handleError } from "@/lib/api-handler";
import { cronJobDurationMs, cronJobRecordsProcessed, recordCoingateOperation } from "@/lib/metrics";
import { createRequestLogger } from "@/lib/logger";

export async function POST(req: Request) {
  const startTime = Date.now();
  const requestLogger = createRequestLogger(
    req.headers.get("x-request-id") || crypto.randomUUID()
  );

  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requestLogger.info("Starting maintenance cron job");

    const results = await maintenanceService.runAll();
    const duration = Date.now() - startTime;

    const totalRecordsProcessed =
      results.subscriptionsCleaned +
      results.sessionsCleaned +
      results.tokensCleaned +
      results.streamsMarkedOffline;
    if (totalRecordsProcessed > 0) {
      cronJobRecordsProcessed.inc({ job: "maintenance" }, totalRecordsProcessed);
    }

    cronJobDurationMs.observe({ job: "maintenance" }, duration);
    recordCoingateOperation('cron', 'maintenance', 'success', duration);

    requestLogger.info("Maintenance cron job completed", {
      results,
      totalRecordsProcessed,
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      results,
      totalRecordsProcessed,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    cronJobDurationMs.observe({ job: "maintenance" }, duration);
    recordCoingateOperation('cron', 'maintenance', 'error', duration);

    requestLogger.error(
      "Maintenance cron job failed",
      error instanceof Error ? error : new Error(String(error)),
      { durationMs: duration }
    );

    return handleError(error);
  }
}

export async function GET(req: Request) {
  return POST(req);
}