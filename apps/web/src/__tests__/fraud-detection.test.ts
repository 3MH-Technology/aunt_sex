import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient, CoinLedgerReason, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import path from "path";

import {
  computeFingerprint,
  registerDeviceFingerprint,
  checkMultiAccount,
  analyzeGiftGraph,
  checkAllReversalRates,
  hasActiveFraudHolds,
  hasUnresolvedCriticalSignals,
  checkFraudBeforeAction,
} from "@/services/FraudDetectionService";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
type TxClient = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

vi.mock("@/lib/redis", () => ({
  redis: {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    get: vi.fn().mockResolvedValue(null),
  },
}));

async function seedUser(coins: number): Promise<string> {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      username: `fraud_${id.slice(0, 8)}`,
      email: `fraud_${id.slice(0, 8)}@test.com`,
      coins,
    },
  });
  return id;
}

async function insertLedgerEntry(
  userId: string,
  amount: number,
  reason: CoinLedgerReason,
  referenceId: string | null = null,
  balanceBefore = 100,
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CoinLedgerEntry" (id, "userId", amount, "balanceBefore", "balanceAfter", reason, "referenceId", metadata, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6::"CoinLedgerReason", $7, '{}', NOW())`,
    randomUUID(), userId, amount, balanceBefore, balanceBefore + amount, reason, referenceId,
  );
}

const CONFIG = { canvas: "test", webgl: "test", fonts: ["Arial"], timezone: "UTC", screen: "1920x1080" };
const CONFIG2 = { canvas: "test2", webgl: "test2", fonts: ["Arial"], timezone: "UTC+2", screen: "1366x768" };

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

describe("1. Device Fingerprint & Multi-Account Detection", () => {
  it("computeFingerprint produces a SHA-256 hash", () => {
    const fp = computeFingerprint(CONFIG);
    expect(fp).toHaveLength(64);
    expect(fp).toMatch(/^[a-f0-9]{64}$/);
  });

  it("registerDeviceFingerprint stores and returns existing if same fingerprint", async () => {
    const userId = await seedUser(100);
    const result1 = await registerDeviceFingerprint(userId, CONFIG, prisma);
    expect(result1).toBe("registered");

    const result2 = await registerDeviceFingerprint(userId, CONFIG, prisma);
    expect(result2).toBe("existing");

    const devices = await prisma.deviceFingerprint.findMany({ where: { userId } });
    expect(devices).toHaveLength(1);
  });

  it("checkMultiAccount detects sibling accounts via shared fingerprint", async () => {
    const user1 = await seedUser(100);
    const user2 = await seedUser(100);
    const hash = computeFingerprint(CONFIG);

    await prisma.deviceFingerprint.createMany({
      data: [
        { userId: user1, fingerprint: hash, isTrusted: false, riskScore: 0 },
        { userId: user2, fingerprint: hash, isTrusted: false, riskScore: 0 },
      ],
    });

    await insertLedgerEntry(user1, 10, CoinLedgerReason.SIGNUP_BONUS);
    await insertLedgerEntry(user2, 10, CoinLedgerReason.SIGNUP_BONUS);

    await checkMultiAccount(hash, prisma);

    const signals = await prisma.fraudSignal.findMany({
      where: { signalType: "MULTI_ACCOUNT_DETECTED" },
    });
    expect(signals.length).toBeGreaterThanOrEqual(2);

    const holds = await prisma.fraudHold.findMany({ where: { reason: "multi_account_sibling" } });
    expect(holds.length).toBeGreaterThanOrEqual(2);
  });
});

describe("2. Gift Graph Cycle Detection", () => {
  it("analyzeGiftGraph detects cycles with 3+ nodes", async () => {
    const a = await seedUser(1000);
    const b = await seedUser(1000);
    const c = await seedUser(1000);

    await insertLedgerEntry(a, -10, CoinLedgerReason.GIFT_SEND, b);
    await insertLedgerEntry(b, -10, CoinLedgerReason.GIFT_SEND, c);
    await insertLedgerEntry(c, -10, CoinLedgerReason.GIFT_SEND, a);

    const result = await analyzeGiftGraph(prisma);
    expect(result.analyzed).toBeGreaterThanOrEqual(3);
    expect(result.cycles).toBeGreaterThanOrEqual(1);

    const signals = await prisma.fraudSignal.findMany({
      where: { signalType: "CIRCULAR_GIFT_PATTERN" },
    });
    expect(signals.length).toBeGreaterThanOrEqual(3);
  });
});

describe("3. Reversal Rate Detection", () => {
  it("checkAllReversalRates flags users with >20% reversal rate", async () => {
    const userId = await seedUser(1000);

    await insertLedgerEntry(userId, -10, CoinLedgerReason.VIDEO_UPLOAD);
    await insertLedgerEntry(userId, -10, CoinLedgerReason.VIDEO_UPLOAD);
    await insertLedgerEntry(userId, -10, CoinLedgerReason.VIDEO_UPLOAD);
    await insertLedgerEntry(userId, -10, CoinLedgerReason.VIDEO_UPLOAD);
    await insertLedgerEntry(userId, 10, CoinLedgerReason.REVERSAL);
    await insertLedgerEntry(userId, 10, CoinLedgerReason.REVERSAL);

    const result = await checkAllReversalRates(prisma);
    expect(result.signals).toBeGreaterThanOrEqual(1);

    const signals = await prisma.fraudSignal.findMany({
      where: { userId, signalType: "HIGH_REVERSAL_RATE" },
    });
    expect(signals.length).toBeGreaterThanOrEqual(1);
  });
});

describe("4. Fraud Hold Pre-Action Guard", () => {
  it("hasActiveFraudHolds returns true when hold exists", async () => {
    const userId = await seedUser(100);
    await prisma.fraudHold.create({
      data: { userId, coinAmount: 0, reason: "test" },
    });
    expect(await hasActiveFraudHolds(prisma as unknown as TxClient, userId)).toBe(true);
  });

  it("hasActiveFraudHolds returns false after hold released", async () => {
    const userId = await seedUser(100);
    await prisma.fraudHold.create({
      data: { userId, coinAmount: 0, reason: "test", releasedAt: new Date() },
    });
    expect(await hasActiveFraudHolds(prisma as unknown as TxClient, userId)).toBe(false);
  });

  it("checkFraudBeforeAction throws when CRITICAL signal exists", async () => {
    const userId = await seedUser(100);
    await prisma.fraudSignal.create({
      data: { userId, signalType: "VELOCITY_EXCEEDED", severity: "CRITICAL" },
    });
    await expect(checkFraudBeforeAction(prisma as unknown as TxClient, userId))
      .rejects.toThrow("has unresolved critical fraud signals");
  });

  it("checkFraudBeforeAction passes when no holds or critical signals", async () => {
    const userId = await seedUser(100);
    await expect(checkFraudBeforeAction(prisma as unknown as TxClient, userId))
      .resolves.toBeUndefined();
  });
});

describe("5. Fingerprint Determinism", () => {
  it("same input always produces same hash", () => {
    expect(computeFingerprint(CONFIG)).toBe(computeFingerprint(CONFIG));
  });

  it("different inputs produce different hashes", () => {
    expect(computeFingerprint(CONFIG)).not.toBe(computeFingerprint(CONFIG2));
  });
});
