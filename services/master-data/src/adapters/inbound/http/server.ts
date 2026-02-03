import { FastifyInstance } from "fastify";
import { masterDataHealthRoute } from "./routes/health";

export const registerMasterDataRoutes = (app: FastifyInstance) => {
	app.route({
		method: masterDataHealthRoute.method,
		url: masterDataHealthRoute.path,
		handler: masterDataHealthRoute.handler
	});
};
