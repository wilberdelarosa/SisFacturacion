# Arquitectura Base: Hexagonal + Microservicios + BFF

Esta guía describe una **plantilla robusta y escalable** aplicable a cualquier proyecto. No contiene servicios específicos; define un marco reutilizable que puedes adaptar a tu dominio.

---
## 0. Estado de plantilla (sin servicios activos)
Este repositorio es **una base reusable**, no un sistema completo. Puedes iniciar sin servicios productivos y añadirlos cuando el proyecto lo requiera:
- El gateway está preparado para enrutar y aislar servicios mediante circuit breaker.
- Los servicios se agregan bajo demanda (no están activos por defecto).
- La documentación define el estándar que cualquier servicio futuro debe seguir.

---
## 1. Principios rectores
- **DDD y bounded contexts**: cada servicio es dueño exclusivo de sus tablas y reglas; se habla con los demás por APIs/eventos.
- **Arquitectura hexagonal (puertos y adaptadores)**: dominio puro, sin dependencias de frameworks. Cambiar DB o proveedor externo solo afecta adaptadores.
- **Canal único de acceso (Gateway/BFF)**: el frontend y canales externos consumen un único endpoint con auth, políticas y resiliencia.
- **Comunicación híbrida**: REST para flujos directos, eventos para desacoplar y tolerar fallos. Patrón outbox para confiabilidad.
- **Evolución por fases**: comenzar simple y separar servicios/DBs cuando haya tracción real.
- **Observabilidad y auditabilidad**: trazas, métricas y logs estructurados.

---
## 2. Mapa de servicios (genérico)
- **IAM / Access**: identidad, roles, permisos (si aplica).
- **Core Domain**: reglas del negocio central.
- **Reference Data**: catálogos, configuración, parámetros.
- **Transactions**: operaciones críticas y consistencia.
- **Analytics/Read Models**: proyecciones y consultas rápidas.
- **Audit/Compliance** (opcional): registro de acciones sensibles.
- **Automation/Integrations** (opcional): jobs, integraciones y tareas.
- **Canales externos** (web, móvil, bot, etc.) sin acceso directo a DB.

Cada servicio publica eventos de dominio (ej. `resource.created`, `resource.updated`) y expone REST interno para operaciones síncronas.

---
## 3. Plantilla hexagonal dentro de cada servicio
```
src/
  domain/
    entities/
    value-objects/
    services/        # lógica de negocio
    errors/
    ports/           # interfaces: repos, gateways, publishers
  application/
    use-cases/
    dtos/
    mappers/
  adapters/
    inbound/
      http/
      events/
      jobs/
    outbound/
      db/
      cache/
      messaging/
      external/
  infrastructure/
    config/
    observability/
    server.ts
```
Regla: `domain/` no importa nada de `adapters/`. Los casos de uso orquestan flujos y dependen de puertos.

---
## 4. Topología del monorepo
```
repo/
  apps/
    web/                # UI aislada (opcional)
    gateway/            # BFF/API Gateway
  services/
    service-a/
    service-b/
    service-c/
  packages/
    contracts/          # OpenAPI/JSON Schema + tipos
    shared-kernel/      # value objects y utilidades
    observability/      # logger, tracing, correlation-id
  infra/
    docker/
    k8s/
    terraform/
  docs/
    architecture.md
    adr/
```
Motivos: contratos versionados evitan acoplamiento; gateway centraliza resiliencia; paquetes compartidos reducen duplicación.

> Nota: la carpeta `services/` puede estar vacía al inicio.

---
## 5. Gateway/BFF: resiliencia y degradación
- Autenticación y autorización (IAM).
- Enrutamiento interno con timeouts y circuit breakers.
- Fallbacks: cachear respuestas recientes, colas para operaciones diferidas, respuestas degradadas con warnings.
- Rate limiting y validación de esquemas usando contratos compartidos.
- Observabilidad: tracing por petición, correlation-id, métricas de latencia/errores.
- Registro de servicios por configuración (ej. variable `GATEWAY_SERVICES`) para mantener el gateway desacoplado.

