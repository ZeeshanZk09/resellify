import { type NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import Prisma from "@/shared/lib/prisma";
import { authAdmin } from "@/shared/lib/utils/auth";

function convertDecimals(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertDecimals);
  }
  if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (!Object.hasOwn(obj, key)) continue;
      const value = obj[key];
      if (value && typeof value === "object" && value._isDecimal) {
        result[key] = Number(value);
      } else if (
        value &&
        typeof value === "object" &&
        typeof (value as any).toNumber === "function"
      ) {
        result[key] = Number((value as any).toNumber());
      } else {
        result[key] = convertDecimals(value);
      }
    }
    return result;
  }
  return obj;
}

export async function GET(req: NextRequest) {
  const session = await authAdmin();
  if ((session as { error?: string }).error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    try {
      const order = await Prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
          address: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              city: true,
              state: true,
              country: true,
              postalCode: true,
              label: true,
              whatsappNumber: true,
              nearbyLandmark: true,
              area: true,
              line1: true,
              line2: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  images: {
                    select: {
                      id: true,
                      path: true,
                      altText: true,
                    },
                    take: 1,
                  },
                },
              },
              variant: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          payment: true,
          logs: {
            include: {
              actor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          { message: "Order not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ order: convertDecimals(order) });
    } catch {
      return NextResponse.json(
        { message: "Failed to fetch order" },
        { status: 500 },
      );
    }
  }

  const search = searchParams.get("search") || "";
  const statusParam = searchParams.get("status") || "";
  const paymentStatusParam = searchParams.get("paymentStatus") || "";
  const paymentMethodParam = searchParams.get("paymentMethod") || "";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  const page = pageParam ? Number(pageParam) || 1 : 1;
  const pageSize = pageSizeParam ? Number(pageSizeParam) || 20 : 20;

  const where: NonNullable<
    Parameters<typeof Prisma.order.findMany>[0]
  >["where"] = {};

  if (search.trim()) {
    const term = search.trim();
    where.OR = [
      { orderNumber: { contains: term, mode: "insensitive" } },
      { user: { name: { contains: term, mode: "insensitive" } } },
      { user: { email: { contains: term, mode: "insensitive" } } },
    ];
  }

  if (statusParam) {
    where.status = statusParam as any;
  }

  if (paymentStatusParam) {
    where.paymentStatus = paymentStatusParam as any;
  }

  if (paymentMethodParam) {
    where.paymentMethod = paymentMethodParam as any;
  }

  if (fromParam || toParam) {
    const createdAt: NonNullable<NonNullable<(typeof where)["createdAt"]>> = {};
    if (fromParam) {
      createdAt.gte = new Date(fromParam);
    }
    if (toParam) {
      createdAt.lte = new Date(toParam);
    }
    where.createdAt = createdAt;
  }

  const skip = (page - 1) * pageSize;

  try {
    const [orders, total] = await Promise.all([
      Prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
          address: {
            select: {
              id: true,
              fullName: true,
              city: true,
              state: true,
              country: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  images: {
                    select: {
                      id: true,
                      path: true,
                      altText: true,
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      }),
      Prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: convertDecimals(orders),
      total,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = (await authAdmin()) as Session;
  if (
    (session as { error?: string }).error ||
    (!session as unknown as Session)?.user?.id
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, paymentStatus, notes } = body as {
      id: string;
      status?: string;
      paymentStatus?: string;
      notes?: string;
    };

    if (!id) {
      return NextResponse.json(
        { message: "Order id is required" },
        { status: 400 },
      );
    }

    if (!status && !paymentStatus && typeof notes !== "string") {
      return NextResponse.json(
        { message: "Nothing to update" },
        { status: 400 },
      );
    }

    const existing = await Prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        paymentStatus: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const data: NonNullable<Parameters<typeof Prisma.order.update>[0]>["data"] =
      {};

    if (status) {
      data.status = status as any;
    }

    if (paymentStatus) {
      data.paymentStatus = paymentStatus as any;
    }

    if (typeof notes === "string") {
      data.notes = notes;
    }

    const updated = await Prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (status && existing.status !== status) {
        await tx.orderLog.create({
          data: {
            orderId: id,
            actorId: session.user.id,
            message: `Status changed from ${existing.status} to ${status}`,
            fromStatus: existing.status,
            toStatus: status as any,
          },
        });
      }

      if (paymentStatus && existing.paymentStatus !== paymentStatus) {
        await tx.orderLog.create({
          data: {
            orderId: id,
            actorId: session.user.id,
            message: `Payment status changed from ${existing.paymentStatus} to ${paymentStatus}`,
          },
        });
      }

      return order;
    });

    return NextResponse.json(convertDecimals(updated));
  } catch {
    return NextResponse.json(
      { message: "Failed to update order" },
      { status: 500 },
    );
  }
}
