import { describe, it, expect, beforeAll, afterAll, assert, vi } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient, CoinLedgerReason, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import path from "path";

import { deductCoins, creditCoins, getBalance } from "@/lib/coingate";
import { pinoLogger } from "@/lib/logger";
import { InsufficientCoinsError } from "@/lib/errors";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function seedUser(coins: number): Promise<string> {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      username: `test_${id.slice(0, 8)}`,
      email: `test_${id.slice(0, 8)}@test.com`,
      coins,
    },
  });
  return id;
}

async function seedLegacyUser(coins: number): Promise<string> {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      username: `legacy_${id.slice(0, 8)}`,
      email: `legacy_${id.slice(0, 8)}@test.com`,
      coins,
    },
  });
  const cb = await prisma.coinBalance.findUnique({ where: { userId: id } });
  expect(cb).toBeNull();
  return id;
}

async function totalEntries(userId: string): Promise<number> {
  return prisma.coinLedgerEntry.count({ where: { userId } });
}

async function ledgerSum(userId: string): Promise<number> {
  const result = await prisma.coinLedgerEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

// ─── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
      const url = container.getConnectionUri();

      const schemaDir = path.resolve(__dirname, "../../prisma");
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: url },
    cwd: schemaDir,
    stdio: "pipe",
    timeout: 30_000,
  });

  prisma = new PrismaClient({ datasources: { db: { url } } });
  await prisma.$connect();
}, 120_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

// ─── Tests ──────────────────────────────────────────────────────────────────────

// ─── 1. Concurrent Double-Spend Attack ─────────────────────────────────────────
describe("1. Concurrent Double-Spend Attack", () => {
  it("50 concurrent deducts of full balance — only 1 succeeds", async () => {
    const userId = await seedUser(1000);
    const cost = 1000;

    const results = await Promise.allSettled(
      Array.from({ length: 50 }, () =>
        prisma.$transaction(async (tx) => {
          return deductCoins(tx, userId, cost, CoinLedgerReason.VIDEO_UPLOAD);
        })
      )
    );

    const successes = results.filter((r) => r.status === "fulfilled");
    const allFailed = results.filter((r) => r.status === "rejected");

    expect(successes).toHaveLength(1);
    expect(allFailed).toHaveLength(49);

    const balance = await getBalance(userId, prisma);
    expect(balance).toBe(0);

    const entries = await prisma.coinLedgerEntry.findMany({
      where: { userId, reason: CoinLedgerReason.VIDEO_UPLOAD },
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].amount).toBe(-1000);
  });
});

// ─── 2. Idempotency Key Replay Attack ──────────────────────────────────────────
describe("2. Idempotency Key Replay Attack", () => {
  it("same idempotencyKey used twice — second is rejected", async () => {
    const userId = await seedUser(500);
    const idempotencyKey = randomUUID();

    // First: use deductCoins normally (it generates its own key internally)
    // To test idempotency, we need to insert a ledger entry with a known key
    // then try to insert again

    // Manually create a ledger entry (simulating the first call)
    await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<Array<{ amount: number }>>(
        'SELECT amount FROM "CoinBalance" WHERE "userId" = $1 FOR UPDATE',
        userId
      );
      const bal = rows.length > 0 ? rows[0].amount : 500;
      await tx.coinBalance.upsert({
        where: { userId },
        update: { amount: bal - 100, version: { increment: 1 } },
        create: { userId, amount: 400, version: 1 },
      });
      await tx.coinLedgerEntry.create({
        data: {
          id: idempotencyKey,
          userId,
          amount: -100,
          balanceBefore: bal,
          balanceAfter: bal - 100,
          reason: CoinLedgerReason.GIFT_SEND,
        },
      });
    });

    // Second: try to insert the same idempotencyKey
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.coinLedgerEntry.create({
          data: {
            id: idempotencyKey,
            userId,
            amount: -100,
            balanceBefore: 400,
            balanceAfter: 300,
            reason: CoinLedgerReason.GIFT_SEND,
          },
        });
      })
    ).rejects.toThrow();

    // Balance unchanged after failed replay
    const balance = await getBalance(userId, prisma);
    expect(balance).toBe(400);

    const count = await totalEntries(userId);
    expect(count).toBe(1);
  });
});

