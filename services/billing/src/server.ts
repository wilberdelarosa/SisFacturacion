import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@template/database';

const server = Fastify({
    logger: true
});

const prisma = new PrismaClient();

server.register(cors, {
    origin: '*'
});

server.get('/health', async (_request, _reply) => {
    return { status: 'ok', service: 'billing' };
});

// Example route using Prisma
server.get('/companies', async (_request, _reply) => {
    const companies = await prisma.company.findMany();
    return companies;
});

const PORT = Number(process.env.PORT || 3002);

const start = async () => {
    try {
        await server.listen({ port: PORT, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
