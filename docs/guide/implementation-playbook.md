# Playbook de implementación

Guía paso a paso para agregar funcionalidades nuevas respetando hexagonal, bounded contexts y la resiliencia del BFF.

## 1) Checklist inicial (por feature)
- Identifica el bounded context dueño (service-a, service-b, service-c, etc.).
- Define si es comando (cambia estado) o consulta (solo lectura) y si es síncrono (REST) o asíncrono (evento/cola).
- Actualiza contratos en `packages/contracts` (DTOs + esquemas). Genera tipos para frontend/gateway.
- Diseña los puertos necesarios (repos, publishers, gateways externos) en `src/domain/ports` del servicio.
- Agrega casos de uso en `src/application/use-cases` (orquestan dominio + puertos).
- Implementa adaptadores:
  - Inbound: HTTP (controladores), eventos (suscriptores), jobs (workers).
  - Outbound: DB (repos), cache, messaging (event bus), external (proveedores, email, storage, etc.).
- Cubre observabilidad: logs estructurados, tracing, métricas y auditoría opcional.
- Añade pruebas: dominio puro, contratos, integración de adaptadores, E2E vía gateway.

## 2) Cómo agregar un endpoint REST en un servicio
1. Define DTO en `packages/contracts` (request/response, códigos de error).
2. Crea/actualiza el puerto de repositorio o gateway externo en `domain/ports`.
3. Implementa caso de uso en `application/use-cases` usando entidades/value-objects.
4. Implementa controlador HTTP en `adapters/inbound/http` que:
   - Valida input con el esquema del contrato.
   - Mapea DTO ↔ dominio.
   - Llama al caso de uso y traduce errores de dominio a HTTP.
5. Añade ruta en el servidor del servicio y exporta un `router` para que el gateway lo consuma si aplicara.
6. Documenta el contrato (OpenAPI/JSON Schema) y publica versión en `packages/contracts`.
7. Prueba: unidad (dominio), integración (adaptador DB), contrato (schema), E2E vía gateway.

## 3) Cómo publicar/consumir eventos (outbox)
- Dominio produce eventos ricos (`ResourceCreated`, `ResourceUpdated`, `TaskCompleted`).
- En el caso de uso, guarda el evento en la tabla outbox (misma transacción que los cambios de negocio).
- Un worker en `adapters/inbound/jobs` lee outbox y publica al bus (Kafka/Rabbit/Redis streams) con idempotencia.
- Consumidores en otros servicios implementan handlers en `adapters/inbound/events`, validan esquema y aplican lógica (ej. projections, notificaciones).
- Retries con backoff + DLQ. Todo evento importante genera auditoría opcional.

## 4) Cómo integrar con Base de Datos
- Repositorios concretos en `adapters/outbound/db` implementan los puertos definidos en dominio.
- No exponer SQL/ORM fuera de adaptadores. Casos de uso solo ven interfaces.
- Transacciones locales por servicio; consistencia eventual entre servicios vía eventos.
- Migraciones por servicio (ej. `services/<svc>/infra/db/migrations`). Nunca compartir tablas entre servicios.

## 5) Cómo extraer módulos internos a servicios
- Fase 1: el servicio core incluye módulos internos (adapters internos) pero con puertos separados para poder extraer luego.
- Fase 2: extrae el módulo como servicio propio; reutiliza los mismos puertos/adaptadores pero apuntando a endpoints remotos/eventos.

## 6) Cómo agregar el frontend (Next.js)
- Toda comunicación es vía gateway usando SDK tipado generado de `packages/contracts`.
- Usar fetcher con SWR/React Query, con manejo de estados: loading, error (con fallback), stale-while-revalidate.
- Guardar auth tokens en cookies httpOnly o session según estrategia. En el cliente, usar sólo tokens de acceso cortos.
- Errores de gateway deben mostrarse con mensajes claros y opción de reintento/offline.

## 7) Cómo conectar el gateway
- Expone rutas públicas para los canales; internamente llama REST a servicios.
- Aplica auth/RBAC vía IAM (token introspection / JWKS / policy API).
- Implementa circuit breakers, timeouts y cachés de respuesta para degradar con gracia.
- Si un servicio crítico falla, responder con estado pendiente y encolar job.

## 8) Observabilidad y auditoría
- Inyecta `correlation-id` en gateway y propaga en headers a servicios.
- Log estructurado: level, service, correlationId, userId, action, errorCode.
- Tracing OTel: spans por request + por llamada a DB/external.
- Métricas: p95/p99 latencia, tasa de error, tamaño de colas, reintentos, aciertos de caché.
- Auditoría: acciones sensibles envían evento a un servicio de auditoría (opcional).

## 9) Pruebas recomendadas
- Dominio: 100% determinista, sin mocks de infraestructura.
- Contratos: validar schemas contra ejemplos de requests/responses.
- Adaptadores: pruebas de integración (DB, bus, cache) con entornos locales.
- E2E: flujos clave vía gateway (crear recurso, actualizar estado, consultar proyecciones).

## 10) Secuencia típica para una nueva feature
1. Redacta ADR breve en `docs/adr` si cambia arquitectura o contratos.
2. Define contratos y esquemas.
3. Implementa dominio + casos de uso + adaptadores (HTTP/DB/eventos).
4. Exponer en gateway con validación y resiliencia.
5. Añadir UI en web/bot consumiendo gateway.
6. Añadir observabilidad y auditoría.
7. Pruebas y despliegue progresivo (feature flag si aplica).
