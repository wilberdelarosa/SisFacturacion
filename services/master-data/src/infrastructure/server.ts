import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerMasterDataRoutes } from "../adapters/inbound/http/server";

export const buildMasterDataServer = () => {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: "*" });
  registerMasterDataRoutes(app);

  return app;
};

export const startMasterDataServer = async () => {
  const app = buildMasterDataServer();
  const PORT = Number(process.env.PORT || 3004);

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