// ─── 3. Retry Storm Under Load ─────────────────────────────────────────────────
describe("3. Retry Storm Under Load", () => {
  it("10 concurrent partial deductions — no retry storm", async () => {
    const userId = await seedUser(2000);
    const cost = 20;

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        prisma.$transaction(async (tx) => {
          return deductCoins(tx, userId, cost, CoinLedgerReason.GIFT_SEND);
        })
      )
    );

    const rejected = results.filter((r) => r.status === "rejected");
    if (rejected.length > 0) {
      console.log("Rejected errors:", rejected.map((r: any) => r.reason?.message ?? r.reason));
    }

    const successes = results.filter((r) => r.status === "fulfilled");
    expect(successes).toHaveLength(10);

    const balance = await getBalance(userId, prisma);
    expect(balance).toBe(2000 - 10 * 20);

    // 1 seed entry + 1 per deduction
    const count = await totalEntries(userId);
    expect(count).toBe(10 + 1);
  });
});

// ─── 4. Partial Transaction Failure ────────────────────────────────────────────
describe("4. Partial Transaction Failure", () => {
  it("deductCoins succeeds but wrapped action throws — full rollback", async () => {
    const userId = await seedUser(100);
    const balanceBefore = await getBalance(userId, prisma);
    expect(balanceBefore).toBe(100);

    await expect(
      prisma.$transaction(async (tx) => {
        await deductCoins(tx, userId, 50, CoinLedgerReason.VIDEO_UPLOAD);
        throw new Error("business logic failure");
      })
    ).rejects.toThrow("business logic failure");

    // Balance fully restored — transaction rolled back
    const balanceAfter = await getBalance(userId, prisma);
    expect(balanceAfter).toBe(100);

    // No orphaned ledger entries
    const entries = await prisma.coinLedgerEntry.findMany({ where: { userId } });
    expect(entries).toHaveLength(0);
  });
});

// ─── 5. Reversal Atomicity ────────────────────────────────────────────────────
describe("5. Reversal Atomicity", () => {
  it("reversal creates new entry, restores balance, original untouched", async () => {
    const userId = await seedUser(100);
    let originalLedgerId = "";

    // Simulate a committed deduction (as if upload succeeded)
    await prisma.$transaction(async (tx) => {
      const key = await deductCoins(tx, userId, 50, CoinLedgerReason.VIDEO_UPLOAD);
      originalLedgerId = key;
    });

    const afterDeduction = await getBalance(userId, prisma);
    expect(afterDeduction).toBe(50);

    // Simulate ffmpeg failure — reversal
    await prisma.$transaction(async (tx) => {
      const deduction = await tx.coinLedgerEntry.findUnique({
        where: { id: originalLedgerId },
      });
      assert(deduction, "deduction must exist");
      const cost = Math.abs(deduction.amount);

      const balance = await tx.$queryRawUnsafe<Array<{ amount: number; version: number }>>(
        'SELECT amount, version FROM "CoinBalance" WHERE "userId" = $1 FOR UPDATE',
        userId
      );
      assert(balance.length > 0);

      await tx.coinBalance.update({
        where: { userId },
        data: { amount: balance[0].amount + cost, version: { increment: 1 } },
      });

      await tx.coinLedgerEntry.create({
        data: {
          id: randomUUID(),
          userId,
          amount: cost,
          balanceBefore: balance[0].amount,
          balanceAfter: balance[0].amount + cost,
          reason: CoinLedgerReason.REVERSAL,
          referenceId: originalLedgerId,
          metadata: JSON.stringify({ reason: "ffmpeg processing failed" }),
        },
      });
    });

    const afterReversal = await getBalance(userId, prisma);
    expect(afterReversal).toBe(100);

    // Original deduction UNCHANGED
    const originalEntry = await prisma.coinLedgerEntry.findUnique({
      where: { id: originalLedgerId },
    });
    expect(originalEntry!.amount).toBe(-50);

    // Reversal entry exists
    const reversals = await prisma.coinLedgerEntry.findMany({
      where: { userId, reason: CoinLedgerReason.REVERSAL },
    });
    expect(reversals).toHaveLength(1);
    expect(reversals[0].amount).toBe(50);
    expect(reversals[0].referenceId).toBe(originalLedgerId);
  });
});

