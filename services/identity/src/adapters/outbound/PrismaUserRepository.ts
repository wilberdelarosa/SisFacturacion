import { PrismaClient } from '@template/database';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { User } from '../../domain/entities/user';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roleEntity: true }
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.roleEntity?.key ?? user.role ?? 'OPERADOR',
      companyId: user.companyId,
      branchId: user.branchId
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roleEntity: true }
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.roleEntity?.key ?? user.role ?? 'OPERADOR',
      companyId: user.companyId,
      branchId: user.branchId
    };
  }

  async save(user: User): Promise<void> {
    const roleEnum = user.role ? (user.role as 'SUPERADMIN' | 'ADMIN' | 'GERENTE' | 'VENDEDOR' | 'OPERADOR' | 'CONTABILIDAD' | 'AUDITOR') : 'OPERADOR';
    await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleEnum,
        companyId: user.companyId,
        branchId: user.branchId,
      }
    });
  }

  async assignRole(userId: string, roleKey: string): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { key: roleKey } });
    if (!role) throw new Error('Role not found');
    await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id }
    });
  }
}