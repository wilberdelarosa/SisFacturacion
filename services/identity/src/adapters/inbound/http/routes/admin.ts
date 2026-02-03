import { FastifyInstance } from "fastify";
import { PrismaClient } from "@template/database";
import { buildAuthHooks } from "../../../../infrastructure/auth";
import { CreateAdminUserController } from "../../CreateAdminUserController";
import { CreateAdminUserUseCase } from "../../../../application/use-cases/CreateAdminUserUseCase";
import { PrismaUserRepository } from "../../../outbound/PrismaUserRepository";
import { PrismaRoleRepository } from "../../../outbound/PrismaRoleRepository";

export type AdminRouteDeps = {
  prisma: PrismaClient;
  auth: ReturnType<typeof buildAuthHooks>;
};

export const registerAdminRoutes = (app: FastifyInstance, deps: AdminRouteDeps) => {
  const userRepo = new PrismaUserRepository(deps.prisma);
  const roleRepo = new PrismaRoleRepository(deps.prisma);
  const createAdminUserUseCase = new CreateAdminUserUseCase(userRepo, roleRepo);
  const createAdminUserController = new CreateAdminUserController(createAdminUserUseCase);

  app.route({
    method: "POST",
    url: "/admin/users",
    preHandler: deps.auth.requireAdmin,
    handler: async (req, reply) => {
      await createAdminUserController.handle(req as any, reply as any);
    },
  });
};