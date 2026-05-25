import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { trace, context, SpanStatusCode, Span, SpanKind } from '@opentelemetry/api';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';

let sdk: NodeSDK | null = null;

export function initTracing(): NodeSDK {
  if (sdk) {
    return sdk;
  }

  const resource = new Resource({
    'service.name': process.env.SERVICE_NAME || 'owntube-api',
    'service.version': process.env.APP_VERSION || '1.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development',
    'service.instance.id': process.env.HOSTNAME || process.env.POD_NAME || 'local',
  });

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  });

  sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter as any, {
      maxQueueSize: 2048,
      maxExportBatchSize: 512,
      scheduledDelayMillis: 5000,
      exportTimeoutMillis: 30000,
    }),
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => {
          const url = (request as any)?.url || '';
          return ['/api/health', '/api/metrics', '/_next', '/favicon.ico'].some(p => url.startsWith(p));
        },
        requestHook: (span, request) => {
          const headers = (request as any).headers || {};
          span.setAttribute('http.request.header.traceparent', headers['traceparent'] || '');
          span.setAttribute('http.request.header.x-request-id', headers['x-request-id'] || '');
        },
        responseHook: (span, response) => {
          if (response.statusCode) {
            span.setAttribute('http.response.status_code', response.statusCode);
          }
        },
      }),
      new IORedisInstrumentation({
        dbStatementSerializer: (cmdName, cmdArgs) => {
          return `${cmdName}:${cmdArgs.slice(0, 5).join(' ')}`;
        },
      }),
      new UndiciInstrumentation(),
      new PrismaInstrumentation(),
      ...getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
        '@opentelemetry/instrumentation-grpc': { enabled: false },
        '@opentelemetry/instrumentation-graphql': { enabled: false },
        '@opentelemetry/instrumentation-mongodb': { enabled: false },
        '@opentelemetry/instrumentation-mysql': { enabled: false },
        '@opentelemetry/instrumentation-pg': { enabled: false },
        '@opentelemetry/instrumentation-winston': { enabled: false },
      }),
    ],
  // OpenTelemetry packages have duplicate @types across nested deps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  sdk.start();

  process.on('SIGTERM', () => {
    sdk?.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

export function getTracer(name: string = 'owntube') {
  return trace.getTracer(name, process.env.APP_VERSION || '1.0.0');
}

export function createSpan(
  tracer: ReturnType<typeof getTracer>,
  name: string,
  attributes?: Record<string, string | number | boolean>
): Span {
  const span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes: attributes || {},
  });
  return span;
}

export async function withSpan<T>(
  tracer: ReturnType<typeof getTracer>,
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const span = createSpan(tracer, name, attributes);
  const startTime = Date.now();

  try {
    const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    span.setAttribute('duration_ms', duration);
    span.end();
  }
}

// =============================================================================
// NAMED SPANS FOR COINGATE
// =============================================================================

export async function traceCoingateDeduct<T>(
  userId: string,
  amount: number,
  reason: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer('coingate');
  return withSpan(tracer, 'coingate.deduct', {
    'user.id': userId,
    'coin.amount': amount,
    'operation.reason': reason,
    'operation.type': 'deduct',
  }, fn);
}

export async function traceCoingateCredit<T>(
  userId: string,
  amount: number,
  reason: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer('coingate');
  return withSpan(tracer, 'coingate.credit', {
    'user.id': userId,
    'coin.amount': amount,
    'operation.reason': reason,
    'operation.type': 'credit',
  }, fn);
}

// =============================================================================
// NAMED SPANS FOR FRAUD DETECTION
// =============================================================================

export async function traceFraudVelocityCheck<T>(
  userId: string,
  windowMinutes: number,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer('fraud');
  return withSpan(tracer, 'fraud.velocity_check', {
    'user.id': userId,
    'velocity.window_minutes': windowMinutes,
  }, fn);
}

export async function traceFraudGraphAnalysis<T>(
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer('fraud');
  return withSpan(tracer, 'fraud.graph_analysis', {}, fn);
}

export async function traceFraudSignalDetection<T>(
  userId: string,
  signalType: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer('fraud');
  return withSpan(tracer, 'fraud.signal_detection', {
    'user.id': userId,
    'signal.type': signalType,
  }, fn);
}

// =============================================================================
// NAMED SPANS FOR PAYMENT
// =============================================================================

export async function tracePaymentWebhook<T>(
  gateway: 'stripe' | 'maxelpay',
  eventType: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer('payment');
  return withSpan(tracer, 'payment.webhook.process', {
    'payment.gateway': gateway,
    'payment.event_type': eventType,
  }, fn);
}

// =============================================================================
// SPAN UTILITIES
// =============================================================================

export function addSpanAttributes(span: Span, attributes: Record<string, string | number | boolean>) {
  for (const [key, value] of Object.entries(attributes)) {
    span.setAttribute(key, value);
  }
}

export function setSpanError(span: Span, error: Error) {
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });
  span.recordException(error);
}

export function getCurrentSpan(): Span | undefined {
  return trace.getSpan(context.active());
}

export function getSpanContext() {
  const span = getCurrentSpan();
  if (!span) return undefined;
  return span.spanContext();
}