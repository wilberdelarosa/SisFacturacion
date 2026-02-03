import { IUserRepository } from '../../domain/ports/IUserRepository';
import { IRoleRepository } from '../../domain/ports/IRoleRepository';
import { createUser, User } from '../../domain/entities/user';

export interface CreateAdminUserInput {
  email: string;
  name: string;
  companyId: string;
  branchId?: string | null;
}

export class CreateAdminUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly roleRepo: IRoleRepository
  ) {}

  async execute(input: CreateAdminUserInput): Promise<User> {
    // Check if admin role exists
    const adminRole = await this.roleRepo.findByKey('ADMIN');
    if (!adminRole) {
      throw new Error('Admin role not found');
    }

    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user: User = createUser({
      email: input.email,
      name: input.name,
      role: 'ADMIN',
      companyId: input.companyId,
      branchId: input.branchId ?? null,
    });

    await this.userRepo.save(user);
    await this.userRepo.assignRole(user.id, 'ADMIN');

    return user;
  }
}