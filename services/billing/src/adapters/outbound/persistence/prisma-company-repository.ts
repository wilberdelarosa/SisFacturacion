import { PrismaClient } from "@template/database";
import { Company } from "../../../domain/entities/company";
import { CompanyRepository } from "../../../domain/ports/repositories/company-repository";

export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<Company[]> {
    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        name: true,
        commercialName: true,
        rnc: true,
        status: true
      }
    });

    return companies.map((company) => ({
      id: company.id,
      name: company.name,
      commercialName: company.commercialName,
      rnc: company.rnc,
      status: company.status
    }));
  }
}
