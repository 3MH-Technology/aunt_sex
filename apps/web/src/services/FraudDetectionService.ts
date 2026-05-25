import { PrismaClient, Prisma, FraudSignalType, SignalSeverity } from "@prisma/client";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { createRequestLogger } from "@/lib/logger";
import { createHash } from "crypto";
import {
  traceFraudVelocityCheck,
  traceFraudGraphAnalysis,
  traceFraudSignalDetection,
  getTracer,
  withSpan,
  addSpanAttributes,
  setSpanError,
} from "@/lib/tracing";
import {
  recordFraudSignal,
  fraudHoldsActive,
  fraudDetectionLatencyMs,
} from "@/lib/metrics";

type TxClient = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export function computeFingerprint(payload: {
  canvas?: string;
  webgl?: string;
  fonts?: string[];
  timezone?: string;
  screen?: string;
  userAgent?: string;
}): string {
  const raw = [
    payload.canvas ?? "",
    payload.webgl ?? "",
    (payload.fonts ?? []).sort().join(","),
    payload.timezone ?? "",
    payload.screen ?? "",
    payload.userAgent ?? "",
  ].join("|");
  return createHash("sha256").update(raw).digest("hex");
}

export async function registerDeviceFingerprint(
  userId: string,
  payload: { canvas?: string; webgl?: string; fonts?: string[]; timezone?: string; screen?: string },
  prismaClient?: PrismaClient
): Promise<"registered" | "existing"> {
  const requestLogger = createRequestLogger(
    process.env.REQUEST_ID || crypto.randomUUID(),
    userId
  );

  const p = prismaClient ?? db;
  const fingerprint = computeFingerprint(payload);

  return withSpan(getTracer('fraud'), 'fraud.register_device_fingerprint', {
    'user.id': userId,
    'fingerprint.hash': fingerprint.slice(0, 12),
  }, async (span) => {
    const existing = await p.deviceFingerprint.findUnique({
      where: { userId_fingerprint: { userId, fingerprint } },
    });

    if (existing) {
      requestLogger.info("Device fingerprint already registered", { fingerprint: fingerprint.slice(0, 12) + "..." });
      span.setAttribute('result', 'existing');
      return "existing";
    }

    await p.deviceFingerprint.create({
      data: { userId, fingerprint },
    });

    requestLogger.info("Device fingerprint registered", { fingerprint: fingerprint.slice(0, 12) + "..." });
    span.setAttribute('result', 'registered');

    return "registered";
  });
}

export async function checkMultiAccount(
  fingerprint: string,
  prismaClient?: PrismaClient
): Promise<void> {
  const requestLogger = createRequestLogger(
    process.env.REQUEST_ID || crypto.randomUUID()
  );

  return withSpan(getTracer('fraud'), 'fraud.check_multi_account', {
    'fingerprint.hash': fingerprint.slice(0, 12),
  }, async (span) => {
    const startTime = Date.now();
    const p = prismaClient ?? db;

    addSpanAttributes(span, { 'fingerprint.prefix': fingerprint.slice(0, 12) });

    const bonusClaimers = await p.$queryRawUnsafe<Array<{ userid: string }>>(
      `SELECT DISTINCT le."userId" AS userid
       FROM "CoinLedgerEntry" le
       JOIN "DeviceFingerprint" df ON df."userId" = le."userId"
       WHERE df.fingerprint = $1
         AND le.reason = 'SIGNUP_BONUS'`,
      fingerprint
    );

    addSpanAttributes(span, { 'sibling_accounts_found': bonusClaimers.length });

    if (bonusClaimers.length < 2) {
      fraudDetectionLatencyMs.observe({ detector: "checkMultiAccount" }, Date.now() - startTime);
      requestLogger.debug("Multi-account check passed", { fingerprint: fingerprint.slice(0, 12) + "...", siblingCount: bonusClaimers.length });
      return;
    }

    for (const row of bonusClaimers) {
      await p.fraudSignal.create({
        data: {
          userId: row.userid,
          signalType: "MULTI_ACCOUNT_DETECTED" as FraudSignalType,
          severity: "HIGH" as SignalSeverity,
          payload: { fingerprint, siblingAccounts: bonusClaimers.map((r) => r.userid) },
        },
      });
      recordFraudSignal("MULTI_ACCOUNT_DETECTED", "high");

      await p.fraudHold.create({
        data: {
          userId: row.userid,
          coinAmount: 0,
          reason: "multi_account_sibling",
        },
      });
      fraudHoldsActive.inc({ reason: "multi_account_sibling" });

      addSpanAttributes(span, { 'signal_created_for_user': row.userid });
    }

    requestLogger.warn("Multi-account detected", {
      fingerprint: fingerprint.slice(0, 12) + "...",
      siblingCount: bonusClaimers.length,
      affectedUsers: bonusClaimers.map(r => r.userid),
    });

    fraudDetectionLatencyMs.observe({ detector: "checkMultiAccount" }, Date.now() - startTime);
  });
}

