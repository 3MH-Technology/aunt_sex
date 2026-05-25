import { NextResponse } from "next/server";
import { analyzeGiftGraph } from "@/services/FraudDetectionService";
import { handleError } from "@/lib/api-handler";
import { cronJobDurationMs, cronJobRecordsProcessed, recordCoingateOperation } from "@/lib/metrics";
import { createRequestLogger } from "@/lib/logger";


export const dynamic = "force-dynamic";

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

    requestLogger.info("Starting analyze-gifts cron job");

    const result = await analyzeGiftGraph();
    const duration = Date.now() - startTime;

    cronJobRecordsProcessed.inc({ job: "analyze-gifts" }, result.analyzed);
    cronJobDurationMs.observe({ job: "analyze-gifts" }, duration);
    recordCoingateOperation('cron', 'analyze_gifts', 'success', duration);

    requestLogger.info("analyze-gifts cron job completed", {
      edgesAnalyzed: result.analyzed,
      cyclesDetected: result.cycles,
      starPatterns: result.stars,
      signalsGenerated: result.signals,
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      edgesAnalyzed: result.analyzed,
      cyclesDetected: result.cycles,
      starPatterns: result.stars,
      signalsGenerated: result.signals,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    cronJobDurationMs.observe({ job: "analyze-gifts" }, duration);
    recordCoingateOperation('cron', 'analyze_gifts', 'error', duration);

    requestLogger.error(
      "analyze-gifts cron job failed",
      error instanceof Error ? error : new Error(String(error)),
      { durationMs: duration }
    );

    return handleError(error);
  }
}

export async function GET(req: Request) {
  return POST(req);
}