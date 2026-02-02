# Integración Frontend (Next.js) con Gateway

Cómo conectar el frontend aislado (apps/web) al BFF con resiliencia y tipado.

## 1) Cliente HTTP tipado
- Genera SDK a partir de `packages/contracts` (OpenAPI/JSON Schema) o usa un cliente ligero con Zod/Schemas.
- Centraliza el fetcher (SWR/React Query) incluyendo: baseURL del gateway, headers de auth, `correlation-id` y manejo de errores.

## 2) Autenticación
- Preferir cookies httpOnly para tokens de acceso/refresh; o Authorization Bearer con expiración corta.
- Refrescar tokens mediante endpoint del gateway (que consulta IAM).
- Proteger rutas en el App Router con middleware (server components) verificando sesión.

## 3) Estados y degradación elegante
- Estados: loading, empty, error, stale. Usa `stale-while-revalidate` para datos cacheables (catálogos, reportes).
- Si gateway responde en modo degradado (warning), muestra banner y datos cacheados.
- Reintentos exponenciales controlados (no para operaciones no idempotentes, salvo que gateway lo permita).

## 4) Acceso a servicios (ejemplos)
- Catálogos: GET via gateway → service-b.
- Recursos core: POST/GET/PATCH via gateway → service-a.
- Reportes: GET con cache; para reportes async, lanzar job y hacer polling/sse.

## 5) Manejo de errores UX
- 401/403: redirigir a login o mostrar “no autorizado”.
- 409/422: mostrar validaciones de dominio (ej. conflicto de estado, dato inválido).
- 503/timeouts: modo degradado con datos locales/cache; opción de reintentar.

## 6) Observabilidad desde frontend
- Enviar `x-correlation-id` generado en gateway o cliente.
- Capturar métricas de UX (TTFB, LCP) y asociar con IDs de sesión cuando sea posible.

## 7) Performance
- Uso de server components para data fetching seguro y caché en servidor cuando aplique.
- Prefetch de rutas clave; lazy load de secciones pesadas (reportes, dashboards).

## 8) Seguridad en UI
- Escapar/validar inputs; sanitizar HTML si se muestran notas/comentarios.
- Evitar exponer secrets en el cliente; solo variables públicas NEXT_PUBLIC.
