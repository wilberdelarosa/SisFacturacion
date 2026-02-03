import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { buildAuthHooks } from "../../../../infrastructure/auth";

export type RolesRouteDeps = {
  prisma: PrismaClient;
  auth: ReturnType<typeof buildAuthHooks>;
};

export const registerRoleRoutes = (app: FastifyInstance, deps: RolesRouteDeps) => {
  app.route({
    method: "GET",
    url: "/roles",
    preHandler: deps.auth.requireAuth,
    handler: async () => {
      const roles = await deps.prisma.role.findMany({
        include: {
          rolePermissions: {
            include: {
              permission: { include: { module: true, action: true } },
            },
          },
        },
      });

      return roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        permissions: role.rolePermissions.map((rp) => ({
          id: rp.permission.id,
          moduleKey: rp.permission.module.key,
          actionKey: rp.permission.action.key,
          scope: rp.permission.scope,
        })),
      }));
    },
  });

  app.route<{ Params: { id: string }; Body: { permissionIds: string[] } }>({
    method: "PUT",
    url: "/roles/:id/permissions",
    preHandler: deps.auth.requireAdmin,
    handler: async (request, reply) => {
      const roleId = request.params.id;
      const permissionIds = request.body?.permissionIds ?? [];

      await deps.prisma.rolePermission.deleteMany({ where: { roleId } });
      if (permissionIds.length) {
        await deps.prisma.rolePermission.createMany({
          data: permissionIds.map((pid) => ({ roleId, permissionId: pid })),
          skipDuplicates: true,
        });
      }

      return reply.send({ ok: true, updated: permissionIds.length });
    },
  });
};
