import { NextResponse } from 'next/server';
import { createDb, sql, messageOutbox, eq } from '@pavilion/db';

const startTime = Date.now();

export async function GET() {
  const startPing = Date.now();
  try {
    const db = createDb();

    // 1. Database Liveness & Latency Check
    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - startPing;

    // 2. Dead-letter outbox check
    const deadLetters = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messageOutbox)
      .where(eq(messageOutbox.status, 'failed'));

    const failedCount = deadLetters[0]?.count ?? 0;

    return NextResponse.json(
      {
        status: 'healthy',
        service: 'pavilion-web',
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        database: {
          status: 'connected',
          latencyMs,
        },
        notifications: {
          deadLetterCount: failedCount,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('Health check failure:', err);
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'pavilion-web',
        error: err?.message || 'Database ping failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
