import { Prisma, CoinLedgerReason } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { log, createRequestLogger } from "@/lib/logger";
import { InsufficientCoinsError } from "@/lib/errors";
import { traceCoingateDeduct, traceCoingateCredit, getSpanContext, addSpanAttributes } from "@/lib/tracing";
import {
  recordCoingateOperation,
  updateCoinsCirculationGauge,
  coingateBalanceDrift,
} from "@/lib/metrics";

type TxClient = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

async function lockAndEnsureBalance(tx: TxClient, userId: string): Promise<number> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { coins: true },
  });
  const initialAmount = user?.coins ?? 0;

  const inserted = await tx.$queryRawUnsafe<Array<{ amount: number }>>(
    `INSERT INTO "CoinBalance" ("userId", "amount", "version", "updatedAt")
     VALUES ($1, $2, 1, NOW())
     ON CONFLICT ("userId") DO NOTHING
     RETURNING amount`,
    userId,
    initialAmount
  );

  if (inserted.length > 0) {
    if (initialAmount > 0) {
      await tx.coinLedgerEntry.create({
        data: {
          id: randomUUID(),
          userId,
          amount: initialAmount,
          balanceBefore: 0,
          balanceAfter: initialAmount,
          reason: CoinLedgerReason.ADMIN_ADJUSTMENT,
          metadata: JSON.stringify({ note: "legacy migration from User.coins" }),
        },
      });
    }
    return initialAmount;
  }

  const rows = await tx.$queryRawUnsafe<Array<{ amount: number }>>(
    'SELECT amount FROM "CoinBalance" WHERE "userId" = $1 FOR UPDATE',
    userId
  );
  return rows[0].amount;
}

export async function getBalance(userId: string, tx?: TxClient): Promise<number> {
  const client = tx ?? db;
  const balance = await client.coinBalance.findUnique({ where: { userId } });
  if (balance) return balance.amount;
  const user = await client.user.findUnique({ where: { id: userId }, select: { coins: true } });
  return user?.coins ?? 0;
}

export async function deductCoins(
  tx: TxClient,
  userId: string,
  amount: number,
  reason: CoinLedgerReason,
  referenceId?: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  return traceCoingateDeduct(userId, amount, reason, async (span) => {
    const startTime = Date.now();
    const traceCtx = getSpanContext();
    const requestLogger = createRequestLogger(
      randomUUID(),
      userId,
      traceCtx?.traceId
    );

    addSpanAttributes(span, {
      'user.id': userId,
      'coin.amount': amount,
      'operation.reason': reason,
      'reference.id': referenceId || '',
    });

    const idempotencyKey = randomUUID();
    const currentBalance = await lockAndEnsureBalance(tx, userId);

    if (currentBalance < amount) {
      const duration = Date.now() - startTime;
      recordCoingateOperation('deduct', reason, 'insufficient_funds', duration);
      coingateBalanceDrift.set({ userId }, 0);

      requestLogger.warn(
        "Insufficient coins for deduction",
        { amount, reason, balance: currentBalance, idempotencyKey }
      );

      span.setAttribute('error.type', 'insufficient_funds');
      throw new InsufficientCoinsError(currentBalance, amount);
    }

    const balanceAfter = currentBalance - amount;

    await tx.coinBalance.update({
      where: { userId },
      data: { amount: balanceAfter, version: { increment: 1 } },
    });

    await tx.coinLedgerEntry.create({
      data: {
        id: idempotencyKey,
        userId,
        amount: -amount,
        balanceBefore: currentBalance,
        balanceAfter,
        reason,
        referenceId,
        metadata: metadata ? JSON.stringify(metadata) : "{}",
      },
    });

    const duration = Date.now() - startTime;
    recordCoingateOperation('deduct', reason, 'success', duration);
    coingateBalanceDrift.set({ userId }, 0);

    requestLogger.info(
      "CoinGate deduction completed",
      { amount, reason, referenceId, idempotencyKey, balanceAfter, durationMs: duration }
    );

    span.setAttribute('result.balance_after', balanceAfter);
    span.setAttribute('result.idempotency_key', idempotencyKey);

    return idempotencyKey;
  });
}

