import { CompanyRepository } from "../../domain/ports/repositories/company-repository";
import { Company } from "../../domain/entities/company";

export const listCompanies = async (repo: CompanyRepository): Promise<Company[]> => {
  return repo.list();
};