export async function analyzeGiftGraph(prisma?: PrismaClient): Promise<{ analyzed: number; cycles: number; stars: number; signals: number }> {
  return traceFraudGraphAnalysis(async (span) => {
    const startTime = Date.now();
    const p = prisma ?? db;

    const edges = await p.$queryRawUnsafe<Array<{ from: string; to: string; weight: bigint }>>(
      `SELECT
         le."userId" AS "from",
         le."referenceId" AS "to",
         SUM(ABS(le.amount)) AS weight
       FROM "CoinLedgerEntry" le
       WHERE le.reason = 'GIFT_SEND'
         AND le."referenceId" IS NOT NULL
         AND le."createdAt" > NOW() - INTERVAL '7 days'
       GROUP BY le."userId", le."referenceId"
       HAVING SUM(ABS(le.amount)) > 0`
    );

    addSpanAttributes(span, { 'edges_analyzed': edges.length });

    if (edges.length < 3) {
      fraudDetectionLatencyMs.observe({ detector: "graph_analysis" }, Date.now() - startTime);
      return { analyzed: edges.length, cycles: 0, stars: 0, signals: 0 };
    }

    const outEdges = new Map<string, string[]>();
    const inEdges = new Map<string, string[]>();
    const weightMap = new Map<string, Map<string, number>>();

    for (const e of edges) {
      const to = e.to;
      if (to.length !== 36) continue;
      if (!outEdges.has(e.from)) outEdges.set(e.from, []);
      outEdges.get(e.from)!.push(to);
      if (!inEdges.has(to)) inEdges.set(to, []);
      inEdges.get(to)!.push(e.from);
      if (!weightMap.has(e.from)) weightMap.set(e.from, new Map());
      weightMap.get(e.from)!.set(to, Number(e.weight));
    }

    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>();
    const parent = new Map<string, string | null>();
    const allNodes = new Set([...outEdges.keys(), ...edges.map((e) => e.to).filter((id) => id.length === 36)]);

    for (const n of allNodes) color.set(n, WHITE);

    const cycles: string[][] = [];

    function dfs(u: string): void {
      color.set(u, GRAY);
      for (const v of outEdges.get(u) ?? []) {
        if (color.get(v) === GRAY) {
          const cycle: string[] = [v, u];
          let cur = u;
          while (cur !== v) {
            cur = parent.get(cur) ?? "";
            if (cur) cycle.push(cur);
          }
          cycles.push(cycle);
        } else if (color.get(v) === WHITE) {
          parent.set(v, u);
          dfs(v);
        }
      }
      color.set(u, BLACK);
    }

    for (const n of allNodes) {
      if (color.get(n) === WHITE) dfs(n);
    }

    addSpanAttributes(span, { 'cycles_detected': cycles.length });

    const flagged = new Set<string>();
    for (const cycle of cycles) {
      for (const uid of cycle) {
        if (flagged.has(uid)) continue;
        flagged.add(uid);
        await p.fraudSignal.create({
          data: {
            userId: uid,
            signalType: "CIRCULAR_GIFT_PATTERN" as FraudSignalType,
            severity: "MEDIUM" as SignalSeverity,
            payload: { cycle, detectedAt: new Date().toISOString() },
          },
        });
        recordFraudSignal("CIRCULAR_GIFT_PATTERN", "medium");
      }
    }

    if (flagged.size > 0) {
      addSpanAttributes(span, { 'users_flagged_cycles': flagged.size });
    }

    let starCount = 0;
    for (const [receiver, senders] of inEdges) {
      if (senders.length < 50) continue;
      if (outEdges.has(receiver) && outEdges.get(receiver)!.length > 0) continue;

      starCount++;
      const totalGifted = senders.reduce((sum, s) => sum + (weightMap.get(s)?.get(receiver) ?? 0), 0);

      await p.fraudSignal.create({
        data: {
          userId: receiver,
          signalType: "CIRCULAR_GIFT_PATTERN" as FraudSignalType,
          severity: "MEDIUM" as SignalSeverity,
          payload: {
            pattern: "star",
            senderCount: senders.length,
            totalCoins: totalGifted,
            detectedAt: new Date().toISOString(),
          },
        },
      });
      recordFraudSignal("CIRCULAR_GIFT_PATTERN", "medium");
    }

    addSpanAttributes(span, { 'star_patterns_detected': starCount });

    if (flagged.size > 0 || starCount > 0) {
      createRequestLogger(process.env.REQUEST_ID || crypto.randomUUID()).warn(
        "Gift graph analysis completed",
        { flaggedUsers: [...flagged], cycleCount: cycles.length, starCount }
      );
    }

    fraudDetectionLatencyMs.observe({ detector: "graph_analysis" }, Date.now() - startTime);
    return { analyzed: edges.length, cycles: cycles.length, stars: starCount, signals: flagged.size + starCount };
  });
}

