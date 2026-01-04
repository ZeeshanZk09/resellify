'use server';
import { z } from 'zod';

import { TRAFFIC_LIST_PAGE_SIZE } from '@/shared/constants/admin/trafficView';
import db from '@/shared/lib/prisma';
import { TAddPageVisit } from '@/shared/types/common';
import { headers } from 'next/headers';
import { authUser } from '@/shared/lib/utils/auth';
import { Session } from 'next-auth';

const ValidatePageVisit = z.object({
  pageType: z.enum(['MAIN', 'LIST', 'PRODUCT']),
});

export type TTrafficListItem = {
  id: string;
  time: Date | null;
  path: string;
  pagePath: string | null;
  productID: string | null;
  deviceResolution: string | null;
  product: {
    name: string;
    category: {
      name: string;
    };
  } | null;
};

export const addVisit = async (path: string) => {
  const headerStore = await headers();
  try {
    const session = await authUser();
    const userId = (session as Session)?.user?.id ?? null;
    const ip = headerStore.get('x-forwarded-for') ?? null;

    // Try to find the most recent visit by this userId or ip to this path
    const existingVisit = await db.visit.findFirst({
      where: {
        path,
        OR: [{ userId: userId ?? undefined }, { ip: ip ?? undefined }, { path }],
      },
      orderBy: { time: 'desc' },
    });

    if (existingVisit) {
      // Update the existing visit's visitCount in metadata
      const previousMetadata: Record<string, unknown> =
        existingVisit.metadata && typeof existingVisit.metadata === 'object'
          ? (existingVisit.metadata as Record<string, unknown>)
          : {};
      const previousVisitCount =
        typeof previousMetadata.visitCount === 'number' ? previousMetadata.visitCount : 1;

      const updated = await db.visit.update({
        where: { id: existingVisit.id },
        data: {
          // override all headers, update visitCount
          metadata: {
            ...Object.fromEntries(headerStore.entries()),
            visitCount: previousVisitCount + 1,
          },
        },
      });
      return { res: updated };
    }

    // If not found, create a new visit
    const result = await db.visit.create({
      data: {
        userId,
        referrer: headerStore.get('referrer') ?? null,
        ip,
        userAgent: headerStore.get('user-agent') ?? null,
        country: headerStore.get('x-country') ?? null,
        city: headerStore.get('x-city') ?? null,
        path,
        metadata: {
          ...Object.fromEntries(headerStore.entries()),
          visitCount: 1,
        },
      },
    });

    if (!result) return { error: 'Invalid Data!' };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export async function getVisitsReport() {
  try {
    // Count total visits
    const totalVisits = await db.visit.count();

    // Count unique visitors by userAgent and ip
    const uniqueVisitors = await db.visit
      .groupBy({
        by: ['userAgent', 'ip'],
        _count: { _all: true },
      })
      .then((groups) => groups.length);

    // Count visits grouped by day for last 30 days
    const visitsPerDayRaw = await db.visit.groupBy({
      by: ['time'],
      _count: { _all: true },
      orderBy: { time: 'desc' },
      where: {
        time: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Transform groupBy result to chart-friendly format
    const visitsPerDay = visitsPerDayRaw.map((entry) => ({
      date: entry.time.toISOString().split('T')[0],
      count: entry._count._all,
    }));

    // Top 5 most common paths (most visited pages)
    const topPaths = await db.visit.groupBy({
      by: ['path'],
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 5,
    });

    // Top 5 referrers
    const topReferrers = await db.visit.groupBy({
      by: ['referrer'],
      _count: { referrer: true },
      orderBy: { _count: { referrer: 'desc' } },
      where: { referrer: { not: null } },
      take: 5,
    });

    return {
      res: {
        totalVisits,
        uniqueVisitors,
        visitsPerDay,
        topPaths: topPaths.map(({ path, _count }) => ({ path, count: _count.path })),
        topReferrers: topReferrers.map(({ referrer, _count }) => ({
          referrer,
          count: _count.referrer,
        })),
      },
    };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
}

export const deleteTraffic = async (id: string) => {
  if (!id || id === '') return { error: 'Invalid Data!' };

  try {
    const result = await db.visit.delete({
      where: {
        id,
      },
    });
    if (!result) return { error: 'Can not read Data!' };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};
