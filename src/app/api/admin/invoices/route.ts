import { type NextRequest, NextResponse } from "next/server";
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
      if (value && typeof value === "object" && (value as any)._isDecimal) {
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
        },
      });

      if (!order) {
        return NextResponse.json(
          { message: "Invoice not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ invoice: convertDecimals(order) });
    } catch {
      return NextResponse.json(
        { message: "Failed to fetch invoice" },
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
  const minTotalParam = searchParams.get("minTotal");
  const maxTotalParam = searchParams.get("maxTotal");
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
      { payment: { providerTxId: { contains: term, mode: "insensitive" } } },
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

  if (minTotalParam || maxTotalParam) {
    const totalAmount: NonNullable<NonNullable<(typeof where)["totalAmount"]>> =
      {};
    const minTotal = minTotalParam ? Number(minTotalParam) : undefined;
    const maxTotal = maxTotalParam ? Number(maxTotalParam) : undefined;
    if (typeof minTotal === "number" && !Number.isNaN(minTotal)) {
      totalAmount.gte = minTotal;
    }
    if (typeof maxTotal === "number" && !Number.isNaN(maxTotal)) {
      totalAmount.lte = maxTotal;
    }
    where.totalAmount = totalAmount as any;
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
          payment: true,
        },
      }),
      Prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      invoices: convertDecimals(orders),
      total,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}
