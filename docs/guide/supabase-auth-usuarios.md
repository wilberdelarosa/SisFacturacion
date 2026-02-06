# Enlace de la tabla `usuarios` con Supabase Auth

## Relación

- **auth.users** (esquema `auth`, gestionado por Supabase): usuarios que pueden iniciar sesión.
- **public.usuarios**: perfiles de negocio (rol, empresa_id, sucursal_id, etc.).

El enlace es el campo **public.usuarios.auth_user_id** = **auth.users.id**.

## Flujo

1. **Registro** (API `/api/register` o admin crea usuario): se crea el usuario en `auth.users` y luego una fila en `public.usuarios` con ese `auth_user_id`.
2. **Login**: el cliente usa `supabase.auth.signInWithPassword`; la sesión incluye el `id` del usuario (auth.users.id). La app busca en `public.usuarios` por `auth_user_id` para obtener rol, empresa_id, sucursal_id.
3. **RLS**: las políticas de `public.usuarios` usan `get_auth_user_id()` (que lee el JWT). Los usuarios autenticados solo ven/editan según las políticas (misma empresa o ser admin).

## Si las políticas no reconocen al usuario

En Supabase, el JWT se inyecta en cada petición. Si `get_auth_user_id()` devuelve NULL, comprueba que:

- El cliente esté usando la **anon key** (no la service_role) en el navegador.
- El usuario haya hecho **login** con `signInWithPassword` para que el cliente envíe el JWT.

Opcional: en el SQL de tu proyecto puedes usar `auth.uid()` en lugar de `get_auth_user_id()` si tu versión de Supabase lo expone en RLS (equivalente al `sub` del JWT).

## Variables de entorno

La app **Next.js** (apps/web) solo lee `.env` desde **apps/web**. Para que Auth y la API funcionen:

- Crea **apps/web/.env.local** con:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE` o `SUPABASE_SERVICE_ROLE_KEY`

Si **api/register** devuelve 500, puede ser por la clave de servicio. En el dashboard de Supabase (Project Settings > API) usa la clave **service_role** en formato JWT (empieza por `eyJ...`) si la que tienes es tipo `sb_secret_` y falla.
