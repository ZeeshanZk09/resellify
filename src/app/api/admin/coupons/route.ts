import { NextRequest, NextResponse } from "next/server";
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
  const search = searchParams.get("search") || "";
  const typeParam = searchParams.get("type") || "";
  const isActiveParam = searchParams.get("isActive");
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  const isActive =
    isActiveParam === null ? undefined : isActiveParam === "true";
  const page = pageParam ? Number(pageParam) || 1 : 1;
  const pageSize = pageSizeParam ? Number(pageSizeParam) || 20 : 20;

  const where: NonNullable<
    Parameters<typeof Prisma.coupon.findMany>[0]
  >["where"] = {};

  if (search.trim()) {
    where.OR = [
      { code: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  if (typeParam) {
    where.type = typeParam as any;
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const skip = (page - 1) * pageSize;

  try {
    const [coupons, total] = await Promise.all([
      Prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              redemptions: true,
              products: true,
              productOffers: true,
            },
          },
        },
      }),
      Prisma.coupon.count({ where }),
    ]);

    return NextResponse.json({
      coupons: convertDecimals(coupons),
      total,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch coupons" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await authAdmin();
  if ((session as { error?: string }).error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      code,
      description,
      type,
      value,
      maxDiscount,
      discountType,
      stackable,
      priority,
      isActive,
      startsAt,
      endsAt,
      usageLimit,
      perUserLimit,
      firstOrderOnly,
      minOrderValue,
      minOrderPrice,
      categoryId,
    } = body as {
      code: string;
      description?: string;
      type: string;
      value: number;
      maxDiscount?: number | null;
      discountType: string;
      stackable?: boolean;
      priority?: number;
      isActive?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      usageLimit?: number | null;
      perUserLimit?: number | null;
      firstOrderOnly?: boolean;
      minOrderValue?: number | null;
      minOrderPrice?: number | null;
      categoryId?: string | null;
    };

    if (!code || !type || typeof value !== "number" || !discountType) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (type === "PERCENT" && (value <= 0 || value > 100)) {
      return NextResponse.json(
        { message: "Percent value must be between 0 and 100" },
        { status: 400 },
      );
    }

    const existing = await Prisma.coupon.findUnique({
      where: { code },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Coupon code already exists" },
        { status: 400 },
      );
    }

    const coupon = await Prisma.coupon.create({
      data: {
        code,
        description: description || null,
        type: type as any,
        value,
        maxDiscount: maxDiscount ?? null,
        discountType: discountType as any,
        stackable: stackable ?? false,
        priority: priority ?? 0,
        isActive: isActive ?? true,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        usageLimit: usageLimit ?? null,
        perUserLimit: perUserLimit ?? null,
        firstOrderOnly: firstOrderOnly ?? false,
        minOrderValue: minOrderValue ?? null,
        minOrderPrice: minOrderPrice ?? null,
        categoryId: categoryId || null,
      },
    });

    return NextResponse.json(convertDecimals(coupon), { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Failed to create coupon" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await authAdmin();
  if ((session as { error?: string }).error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id,
      code,
      description,
      type,
      value,
      maxDiscount,
      discountType,
      stackable,
      priority,
      isActive,
      startsAt,
      endsAt,
      usageLimit,
      perUserLimit,
      firstOrderOnly,
      minOrderValue,
      minOrderPrice,
      categoryId,
    } = body as {
      id: string;
      code?: string;
      description?: string;
      type?: string;
      value?: number;
      maxDiscount?: number | null;
      discountType?: string;
      stackable?: boolean;
      priority?: number;
      isActive?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      usageLimit?: number | null;
      perUserLimit?: number | null;
      firstOrderOnly?: boolean;
      minOrderValue?: number | null;
      minOrderPrice?: number | null;
      categoryId?: string | null;
    };

    if (!id) {
      return NextResponse.json(
        { message: "Coupon id is required" },
        { status: 400 },
      );
    }

    const data: Parameters<typeof Prisma.coupon.update>[0]["data"] = {};

    if (typeof code === "string") {
      data.code = code;
    }
    if (typeof description === "string") {
      data.description = description;
    }
    if (typeof type === "string") {
      data.type = type as any;
    }
    if (typeof value === "number") {
      if (type === "PERCENT" && (value <= 0 || value > 100)) {
        return NextResponse.json(
          { message: "Percent value must be between 0 and 100" },
          { status: 400 },
        );
      }
      data.value = value;
    }
    if (typeof maxDiscount === "number" || maxDiscount === null) {
      data.maxDiscount = maxDiscount;
    }
    if (typeof discountType === "string") {
      data.discountType = discountType as any;
    }
    if (typeof stackable === "boolean") {
      data.stackable = stackable;
    }
    if (typeof priority === "number") {
      data.priority = priority;
    }
    if (typeof isActive === "boolean") {
      data.isActive = isActive;
    }
    if (startsAt !== undefined) {
      data.startsAt = startsAt ? new Date(startsAt) : null;
    }
    if (endsAt !== undefined) {
      data.endsAt = endsAt ? new Date(endsAt) : null;
    }
    if (typeof usageLimit === "number" || usageLimit === null) {
      data.usageLimit = usageLimit;
    }
    if (typeof perUserLimit === "number" || perUserLimit === null) {
      data.perUserLimit = perUserLimit;
    }
    if (typeof firstOrderOnly === "boolean") {
      data.firstOrderOnly = firstOrderOnly;
    }
    if (typeof minOrderValue === "number" || minOrderValue === null) {
      data.minOrderValue = minOrderValue;
    }
    if (typeof minOrderPrice === "number" || minOrderPrice === null) {
      data.minOrderPrice = minOrderPrice;
    }
    if (categoryId !== undefined) {
      data.categoryId = categoryId || null;
    }

    const updated = await Prisma.coupon.update({
      where: { id },
      data,
    });

    return NextResponse.json(convertDecimals(updated));
  } catch {
    return NextResponse.json(
      { message: "Failed to update coupon" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await authAdmin();
  if ((session as { error?: string }).error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json(
        { message: "Coupon id is required" },
        { status: 400 },
      );
    }

    await Prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete coupon" },
      { status: 500 },
    );
  }
}

