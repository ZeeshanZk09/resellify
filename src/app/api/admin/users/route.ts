import { type NextRequest, NextResponse } from "next/server";
import Prisma from "@/shared/lib/prisma";
import { authAdmin } from "@/shared/lib/utils/auth";

export async function GET(req: NextRequest) {
  const session = await authAdmin();
  if ((session as { error?: string }).error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || undefined;
  const isActiveParam = searchParams.get("isActive");
  const isBlockedParam = searchParams.get("isBlocked");
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  const isActive =
    isActiveParam === null ? undefined : isActiveParam === "true";
  const isBlocked =
    isBlockedParam === null ? undefined : isBlockedParam === "true";

  const page = pageParam ? Number(pageParam) || 1 : 1;
  const pageSize = pageSizeParam ? Number(pageSizeParam) || 20 : 20;

  const where: NonNullable<
    Parameters<typeof Prisma.user.findMany>[0]
  >["where"] = {};

  if (search.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { email: { contains: search.trim(), mode: "insensitive" } },
      { phoneNumber: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role as never;
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (typeof isBlocked === "boolean") {
    where.isBlocked = isBlocked;
  }

  const skip = (page - 1) * pageSize;

  try {
    const [users, total] = await Promise.all([
      Prisma.user.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      Prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
