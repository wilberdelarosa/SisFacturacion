# Operación, datos y despliegue

Detalles para operar, desplegar y mantener consistencia de datos y eventos.

## 1) Bases de datos y migraciones
- Fase 1: un Postgres compartido, con ownership lógico por servicio. Ningún servicio lee tablas ajenas directamente.
- Fase 2: separar por schema o por base (CoreDB, RefDB, AnalyticsDB…). Cambiar adaptadores DB sin tocar dominio.
- Migraciones por servicio en su carpeta `infra/db/migrations`. Automatizar en CI/CD antes de desplegar.
- Backups y restauración probados; migrations idempotentes o con guardas.

## 2) Eventos y mensajería
- Patrón outbox por servicio; worker publica al bus (Kafka/Rabbit/Redis streams).
- Contratos de eventos versionados en `packages/contracts`.
- Idempotencia en consumidores (keys de deduplicación) y DLQ para fallas recurrentes.
- Correlation-id propagado para trazabilidad cross-servicio.

## 3) Gateway/BFF en producción
- Timeouts conservadores por ruta; circuit breakers por servicio.
- Caché Redis para catálogos/reportes; modo degradado con TTL corto y warnings.
- Rate limiting y protección contra abuso (per IP y per user).

## 4) Seguridad y secretos
- Gestión de secretos en vault/KeyVault/SSM; nunca en repo.
- RBAC centralizado; validación de scopes en gateway y servicios.
- TLS extremo a extremo; rotación de claves de firma JWT.

## 5) Observabilidad y SLOs
- Logs estructurados + tracing OTel + métricas (Prometheus/Grafana).
- SLOs sugeridos: disponibilidad gateway ≥ 99.5%, latencia p95 API < 300ms en rutas sync, éxito de jobs críticos > 98%.
- Alertas en errores 5xx, saturación de colas, backlog de outbox.

## 6) Despliegue y ambientes
- Ambientes: local, staging, producción. Staging debe usar datos sintéticos o enmascarados.
- Contenedores por app/servicio. Orquestación: docker-compose local; K8s en prod (manifests en `infra/k8s`).
- CI/CD: lint + test + build + contract check + migrations + despliegue progresivo (canary/blue-green).
- Feature flags para activar/desactivar módulos sin redeploy.

## 7) Integraciones externas (proveedores, bots, email)
- Encapsular en `adapters/outbound/external` con timeouts, retries, circuit breakers.
- Simuladores/mocks para tests y ambientes no productivos.
- Telemetría específica por proveedor (latencia, tasa de error, SLA).

## 8) Datos sensibles y auditoría
- Enmascarar PII en logs. Cifrar en reposo/ tránsito.
- Registrar acciones sensibles en Audit (creación/edición de usuarios, cambios de estado, aprobaciones).
- Retención y purga según compliance.