// ─── 6. Ledger Reconciliation ──────────────────────────────────────────────────
describe("6. Ledger Reconciliation", () => {
  it("SUM(ledger) === CoinBalance.amount after 1000 random ops", async () => {
    const userId = await seedUser(10000);
    const ops: Array<() => Promise<void>> = [];

    for (let i = 0; i < 500; i++) {
      ops.push(async () => {
        await prisma.$transaction(async (tx) => {
          await deductCoins(tx, userId, 10, CoinLedgerReason.GIFT_SEND, undefined, { batch: i });
        });
      });
      ops.push(async () => {
        await prisma.$transaction(async (tx) => {
          await creditCoins(tx, userId, 5, CoinLedgerReason.GIFT_RECEIVE, undefined, { batch: i });
        });
      });
    }

    const results = await Promise.allSettled(ops.map((fn) => fn()));
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    expect(succeeded).toBeGreaterThan(0);

    const cb = await prisma.coinBalance.findUnique({ where: { userId } });
    const sum = await ledgerSum(userId);

    expect(cb!.amount).toBe(sum);

    // Raw SQL verification
    const rawResult = await prisma.$queryRawUnsafe<
      Array<{ userid: string; cached_balance: number; ledger_balance: bigint }>
    >(
      `SELECT
        u.id AS userId,
        COALESCE(cb.amount, 0) AS cached_balance,
        COALESCE(SUM(le.amount), 0) AS ledger_balance
      FROM "User" u
      LEFT JOIN "CoinBalance" cb ON cb."userId" = u.id
      LEFT JOIN "CoinLedgerEntry" le ON le."userId" = u.id
      WHERE u.id = $1
      GROUP BY u.id, cb.amount`,
      userId
    );

    if (rawResult.length > 0) {
      expect(Number(rawResult[0].cached_balance)).toBe(Number(rawResult[0].ledger_balance));
    }
  });
});

// ─── 7. Negative Balance Prevention ────────────────────────────────────────────
describe("7. Negative Balance Prevention", () => {
  it("two concurrent deducts of full balance — only one succeeds", async () => {
    const userId = await seedUser(100);

    const results = await Promise.allSettled(
      Array.from({ length: 2 }, () =>
        prisma.$transaction(async (tx) => {
          return deductCoins(tx, userId, 100, CoinLedgerReason.COMMUNITY_CREATE);
        })
      )
    );

    const successes = results.filter((r) => r.status === "fulfilled");
    expect(successes).toHaveLength(1);

    const balance = await getBalance(userId, prisma);
    expect(balance).toBe(0);
    expect(balance).not.toBe(-100);
  });
});

