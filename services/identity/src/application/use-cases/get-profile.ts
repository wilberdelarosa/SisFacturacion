import { PrismaClient } from "@template/database";
import { computeEffectivePermissions, fetchUserWithPermissions, PermissionView } from "./permissions";

export type ProfileResult = {
  id: string;
  email: string;
  name: string;
  companyId: string;
  branchId?: string | null;
  roleKey?: string | null;
  permissions: PermissionView[];
};

export async function getProfile(prisma: PrismaClient, userId: string): Promise<ProfileResult | null> {
  const user = await fetchUserWithPermissions(prisma, { userId });
  if (!user) return null;

  const roleKey = user.roleEntity?.key ?? user.role ?? null;
  const permissions = computeEffectivePermissions(user.roleEntity?.rolePermissions ?? [], user.userPermissions ?? []);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    companyId: user.companyId,
    branchId: user.branchId,
    roleKey,
    permissions,
  };
}