const VELOCITY_WINDOWS = [
  { suffix: "1m", ttl: 70, limit: (isNew: boolean) => (isNew ? 1 : 3) },
  { suffix: "1h", ttl: 3700, limit: (isNew: boolean) => (isNew ? 3 : 10) },
  { suffix: "24h", ttl: 86500, limit: () => 50 },
] as const;

export async function checkVelocity(
  userId: string,
  userCreatedAt: Date,
  amount: number,
): Promise<boolean> {
  return traceFraudVelocityCheck(userId, 60, async (span) => {
    const startTime = Date.now();
    const requestLogger = createRequestLogger(process.env.REQUEST_ID || crypto.randomUUID(), userId);

    const isNew = Date.now() - userCreatedAt.getTime() < 7 * 86400_000;
    const key = `velocity:${userId}`;

    addSpanAttributes(span, {
      'user.is_new': isNew,
      'transaction.amount': amount,
      'user.age_days': Math.floor((Date.now() - userCreatedAt.getTime()) / 86400000),
    });

    for (const w of VELOCITY_WINDOWS) {
      const windowKey = `${key}:${w.suffix}`;
      const count = await redis.incr(windowKey);
      if (count === 1) {
        await redis.expire(windowKey, w.ttl);
      }
      const limit = w.limit(isNew);
      addSpanAttributes(span, { [`velocity_${w.suffix}_count`]: count, [`velocity_${w.suffix}_limit`]: limit });

      if (count > limit) {
        const { db } = await import("@/lib/db");
        await db.fraudSignal.create({
          data: {
            userId,
            signalType: "VELOCITY_EXCEEDED" as FraudSignalType,
            severity: "MEDIUM" as SignalSeverity,
            payload: { window: w.suffix, count, limit, amount, isNewUser: isNew },
          },
        });
        recordFraudSignal("VELOCITY_EXCEEDED", "medium");
        fraudDetectionLatencyMs.observe({ detector: "velocity_check" }, Date.now() - startTime);

        requestLogger.warn(
          "Velocity exceeded for user",
          { window: w.suffix, count, limit, amount, isNewUser: isNew }
        );

        span.setAttribute('result', 'blocked');
        span.setAttribute('blocked.window', w.suffix);
        span.setAttribute('blocked.count', count);
        span.setAttribute('blocked.limit', limit);
        return true;
      }
    }

    fraudDetectionLatencyMs.observe({ detector: "velocity_check" }, Date.now() - startTime);
    span.setAttribute('result', 'allowed');
    return false;
  });
}

