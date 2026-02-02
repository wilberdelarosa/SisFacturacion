# Contracts

Contratos canónicos (OpenAPI/JSON Schema) para gateway, web y bot.

- Esquema base: `openapi/core.yaml` (endpoints núcleo: auth, resources, reports, health).
- Objetivo: generar SDKs tipados y pruebas de contrato.
- Fuente de verdad para validación en gateway y clientes.

## Próximos pasos
- Extender OpenAPI por servicio (service-a, service-b, service-c).
- Añadir schemas de errores estándar y códigos de dominio.
- Automatizar generación de SDK (ej. `openapi-typescript`, `orval`, `@redocly/cli`).
