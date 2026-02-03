import { PrismaClient, Prisma, PermissionScope, RolePermission, UserPermission } from "@prisma/client";

export type PermissionView = {
  id: string;
  moduleKey: string;
  actionKey: string;
  scope: PermissionScope;
};

export const buildPermissionView = (p: {
  id: string;
  scope: PermissionScope;
  module: { key: string };
  action: { key: string };
}): PermissionView => ({
  id: p.id,
  moduleKey: p.module.key,
  actionKey: p.action.key,
  scope: p.scope,
});

export const computeEffectivePermissions = (
  rolePermissions: Array<RolePermission & { permission: { id: string; scope: PermissionScope; active: boolean; module: { key: string }; action: { key: string } } }>,
  userOverrides: Array<UserPermission & { permission: { id: string; scope: PermissionScope; active: boolean; module: { key: string }; action: { key: string } } }>
): PermissionView[] => {
  const map = new Map<string, PermissionView>();

  rolePermissions.forEach((rp) => {
    const perm = rp.permission;
    if (!perm.active) return;
    const key = `${perm.module.key}:${perm.action.key}:${perm.scope}`;
    map.set(key, buildPermissionView(perm));
  });

  userOverrides.forEach((up) => {
    const perm = up.permission;
    const key = `${perm.module.key}:${perm.action.key}:${perm.scope}`;
    if (!perm.active) {
      map.delete(key);
      return;
    }
    if (up.grantType === "DENY") {
      map.delete(key);
    } else {
      map.set(key, buildPermissionView(perm));
    }
  });

  return Array.from(map.values());
};

export async function fetchUserWithPermissions(prisma: PrismaClient, opts: { authUserId?: string; email?: string; userId?: string }) {
  const ors: Prisma.UserWhereInput[] = [];
  if (opts.userId) ors.push({ id: opts.userId });
  if (opts.authUserId) ors.push({ authUserId: opts.authUserId });
  if (opts.email) ors.push({ email: opts.email });

  return prisma.user.findFirst({
    where: { OR: ors },
    include: {
      roleEntity: {
        include: {
          rolePermissions: {
            include: {
              permission: { include: { module: true, action: true } },
            },
          },
        },
      },
      userPermissions: {
        include: {
          permission: { include: { module: true, action: true } },
        },
      },
    },
  });
}
