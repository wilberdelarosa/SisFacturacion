import { FastifyInstance } from "fastify";
import { billingHealthRoute } from "./routes/health";
import { buildCompaniesRoute } from "./routes/companies";
import { CompanyRepository } from "../../../domain/ports/repositories/company-repository";

export type BillingHttpDependencies = {
  companyRepository: CompanyRepository;
};

export const registerBillingRoutes = (app: FastifyInstance, deps: BillingHttpDependencies) => {
  app.route(billingHealthRoute);
  app.route(buildCompaniesRoute(deps.companyRepository));
};
