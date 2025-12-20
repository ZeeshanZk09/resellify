import { auth } from "@/auth";

async function authAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return { error: "Unauthorized" };
  return session;
}

async function authUser() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  return session;
}

export { authAdmin, authUser };
