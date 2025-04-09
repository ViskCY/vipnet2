import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export enum Permission {
  mng = "Manager",
  prime = "Prime",
  mod = "Moderator",
}

export async function isAdmin(
  userId: number,
  requiredPermission: Permission = Permission.prime
): Promise<boolean> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!admin) return false;
    if (admin.permission === Permission.mng) return true;
    if (
      admin.permission === Permission.prime &&
      requiredPermission !== Permission.mng
    ) {
      return true;
    }
    if (
      admin.permission === Permission.mod &&
      requiredPermission === Permission.mod
    ) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function getAllAdmins() {
  return prisma.admin.findMany();
}

export async function addOrUpdateAdmin(
  userId: number,
  username: string | null,
  permission: string
) {
  const existingAdmin = await prisma.admin.findUnique({
    where: { userId: BigInt(userId) },
  });

  if (existingAdmin) {
    return prisma.admin.update({
      where: { userId: BigInt(userId) },
      data: { permission },
    });
  }

  return prisma.admin.create({
    data: {
      userId: BigInt(userId),
      username,
      permission,
    },
  });
}

export async function removeAdmin(userId: number) {
  return prisma.admin.delete({
    where: { userId: BigInt(userId) },
  });
}
