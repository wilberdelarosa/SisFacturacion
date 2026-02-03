import { FastifyInstance } from "fastify";
import { identityHealthRoute } from "./routes/health";
import { registerAuthRoutes } from "./routes/auth";
import { registerRoleRoutes } from "./routes/roles";
import { registerPermissionRoutes } from "./routes/permissions";
import { registerAdminRoutes } from "./routes/admin";
import { PrismaClient } from "@template/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { buildAuthHooks } from "../../../infrastructure/auth";

export type IdentityHttpDependencies = {
	prisma: PrismaClient;
	supabase: SupabaseClient;
	jwtSecret: string;
};

export const registerIdentityRoutes = (app: FastifyInstance, deps: IdentityHttpDependencies) => {
	const auth = buildAuthHooks(deps.jwtSecret);

	app.route({
		method: identityHealthRoute.method,
		url: identityHealthRoute.path,
		handler: identityHealthRoute.handler,
	});

	registerAuthRoutes(app, { prisma: deps.prisma, supabase: deps.supabase, jwtSecret: deps.jwtSecret, auth });
	registerRoleRoutes(app, { prisma: deps.prisma, auth });
	registerPermissionRoutes(app, { prisma: deps.prisma, auth });
	registerAdminRoutes(app, { prisma: deps.prisma, auth });
};
