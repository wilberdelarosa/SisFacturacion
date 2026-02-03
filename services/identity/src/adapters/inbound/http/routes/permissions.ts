import { FastifyInstance } from "fastify";
import { PrismaClient } from "@template/database";
import { buildAuthHooks } from "../../../../infrastructure/auth";

export type PermissionsRouteDeps = {
  prisma: PrismaClient;
  auth: ReturnType<typeof buildAuthHooks>;
};

export const registerPermissionRoutes = (app: FastifyInstance, deps: PermissionsRouteDeps) => {
  app.route({
    method: "GET",
    url: "/permissions",
    preHandler: deps.auth.requireAuth,
    handler: async () => {
      const modules = await deps.prisma.module.findMany({
        include: {
          permissions: { include: { action: true } },
        },
        orderBy: { key: "asc" },
      });

      return modules.map((mod) => ({
        id: mod.id,
        key: mod.key,
        name: mod.name,
        actions: mod.permissions.map((perm) => ({
          id: perm.id,
          actionKey: perm.action.key,
          scope: perm.scope,
          active: perm.active,
        })),
      }));
    },
  });
};