export async function checkAllReversalRates(prisma?: PrismaClient): Promise<{ checked: number; signals: number }> {
  const p = prisma ?? db;
  return checkReversalRate(p);
}

async function checkReversalRate(p: PrismaClient): Promise<{ checked: number; signals: number }> {
  const requestLogger = createRequestLogger(process.env.REQUEST_ID || crypto.randomUUID());

  return withSpan(getTracer('fraud'), 'fraud.reversal_check', {}, async (span) => {
    const startTime = Date.now();
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);

    addSpanAttributes(span, { 'window_days': 7, 'window_start': sevenDaysAgo.toISOString() });

    const rows = await p.$queryRawUnsafe<
      Array<{ userid: string; reversalCount: bigint; totalActions: bigint }>
    >(
      `SELECT
         le."userId" AS userid,
         COUNT(*) FILTER (WHERE le.reason = 'REVERSAL') AS "reversalCount",
         COUNT(*) AS "totalActions"
       FROM "CoinLedgerEntry" le
       WHERE le."createdAt" >= $1
       GROUP BY le."userId"
       HAVING COUNT(*) FILTER (WHERE le.reason = 'REVERSAL') * 100 / COUNT(*) > 20`,
      sevenDaysAgo
    );

    addSpanAttributes(span, { 'users_with_high_reversals': rows.length });

    for (const row of rows) {
      await p.fraudSignal.create({
        data: {
          userId: row.userid,
          signalType: "HIGH_REVERSAL_RATE" as FraudSignalType,
          severity: "MEDIUM" as SignalSeverity,
          payload: {
            reversalCount: Number(row.reversalCount),
            totalActions: Number(row.totalActions),
            ratePct: Math.round(Number(row.reversalCount) / Number(row.totalActions) * 100),
            windowDays: 7,
          },
        },
      });
      recordFraudSignal("HIGH_REVERSAL_RATE", "medium");

      requestLogger.warn(
        "High reversal rate detected",
        { userId: row.userid, reversals: Number(row.reversalCount), total: Number(row.totalActions) }
      );

      addSpanAttributes(span, { [`high_reversal_user_${row.userid}`]: true });
    }

    fraudDetectionLatencyMs.observe({ detector: "reversal_check" }, Date.now() - startTime);
    return { checked: rows.length, signals: rows.length };
  });
}

export async function hasActiveFraudHolds(tx: TxClient, userId: string): Promise<boolean> {
  const holds = await tx.fraudHold.count({ where: { userId, releasedAt: null } });
  return holds > 0;
}

export async function hasUnresolvedCriticalSignals(tx: TxClient, userId: string): Promise<boolean> {
  const count = await tx.fraudSignal.count({
    where: { userId, reviewed: false, severity: "CRITICAL" as SignalSeverity },
  });
  return count > 0;
}

export async function checkFraudBeforeAction(
  tx: TxClient,
  userId: string,
): Promise<void> {
  const requestLogger = createRequestLogger(process.env.REQUEST_ID || crypto.randomUUID(), userId);

  return traceFraudSignalDetection(userId, 'pre_action_check', async (span) => {
    addSpanAttributes(span, { 'check_type': 'pre_action' });

    const [hasHolds, hasCritical] = await Promise.all([
      hasActiveFraudHolds(tx, userId),
      hasUnresolvedCriticalSignals(tx, userId),
    ]);

    addSpanAttributes(span, {
      'result.has_holds': hasHolds,
      'result.has_critical': hasCritical,
    });

    if (hasHolds) {
      requestLogger.warn("Pre-action fraud check failed: active holds", { userId });
      span.setAttribute('result', 'blocked_holds');
      throw new Error("Account has active fraud holds");
    }
    if (hasCritical) {
      requestLogger.warn("Pre-action fraud check failed: critical signals", { userId });
      span.setAttribute('result', 'blocked_critical');
      throw new Error("Account has unresolved critical fraud signals");
    }

    span.setAttribute('result', 'allowed');
  });
}