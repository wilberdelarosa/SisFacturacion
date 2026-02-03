import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateAdminUserUseCase, CreateAdminUserInput } from '../../application/use-cases/CreateAdminUserUseCase';

export class CreateAdminUserController {
  constructor(private readonly createAdminUserUseCase: CreateAdminUserUseCase) {}

  async handle(req: FastifyRequest<{ Body: CreateAdminUserInput }>, res: FastifyReply): Promise<void> {
    try {
      const input = req.body;
      const user = await this.createAdminUserUseCase.execute(input);
      res.status(201).send(user);
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  }
}