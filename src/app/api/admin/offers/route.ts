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
  const offTypeParam = searchParams.get("offType") || "";
  const isActiveParam = searchParams.get("isActive");
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  const isActive =
    isActiveParam === null ? undefined : isActiveParam === "true";
  const page = pageParam ? Number(pageParam) || 1 : 1;
  const pageSize = pageSizeParam ? Number(pageSizeParam) || 20 : 20;

  const where: NonNullable<
    Parameters<typeof Prisma.offer.findMany>[0]
  >["where"] = {};

  if (search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  if (offTypeParam) {
    where.offType = offTypeParam as any;
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const skip = (page - 1) * pageSize;

  try {
    const [offers, total] = await Promise.all([
      Prisma.offer.findMany({
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
          productOffers: {
            select: {
              id: true,
              productId: true,
            },
          },
        },
      }),
      Prisma.offer.count({ where }),
    ]);

    return NextResponse.json({
      offers: convertDecimals(offers),
      total,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch offers" },
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
      title,
      description,
      type,
      offType,
      value,
      maxDiscount,
      discountType,
      stackable,
      priority,
      startsAt,
      endsAt,
      isActive,
      appliesToAll,
      categoryId,
    } = body as {
      title: string;
      description?: string;
      type: string;
      offType: string;
      value: number;
      maxDiscount?: number | null;
      discountType: string;
      stackable?: boolean;
      priority?: number;
      startsAt?: string | null;
      endsAt?: string | null;
      isActive?: boolean;
      appliesToAll?: boolean;
      categoryId?: string | null;
    };

    if (!title || !type || !offType || typeof value !== "number") {
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

    const offer = await Prisma.offer.create({
      data: {
        title,
        description: description || null,
        type: type as any,
        offType: offType as any,
        value,
        maxDiscount: maxDiscount ?? null,
        discountType: (discountType || "PERCENT") as any,
        stackable: stackable ?? false,
        priority: priority ?? 0,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: isActive ?? true,
        appliesToAll: appliesToAll ?? false,
        categoryId: categoryId || null,
      },
    });

    return NextResponse.json(convertDecimals(offer), { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Failed to create offer" },
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
      title,
      description,
      type,
      offType,
      value,
      maxDiscount,
      discountType,
      stackable,
      priority,
      startsAt,
      endsAt,
      isActive,
      appliesToAll,
      categoryId,
    } = body as {
      id: string;
      title?: string;
      description?: string;
      type?: string;
      offType?: string;
      value?: number;
      maxDiscount?: number | null;
      discountType?: string;
      stackable?: boolean;
      priority?: number;
      startsAt?: string | null;
      endsAt?: string | null;
      isActive?: boolean;
      appliesToAll?: boolean;
      categoryId?: string | null;
    };

    if (!id) {
      return NextResponse.json(
        { message: "Offer id is required" },
        { status: 400 },
      );
    }

    const data: Parameters<typeof Prisma.offer.update>[0]["data"] = {};

    if (typeof title === "string") {
      data.title = title;
    }
    if (typeof description === "string") {
      data.description = description;
    }
    if (typeof type === "string") {
      data.type = type as any;
    }
    if (typeof offType === "string") {
      data.offType = offType as any;
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
    if (startsAt !== undefined) {
      data.startsAt = startsAt ? new Date(startsAt) : null;
    }
    if (endsAt !== undefined) {
      data.endsAt = endsAt ? new Date(endsAt) : null;
    }
    if (typeof isActive === "boolean") {
      data.isActive = isActive;
    }
    if (typeof appliesToAll === "boolean") {
      data.appliesToAll = appliesToAll;
    }
    if (categoryId !== undefined) {
      data.categoryId = categoryId || null;
    }

    const updated = await Prisma.offer.update({
      where: { id },
      data,
    });

    return NextResponse.json(convertDecimals(updated));
  } catch {
    return NextResponse.json(
      { message: "Failed to update offer" },
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
        { message: "Offer id is required" },
        { status: 400 },
      );
    }

    await Prisma.offer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete offer" },
      { status: 500 },
    );
  }
}