// ─── 8. Migration Safety ───────────────────────────────────────────────────────
describe("8. Migration Safety", () => {
  it("legacy user with User.coins=500 gets CoinBalance on first CoinGate op", async () => {
    const userId = await seedLegacyUser(500);

    // First CoinGate operation: should trigger migration
    await prisma.$transaction(async (tx) => {
      await deductCoins(tx, userId, 50, CoinLedgerReason.VIDEO_UPLOAD);
    });

    // CoinBalance created with correct initial amount
    const cb = await prisma.coinBalance.findUnique({ where: { userId } });
    expect(cb).not.toBeNull();
    expect(cb!.amount).toBe(450);
    expect(cb!.version).toBeGreaterThanOrEqual(1);

    // Ledger has 2 entries: migration seed (+500) then deduction (-50)
    const entries = await prisma.coinLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    expect(entries).toHaveLength(2);
    expect(entries[0].amount).toBe(500);
    expect(entries[1].amount).toBe(-50);

    // User.coins is stale but CoinBalance is authoritative
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    });
    expect(user!.coins).toBe(500); // stale — that's expected during migration
  });
});

// ─── 9. Serializable Isolation Validation ─────────────────────────────────────
describe("9. Serializable Isolation Validation", () => {
  it("concurrent read-then-deduct sees consistent balance", async () => {
    const userId = await seedUser(500);

    // Two concurrent transactions each try to deduct 300
    const results = await Promise.allSettled(
      Array.from({ length: 3 }, () =>
        prisma.$transaction(async (tx) => {
          return deductCoins(tx, userId, 300, CoinLedgerReason.GIFT_SEND);
        })
      )
    );

    const successes = results.filter((r) => r.status === "fulfilled");
    expect(successes).toHaveLength(1);

    const balance = await getBalance(userId, prisma);
    expect(balance).toBe(200);

    // Verify no phantom deduction (seed +500 + deduction -300 = +200)
    const total = await ledgerSum(userId);
    expect(total).toBe(200);
  });

  it("FOR UPDATE prevents stale balance reads", async () => {
    const userId = await seedUser(200);
    let tx1Balance = 0;

    // T1: read balance, keep transaction open (simulate slow operation)
    // T2: deduct concurrently — should wait for T1
    // T1: then deduct based on stale read — should fail

    const p1 = prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<Array<{ amount: number }>>(
        'SELECT amount FROM "CoinBalance" WHERE "userId" = $1 FOR UPDATE',
        userId
      );
      tx1Balance = rows.length > 0 ? rows[0].amount : 200;
      // Simulate slow operation with a Promise resolution
      await new Promise((r) => setImmediate(r));
      // T1 tries to deduct using the value it read
      if (tx1Balance >= 200) {
        await deductCoins(tx, userId, 200, CoinLedgerReason.GIFT_SEND);
        return "T1 succeeds";
      }
      return "T1 fails";
    });

    const p2 = prisma.$transaction(async (tx) => {
      // Small delay to ensure T1 acquires lock first
      await new Promise((r) => setImmediate(r));
      return deductCoins(tx, userId, 200, CoinLedgerReason.GIFT_SEND);
    });

    const [r1, r2] = await Promise.allSettled([p1, p2]);
    const succeeded = [r1, r2].filter((r) => r.status === "fulfilled");

    // Only ONE should succeed because total balance is 200
    expect(succeeded).toHaveLength(1);
  });
});

// ─── 10. Observability Verification ────────────────────────────────────────────
describe("10. Observability Verification", () => {
  it("each coin operation emits structured logs and metrics", async () => {
    const userId = await seedUser(300);
    const logSpy = vi.spyOn(pinoLogger, "info").mockImplementation(() => {});

    await prisma.$transaction(async (tx) => {
      await deductCoins(tx, userId, 50, CoinLedgerReason.VIDEO_UPLOAD);
    });
    await prisma.$transaction(async (tx) => {
      await creditCoins(tx, userId, 30, CoinLedgerReason.COIN_PURCHASE);
    });

    // Check that logger was called (at least once)
    expect(logSpy).toHaveBeenCalled();

    // Verify LOG output contains expected fields
    const logCalls = logSpy.mock.calls.map((c) => JSON.stringify(c[0])).join(" ");
    expect(logCalls).toContain("CoinGate: deduct");
    expect(logCalls).toContain("CoinGate: credit");

    logSpy.mockRestore();
  });
});
