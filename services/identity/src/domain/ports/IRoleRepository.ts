export interface Role {
  id: string;
  key: string;
  name: string;
  description?: string;
}

export interface IRoleRepository {
  findByKey(key: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
}