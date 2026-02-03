import { FastifyInstance } from "fastify";
import { loginUser, LoginPayload } from "../../../../application/use-cases/login-user";
import { getProfile } from "../../../../application/use-cases/get-profile";
import { buildAuthHooks } from "../../../../infrastructure/auth";
import { PrismaClient } from "@template/database";
import { SupabaseClient } from "@supabase/supabase-js";

export type AuthRoutesDeps = {
  prisma: PrismaClient;
  supabase: SupabaseClient;
  jwtSecret: string;
  auth: ReturnType<typeof buildAuthHooks>;
};

export const registerAuthRoutes = (app: FastifyInstance, deps: AuthRoutesDeps) => {
  app.route<{ Body: LoginPayload }>({
    method: "POST",
    url: "/auth/login",
    handler: async (request, reply) => {
      try {
        const result = await loginUser({ payload: request.body, prisma: deps.prisma, supabase: deps.supabase, jwtSecret: deps.jwtSecret });
        return reply.send(result);
      } catch (err) {
        const message = (err as Error).message;
        if (message === "INVALID_CREDENTIALS") return reply.status(401).send({ error: message });
        if (message === "USER_NOT_LINKED") return reply.status(404).send({ error: message });
        return reply.status(500).send({ error: "LOGIN_FAILED" });
      }
    },
  });

  app.route({
    method: "GET",
    url: "/auth/me",
    preHandler: deps.auth.requireAuth,
    handler: async (request, reply) => {
      const claims = (request as any).auth as { sub: string } | undefined;
      if (!claims?.sub) return reply.status(401).send({ error: "UNAUTHORIZED" });
      const profile = await getProfile(deps.prisma, claims.sub);
      if (!profile) return reply.status(404).send({ error: "NOT_FOUND" });
      return reply.send({ user: profile, permissions: profile.permissions, role: profile.roleKey });
    },
  });
};