export async function creditCoins(
  tx: TxClient,
  userId: string,
  amount: number,
  reason: CoinLedgerReason,
  referenceId?: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  return traceCoingateCredit(userId, amount, reason, async (span) => {
    const startTime = Date.now();
    const traceCtx = getSpanContext();
    const requestLogger = createRequestLogger(
      randomUUID(),
      userId,
      traceCtx?.traceId
    );

    addSpanAttributes(span, {
      'user.id': userId,
      'coin.amount': amount,
      'operation.reason': reason,
      'reference.id': referenceId || '',
    });

    const idempotencyKey = randomUUID();
    const currentBalance = await lockAndEnsureBalance(tx, userId);
    const balanceAfter = currentBalance + amount;

    await tx.coinBalance.update({
      where: { userId },
      data: { amount: balanceAfter, version: { increment: 1 } },
    });

    await tx.coinLedgerEntry.create({
      data: {
        id: idempotencyKey,
        userId,
        amount,
        balanceBefore: currentBalance,
        balanceAfter,
        reason,
        referenceId,
        metadata: metadata ? JSON.stringify(metadata) : "{}",
      },
    });

    const duration = Date.now() - startTime;
    recordCoingateOperation('credit', reason, 'success', duration);
    coingateBalanceDrift.set({ userId }, 0);

    requestLogger.info(
      "CoinGate credit completed",
      { amount, reason, referenceId, idempotencyKey, balanceAfter, durationMs: duration }
    );

    span.setAttribute('result.balance_after', balanceAfter);
    span.setAttribute('result.idempotency_key', idempotencyKey);

    return idempotencyKey;
  });
}

export async function withCoinGate<T>(
  userId: string,
  cost: number,
  reason: CoinLedgerReason,
  action: (tx: TxClient) => Promise<T>,
  options?: { referenceId?: string; metadata?: Record<string, unknown> }
): Promise<{ result: T; idempotencyKey: string }> {
  const requestLogger = createRequestLogger(randomUUID(), userId);

  return traceCoingateDeduct(userId, cost, reason, async (span) => {
    addSpanAttributes(span, {
      'operation.type': 'withCoinGate',
      'metadata': JSON.stringify(options?.metadata || {}),
    });

    requestLogger.info("CoinGate withCoinGate started", { cost, reason, options });

    const [holds, critical] = await Promise.all([
      db.fraudHold.count({ where: { userId, releasedAt: null } }),
      db.fraudSignal.count({ where: { userId, reviewed: false, severity: "CRITICAL" } }),
    ]);

    if (holds > 0) {
      requestLogger.warn("Account has active fraud holds", { holdCount: holds });
      span.setAttribute('error.type', 'fraud_holds_active');
      throw new Error("Account has active fraud holds");
    }
    if (critical > 0) {
      requestLogger.warn("Account has unresolved critical fraud signals", { signalCount: critical });
      span.setAttribute('error.type', 'critical_fraud_signals');
      throw new Error("Account has unresolved critical fraud signals");
    }

    let idempotencyKey!: string;
    const result = await db.$transaction(async (tx) => {
      idempotencyKey = await deductCoins(tx, userId, cost, reason, options?.referenceId, options?.metadata);
      return action(tx);
    }, { isolationLevel: "ReadCommitted" });

    requestLogger.info("CoinGate withCoinGate completed", { idempotencyKey, result: 'success' });
    return { result, idempotencyKey };
  });
}

export async function reconcileAllBalances(): Promise<{ ok: number; drift: number }> {
  const requestLogger = createRequestLogger(randomUUID());

  requestLogger.info("Starting balance reconciliation");
  const users = await db.user.findMany({ select: { id: true } });
  let drift = 0;
  let maxDrift = 0;
  let driftedUserId = '';

  for (const user of users) {
    const ledgerSum = await db.coinLedgerEntry.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    });
    const balance = await db.coinBalance.findUnique({ where: { userId: user.id } });
    const expected = ledgerSum._sum.amount ?? 0;
    const actual = balance?.amount ?? 0;
    const diff = actual - expected;

    coingateBalanceDrift.set({ userId: user.id }, diff);

    if (diff !== 0) {
      drift++;
      if (Math.abs(diff) > Math.abs(maxDrift)) {
        maxDrift = diff;
        driftedUserId = user.id;
      }
      requestLogger.warn(
        "Balance drift detected",
        { userId: user.id, expected, actual, diff }
      );
    }
  }

  requestLogger.info(
    "Balance reconciliation completed",
    { total: users.length, ok: users.length - drift, drift, maxDrift, maxDriftUserId: driftedUserId }
  );

  return { ok: users.length - drift, drift };
}

export async function updateCirculationTotal(): Promise<number> {
  const total = await updateCoinsCirculationGauge();
  log.info("Circulation total updated", { service: 'coingate', total });
  return total;
}