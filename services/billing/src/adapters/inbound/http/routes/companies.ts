import { listCompanies } from "../../../../application/use-cases/list-companies";
import { CompanyRepository } from "../../../../domain/ports/repositories/company-repository";

export const buildCompaniesRoute = (repo: CompanyRepository) => ({
  method: "GET" as const,
  url: "/companies",
  handler: async () => listCompanies(repo)
});
