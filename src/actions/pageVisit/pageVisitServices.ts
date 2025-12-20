"use server";
import { z } from "zod";

import { TRAFFIC_LIST_PAGE_SIZE } from "@/shared/constants/admin/trafficView";
import db from "@/shared/lib/prisma";
import { TAddPageVisit } from "@/shared/types/common";
import { headers } from "next/headers";
import { authUser } from "@/shared/lib/utils/auth";
import { Session } from "next-auth";

const ValidatePageVisit = z.object({
  pageType: z.enum(["MAIN", "LIST", "PRODUCT"]),
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
  // if (process.env.NODE_ENV !== "production") return { error: "Invalid ENV!" };

  const headerStore = await headers();
  //   id        String   @id @default(cuid())
  // userId    String?
  // path      String
  // referrer  String?
  // ip        String?
  // userAgent String?
  // country   String?
  // city      String?
  // createdAt DateTime @default(now())
  // metadata  Json     @default(dbgenerated())
  // user      User?    @relation(fields: [userId], references: [id])

  try {
    const session = await authUser();

    const result = await db.visit.create({
      data: {
        userId: (session as Session)?.user?.id ?? null,
        referrer: headerStore.get("referrer") ?? null,
        ip: headerStore.get("x-forwarded-for") ?? null,
        userAgent: headerStore.get("user-agent") ?? null,
        country: headerStore.get("x-country") ?? null,
        city: headerStore.get("x-city") ?? null,
        path,
        // the route which is visited
        metadata: {
          // all headers
          ...Object.fromEntries(headerStore.entries()),
        },
      },
    });

    if (!result) return { error: "Invalid Data!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const getTrafficReport = async (skip: number = 0) => {
  try {
    const [list, totalCount] = await Promise.all([
      db.visit.findMany({
        skip: skip,
        take: TRAFFIC_LIST_PAGE_SIZE,
        include: {
          product: {
            select: {
              name: true,
              categories: {
                select: {
                  category: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      }),
      db.visit.count(),
    ]);
    if (!list) return { error: "Can not read Data!" };
    return { res: { list, totalCount } };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const deleteTraffic = async (id: string) => {
  if (!id || id === "") return { error: "Invalid Data!" };

  try {
    const result = await db.visit.delete({
      where: {
        id,
      },
    });
    if (!result) return { error: "Can not read Data!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};
