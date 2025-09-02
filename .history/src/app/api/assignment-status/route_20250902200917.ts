import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

// Utility to run limited concurrency for outbound fetches
async function mapLimit<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length) as R[];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      try {
        results[current] = await mapper(items[current]);
      } catch (e) {
        results[current] = await Promise.resolve(undefined as unknown as R);
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const { residentIds } = await req.json();
    const ids: string[] = Array.isArray(residentIds) ? residentIds.filter(Boolean) : [];

    if (ids.length === 0) {
      return new NextResponse(JSON.stringify({ data: {} }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=300',
        },
      });
    }

    // Fetch assignments in parallel with limited concurrency to avoid saturation
    const entries = await mapLimit(ids, 8, async (id) => {
      const url = `${API_BASE_URL}/care-plan-assignments/by-resident/${id}`;
      try {
        const res = await fetch(url, { next: { revalidate: 120 } });
        const json = await res.json().catch(() => ([]));
        const assignments = Array.isArray(json) ? json : (json?.data ?? []);

        if (!assignments || assignments.length === 0) {
          return [id, { hasAssignment: false, isExpired: false }] as const;
        }

        const latest = assignments[0];
        const endDate = latest?.end_date || latest?.endDate;
        if (!endDate) {
          return [id, { hasAssignment: true, isExpired: false, endDate }] as const;
        }

        const isExpired = new Date(endDate) < new Date();
        return [id, { hasAssignment: true, isExpired, endDate }] as const;
      } catch {
        return [id, { hasAssignment: false, isExpired: false }] as const;
      }
    });

    const map: Record<string, { hasAssignment: boolean; isExpired: boolean; endDate?: string }> = {};
    for (const [id, status] of entries) {
      map[id] = status;
    }

    return new NextResponse(JSON.stringify({ data: map }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ data: {}, error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


