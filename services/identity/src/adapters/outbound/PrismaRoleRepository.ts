import { PrismaClient } from '@template/database';
import { IRoleRepository, Role } from '../../domain/ports/IRoleRepository';

export class PrismaRoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByKey(key: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({ where: { key } });
    if (!role) return null;
    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description || undefined
    };
  }

  async findAll(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany();
    return roles.map(r => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description || undefined
    }));
  }
}