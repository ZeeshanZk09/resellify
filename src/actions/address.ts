"use server";
import { type Session } from "next-auth";
import { auth } from "@/auth";
import prisma from "@/shared/lib/prisma";
import { authUser } from "@/shared/lib/utils/auth";
import { revalidatePath } from "next/cache";

export async function getAddress() {
  try {
    const userId = (await auth())?.user.id;
    if (!userId) return [];

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return addresses;
  } catch (error) {
    console.error("Failed to get addresses:", error);
    return [];
  }
}

export async function createAddressAction(prevState: any, formData: FormData) {
  try {
    const userId = ((await authUser()) as Session)?.user.id;
    if (!userId) return { error: "Unauthorized." };

    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const whatsappNumber = formData.get("whatsappNumber") as string;
    const line1 = formData.get("line1") as string;
    const line2 = formData.get("line2") as string;
    const city = formData.get("city") as string;
    const area = formData.get("area") as string;
    const state = formData.get("state") as string;
    const postalCode = formData.get("postalCode") as string;
    const country = formData.get("country") as string;
    const label = formData.get("label") as string;
    const isDefault = formData.get("isDefault") === "true";

    if (!fullName || !phone || !line1 || !city) {
      return { error: "Required fields are missing." };
    }

    // Set all other addresses to not default if this one is default
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        fullName,
        phone,
        whatsappNumber,
        line1,
        line2,
        city,
        area,
        state,
        postalCode,
        country,
        label,
        isDefault,
      },
    });

    revalidatePath("/address");
    return { success: "Address added successfully!", address };
  } catch (error) {
    console.error("Failed to add address:", error);
    return { error: "Failed to add address." };
  }
}

export async function deleteAddressAction(addressId: string) {
  try {
    const userId = (await auth())?.user.id;
    if (!userId) return { error: "Unauthorized." };

    await prisma.address.delete({
      where: { id: addressId, userId },
    });

    revalidatePath("/address");
    return { success: "Address deleted successfully!" };
  } catch (error) {
    console.error("Failed to delete address:", error);
    return { error: "Failed to delete address." };
  }
}

// Keep old exports for compatibility if needed, but we'll phase them out
export const createAddress = async (data: any) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, String(value)));
    return createAddressAction(null, formData);
};
