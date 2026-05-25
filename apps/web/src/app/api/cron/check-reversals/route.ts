import { NextResponse } from "next/server";
import { checkAllReversalRates } from "@/services/FraudDetectionService";
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

    requestLogger.info("Starting check-reversals cron job");

    const result = await checkAllReversalRates();
    const duration = Date.now() - startTime;

    cronJobRecordsProcessed.inc({ job: "check-reversals" }, result.checked);
    cronJobDurationMs.observe({ job: "check-reversals" }, duration);
    recordCoingateOperation('cron', 'check_reversals', 'success', duration);

    requestLogger.info("check-reversals cron job completed", {
      recordsChecked: result.checked,
      signalsGenerated: result.signals,
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      recordsChecked: result.checked,
      signalsGenerated: result.signals,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    cronJobDurationMs.observe({ job: "check-reversals" }, duration);
    recordCoingateOperation('cron', 'check_reversals', 'error', duration);

    requestLogger.error(
      "check-reversals cron job failed",
      error instanceof Error ? error : new Error(String(error)),
      { durationMs: duration }
    );

    return handleError(error);
  }
}

export async function GET(req: Request) {
  return POST(req);
}