---
## 6. Comunicación: REST + eventos
- **REST**: CRUDs, consultas inmediatas, comandos que requieren respuesta rápida.
- **Eventos** (outbox + worker): propagan cambios sin acoplar consumidores. Ejemplos:
  - `resource.created` → analytics actualiza proyecciones.
  - `resource.updated` → notificaciones y tareas automáticas.
- Idempotencia en consumidores; reintentos con backoff; DLQ para eventos problemáticos.

---
## 7. Estrategia de datos y evolución
- **Fase 1**: una sola DB compartida; ownership lógico por servicio; nadie consulta tablas ajenas directamente.
- **Fase 2**: separar por esquemas/DB por servicio; migrar con mínimos cambios gracias a puertos/adaptadores.
- **Read models**: proyecciones derivadas de eventos para consultas rápidas.
- **Consistencia**: preferir consistencia eventual entre servicios; usar transacciones locales + outbox.

---
## 8. Beneficios clave
- **Flexibilidad tecnológica**: cambiar DB, mensajería o proveedor externo tocando solo adaptadores.
- **Escalabilidad evolutiva**: se inicia simple y se extraen servicios cuando hay necesidad real.
- **Resiliencia operativa**: gateway con fallbacks, eventos para desacoplar, DLQ y reintentos.
- **Productividad**: contratos compartidos evitan roturas en frontend y clientes; paquetes comunes reducen duplicación.
- **Trazabilidad**: auditoría opcional + tracing distribuido + métricas.

---
## 9. Flujos recomendados (genéricos)
- **Comando crítico**: canal → gateway → servicio core → evento → consumidores secundarios.
- **Consulta intensiva**: canal → gateway → servicio de lectura/analytics (cacheable).
- **Fallo de servicio**: gateway responde en modo degradado y registra el incidente para reintentos.

---
## 10. Roadmap de implementación (pragmático)
1) Arranque: gateway + 1 servicio core. DB única.
2) Extraer bounded contexts a servicios separados cuando crezca el dominio.
3) Añadir analytics/audit como satélites de lectura y cumplimiento.
4) Separar bases por servicio; añadir colas gestionadas.
5) Endurecer SLOs y observabilidad.

---
## 11. Observabilidad y operaciones
- Logs estructurados con correlation-id y user-id cuando aplique.
- Tracing distribuido (OTel) desde gateway hasta adaptadores DB/externos.
- Métricas: latencia p95/p99, tasa de errores, colas, reintentos, aciertos de caché.
- Alertas por SLO: disponibilidad de gateway, saturación de colas, degradación de servicios.
- Feature flags para degradar funciones sin desplegar.

---
## 12. Seguridad
- JWT o sesiones firmadas; rotación de claves; expiración corta + refresh.
- RBAC/ABAC centralizado; enforcement en gateway y servicios.
- Validación de input con esquemas; protección CSRF/XSS en web; rate limiting por canal.
- Aislamiento de secretos (vault) y mínimos privilegios por servicio.

---
## 13. Calidad y DX
- Pruebas por capa: unitarias de dominio (sin infra), de contrato (OpenAPI/JSON Schema), de integración por adaptador, end-to-end vía gateway.
- Lint/format/typed builds; pipelines que validan contratos y generan SDKs.
- ADRs en `docs/adr/` para decisiones clave.

---
## 14. Qué habilita esta arquitectura
- Sustituir la DB por otra en un servicio sin reescribir dominio.
- Añadir canales (bot, apps móviles) sin duplicar lógica: solo consumen gateway.
- Escalar hotspots de forma independiente.
- Experimentar con automatización sin riesgo para el core.

---
## 15. Documentos complementarios
- Guía de implementación: [docs/guide/implementation-playbook.md](guide/implementation-playbook.md)
- Blueprints por servicio (endpoints/eventos/tablas): [docs/guide/service-blueprints.md](guide/service-blueprints.md)
- Integración frontend (Next.js ↔ Gateway): [docs/guide/frontend-integration.md](guide/frontend-integration.md)
- Operación, datos y despliegue: [docs/guide/operations-and-data.md](guide/operations-and-data.md)
- Diagramas Mermaid (render a SVG con `pnpm diagram:render`): [docs/guide/diagrams/architecture.mmd](guide/diagrams/architecture.mmd)
