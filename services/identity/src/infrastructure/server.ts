import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@template/database";
import { registerIdentityRoutes } from "../adapters/inbound/http/server";
import { buildSupabaseClient } from "./supabase";

export const buildIdentityServer = () => {
  const app = Fastify({ logger: true });
  const prisma = new PrismaClient();
  const supabase = buildSupabaseClient();
  const jwtSecret = process.env.IDENTITY_JWT_SECRET || process.env.JWT_SECRET || "changeme";

  app.register(cors, { origin: "*" });
  registerIdentityRoutes(app, { prisma, supabase, jwtSecret });

  return { app, prisma };
};

export const startIdentityServer = async () => {
  const { app, prisma } = buildIdentityServer();
  const PORT = Number(process.env.PORT || 3003);

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};
