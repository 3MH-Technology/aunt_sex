import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { db } from '@/lib/db';

export const metricsRegistry = new Registry();

collectDefaultMetrics({ register: metricsRegistry });

// ============================================================================
// COINGATE METRICS
// ============================================================================

export const coingateOperationsTotal = new Counter({
  name: 'coingate_operations_total',
  help: 'Total number of CoinGate operations',
  labelNames: ['operation', 'reason', 'status'],
  registers: [metricsRegistry],
});

export const coingateOperationDurationMs = new Histogram({
  name: 'coingate_operation_duration_ms',
  help: 'Duration of CoinGate operations in milliseconds',
  labelNames: ['operation', 'reason'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [metricsRegistry],
});

export const coingateInsufficientFundsTotal = new Counter({
  name: 'coingate_insufficient_funds_total',
  help: 'Total number of insufficient funds errors',
  labelNames: ['reason'],
  registers: [metricsRegistry],
});

export const coingateDuplicateTxTotal = new Counter({
  name: 'coingate_duplicate_tx_total',
  help: 'Total number of duplicate transaction rejections (idempotency hits)',
  registers: [metricsRegistry],
});

export const coingateBalanceDrift = new Gauge({
  name: 'coingate_balance_drift',
  help: 'Balance drift (should always be 0, non-zero indicates accounting error)',
  labelNames: ['userId'],
  registers: [metricsRegistry],
});

// ============================================================================
// FRAUD DETECTION METRICS
// ============================================================================

export const fraudSignalsTotal = new Counter({
  name: 'fraud_signals_total',
  help: 'Total number of fraud signals detected',
  labelNames: ['type', 'severity'],
  registers: [metricsRegistry],
});

export const fraudHoldsActive = new Gauge({
  name: 'fraud_holds_active',
  help: 'Number of active fraud holds (frozen coins)',
  labelNames: ['reason'],
  registers: [metricsRegistry],
});

export const fraudDetectionLatencyMs = new Histogram({
  name: 'fraud_detection_latency_ms',
  help: 'Duration of fraud detection checks in milliseconds',
  labelNames: ['detector'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [metricsRegistry],
});

// ============================================================================
// CRON JOB METRICS
// ============================================================================

export const cronJobDurationMs = new Histogram({
  name: 'cron_job_duration_ms',
  help: 'Duration of cron jobs in milliseconds',
  labelNames: ['job'],
  buckets: [100, 250, 500, 1000, 2500, 5000, 10000, 30000, 60000],
  registers: [metricsRegistry],
});

export const cronJobRecordsProcessed = new Counter({
  name: 'cron_job_records_processed',
  help: 'Number of records processed by cron jobs',
  labelNames: ['job'],
  registers: [metricsRegistry],
});

// ============================================================================
// ECONOMY METRICS
// ============================================================================

export const coinsCirculationTotal = new Gauge({
  name: 'coins_circulation_total',
  help: 'Total coins in circulation (in the economy)',
  registers: [metricsRegistry],
});

// ============================================================================
// PAYMENT METRICS
// ============================================================================

export const paymentWebhookProcessedTotal = new Counter({
  name: 'payment_webhook_processed_total',
  help: 'Total number of payment webhooks processed',
  labelNames: ['gateway', 'status'],
  registers: [metricsRegistry],
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function updateCoinsCirculationGauge(): Promise<number> {
  try {
    const result = await db.$queryRaw<[{ total: bigint }]>`
      SELECT COALESCE(SUM(balance), 0)::bigint as total
      FROM "User"
    `;
    const total = Number(result[0]?.total ?? 0);
    coinsCirculationTotal.set(total);
    return total;
  } catch (error) {
    console.error('Failed to update coins circulation gauge:', error);
    return 0;
  }
}

export async function updateFraudHoldsGauge(): Promise<void> {
  try {
    const fraudHolds = await db.fraudHold.groupBy({
      by: ['reason'],
      _count: true,
    });

    const currentHolds = await fraudHoldsGaugeValue();
    for (const [reason] of currentHolds) {
      fraudHoldsActive.set({ reason }, 0);
    }

    for (const hold of fraudHolds) {
      fraudHoldsActive.set({ reason: hold.reason }, hold._count);
    }
  } catch (error) {
    console.error('Failed to update fraud holds gauge:', error);
  }
}

const fraudHoldsGaugeValue = (() => {
  const cache = new Map<string, number>();
  return async () => {
    try {
      const result = await metricsRegistry.getSingleMetricAsString('fraud_holds_active');
      const lines = result.split('\n');
      for (const line of lines) {
        const match = line.match(/\{reason="([^"]+)"\}\s+([\d.]+)/);
        if (match) {
          cache.set(match[1], parseFloat(match[2]));
        }
      }
    } catch {
      // Metric not yet registered
    }
    return cache;
  };
})();

export function recordCoingateOperation(
  operation: 'deduct' | 'credit' | 'cron',
  reason: string,
  status: 'success' | 'error' | 'insufficient_funds' | 'duplicate',
  durationMs: number
): void {
  coingateOperationsTotal.inc({ operation, reason, status });
  coingateOperationDurationMs.observe({ operation, reason }, durationMs);

  if (status === 'insufficient_funds') {
    coingateInsufficientFundsTotal.inc({ reason });
  } else if (status === 'duplicate') {
    coingateDuplicateTxTotal.inc();
  }
}

export function recordFraudSignal(
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): void {
  fraudSignalsTotal.inc({ type, severity });
}

export function recordPaymentWebhook(
  gateway: 'stripe' | 'maxelpay',
  status: 'success' | 'error' | 'skipped'
): void {
  paymentWebhookProcessedTotal.inc({ gateway, status });
}