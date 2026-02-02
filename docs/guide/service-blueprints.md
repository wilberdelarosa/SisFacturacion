# Blueprints de servicios y contratos (genérico)

Referencia reusable por servicio: responsabilidades, tablas, endpoints recomendados y eventos clave. Adapta los nombres a tu dominio.

## Service A (Core Domain)
- Tablas: entidades centrales del negocio.
- Endpoints (REST internos expuestos vía gateway):
  - POST /resources
  - GET /resources/:id
  - PATCH /resources/:id
- Eventos:
  - resource.created, resource.updated, resource.state_changed

## Service B (Reference Data)
- Tablas: catálogos, parámetros, configuración.
- Endpoints:
  - GET /catalogs
  - POST /catalogs
  - GET /catalogs/:id
- Eventos:
  - catalog.updated

## Service C (Analytics / Read Models)
- Tablas: proyecciones, vistas materializadas, agregados.
- Endpoints:
  - GET /reports/:id (cacheable)
  - POST /reports/run (async, devuelve jobId)
- Eventos consumidos: resource.created/updated.
- Eventos producidos: report.generated, projection.updated.

## Audit (opcional)
- Tabla: audit_logs.
- Endpoints:
  - POST /audit (registrar evento auditado, normalmente interno)
  - GET /audit (filtros por usuario/entidad/acción, con paginación)

## Automation/Integrations (opcional)
- Tablas: jobs, runs, integrations.
- Endpoints:
  - POST /jobs/run
  - POST /integrations/:id/trigger
- Eventos:
  - job.completed, integration.failed

## Gateway/BFF
- Rutas públicas para clientes; autenticación y RBAC; fanout interno a servicios.
- Responsabilidades: timeouts, circuit breakers, caché, fallbacks degradados, agregación de respuestas, validación de contratos.

## Canales externos (opcional)
- Sin DB. Consumir gateway y recibir eventos para notificar.

## Contratos (packages/contracts)
- JSON Schema/OpenAPI versionados. Desde aquí se generan SDKs para clientes y testing de contratos.
