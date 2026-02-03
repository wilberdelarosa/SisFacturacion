import { Company } from "../../entities/company";

export interface CompanyRepository {
  list(): Promise<Company[]>;
}
