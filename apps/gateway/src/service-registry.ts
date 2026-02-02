import { CircuitBreaker } from './resilience/circuit-breaker';

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeoutMs: number;
  circuitBreaker: {
    failureThreshold: number;
    resetTimeoutMs: number;
    halfOpenMaxCalls: number;
  };
}

const DEFAULT_CIRCUIT = {
  failureThreshold: 3,
  resetTimeoutMs: 15_000,
  halfOpenMaxCalls: 1,
};

function loadFromEnv(): ServiceConfig[] {
  const raw = process.env.GATEWAY_SERVICES;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<Partial<ServiceConfig>>;
    return parsed
      .filter((entry) => entry.name && entry.baseUrl)
      .map((entry) => ({
        name: entry.name as string,
        baseUrl: entry.baseUrl as string,
        timeoutMs: entry.timeoutMs ?? 3_000,
        circuitBreaker: {
          failureThreshold: entry.circuitBreaker?.failureThreshold ?? DEFAULT_CIRCUIT.failureThreshold,
          resetTimeoutMs: entry.circuitBreaker?.resetTimeoutMs ?? DEFAULT_CIRCUIT.resetTimeoutMs,
          halfOpenMaxCalls: entry.circuitBreaker?.halfOpenMaxCalls ?? DEFAULT_CIRCUIT.halfOpenMaxCalls,
        },
      }));
  } catch {
    return [];
  }
}

const SERVICES = loadFromEnv();
const registry = new Map<string, ServiceConfig>();
const breakers = new Map<string, CircuitBreaker>();

for (const service of SERVICES) {
  registry.set(service.name, service);
  breakers.set(service.name, new CircuitBreaker(service.circuitBreaker));
}

export function getService(serviceName: string) {
  return registry.get(serviceName);
}

export function getCircuit(serviceName: string) {
  return breakers.get(serviceName);
}

export function listServices() {
  return Array.from(registry.values()).map((service) => ({
    ...service,
    circuit: breakers.get(service.name)?.getSnapshot(),
  }));
}
