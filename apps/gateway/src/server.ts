import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getCircuit, getService, listServices } from './service-registry';

const PORT = Number(process.env.PORT || 3001);

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  app.get('/health', async () => ({ status: 'ok', service: 'gateway' }));

  app.get('/ping', async () => ({ pong: true }));

  app.get('/services', async () => ({ services: listServices() }));

  const hopByHopHeaders = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
    'host',
  ]);

  app.all<{
    Params: { service: string; '*': string };
  }>('/proxy/:service/*', async (request, reply) => {
    const serviceName = request.params.service;
    const service = getService(serviceName);
    const circuit = getCircuit(serviceName);

    if (!service || !circuit) {
      return reply.status(503).send({
        error: 'SERVICE_NOT_CONFIGURED',
        message: 'Servicio no configurado en el gateway.',
        service: serviceName,
      });
    }

    if (!circuit.canRequest()) {
      return reply.status(503).send({
        error: 'CIRCUIT_OPEN',
        message: 'Circuito abierto, servicio temporalmente aislado.',
        service: serviceName,
      });
    }

    const path = request.params['*'] ?? '';
    const targetUrl = new URL(path, service.baseUrl).toString();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), service.timeoutMs);

    try {
      circuit.onHalfOpenCall();

      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        const lower = key.toLowerCase();
        if (hopByHopHeaders.has(lower)) continue;
        if (value !== undefined) {
          headers.set(key, Array.isArray(value) ? value.join(',') : String(value));
        }
      }

      const body = request.body as unknown;
      const hasBody = body !== undefined && body !== null && request.method !== 'GET' && request.method !== 'HEAD';
      const contentType = request.headers['content-type']?.toLowerCase();

      let payload: BodyInit | undefined;
      if (hasBody) {
        if (contentType?.includes('application/json')) {
          payload = typeof body === 'string' ? body : JSON.stringify(body);
        } else if (body instanceof Uint8Array || body instanceof Buffer || typeof body === 'string') {
          payload = body as BodyInit;
        }
      }

      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: payload,
        signal: controller.signal,
      });

      circuit.recordSuccess();

      reply.status(response.status);
      response.headers.forEach((value, key) => {
        if (!hopByHopHeaders.has(key.toLowerCase())) {
          reply.header(key, value);
        }
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return reply.send(buffer);
    } catch {
      circuit.recordFailure();

      return reply.status(503).send({
        error: 'UPSTREAM_UNAVAILABLE',
        message: 'No se pudo contactar el servicio upstream.',
        service: serviceName,
      });
    } finally {
      clearTimeout(timeout);
    }
  });

  return app;
}

buildServer()
  .then((app) => app.listen({ port: PORT, host: '0.0.0.0' }))
  .then((address) => {
    console.log(`[gateway] listening on ${address}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
