import { NextResponse } from 'next/server';
import { metricsRegistry } from '@/lib/metrics';

const CRON_SECRET = process.env.CRON_SECRET || process.env.PROMETHEUS_SCRAPE_SECRET;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const querySecret = new URL(request.url).searchParams.get('secret');

  if (CRON_SECRET) {
    const isValidSecret =
      (authHeader && authHeader === `Bearer ${CRON_SECRET}`) ||
      (querySecret && querySecret === CRON_SECRET);

    if (!isValidSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  } else {
    console.warn('CRON_SECRET not set, metrics endpoint is open');
  }

  try {
    const metrics = await metricsRegistry.metrics();
    const contentType = metricsRegistry.contentType;

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to collect metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}