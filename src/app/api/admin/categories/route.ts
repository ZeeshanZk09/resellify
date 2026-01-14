import { NextRequest, NextResponse } from "next/server";
import { authAdmin } from "@/shared/lib/utils/auth";
import db from "@/shared/lib/prisma";
import { updateCategory, deleteCategory } from "@/actions/category/category";

export async function GET() {
  const session = await authAdmin();
  if ((session as { error: string }).error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const categories = await db.category.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: "Cant read Category Groups" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await authAdmin();
  if ((session as { error: string }).error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { id, name, description, slug } = body as {
      id: string;
      name?: string;
      description?: string;
      slug?: string;
    };
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const result = await updateCategory({
      id,
      name,
      description,
      slug,
      updatedAt: new Date(),
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ category: (result as any).res });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await authAdmin();
  if ((session as { error: string }).error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { id } = body as { id: string };
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const result = await deleteCategory(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
