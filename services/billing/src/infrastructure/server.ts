import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@template/database";
import { registerBillingRoutes } from "../adapters/inbound/http/server";
import { PrismaCompanyRepository } from "../adapters/outbound/persistence/prisma-company-repository";

export const buildBillingServer = () => {
  const app = Fastify({ logger: true });
  const prisma = new PrismaClient();

  app.register(cors, { origin: "*" });

  const companyRepository = new PrismaCompanyRepository(prisma);
  registerBillingRoutes(app, { companyRepository });

  return { app, prisma };
};

export const startBillingServer = async () => {
  const { app, prisma } = buildBillingServer();
  const PORT = Number(process.env.PORT || 3002);

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};
