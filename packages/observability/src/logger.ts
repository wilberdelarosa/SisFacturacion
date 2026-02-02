export function createLogger(service: string) {
  return {
    info: (msg: string, meta?: Record<string, unknown>) =>
      console.log(JSON.stringify({ level: 'info', service, msg, ...(meta ?? {}) })),
    error: (msg: string, meta?: Record<string, unknown>) =>
      console.error(JSON.stringify({ level: 'error', service, msg, ...(meta ?? {}) }))
  };
}
