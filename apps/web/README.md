# App Web (Next.js) – SisFacturacion

## Variables de entorno

Next.js carga `.env` y `.env.local` desde **este directorio** (`apps/web`). Para que la autenticación con Supabase funcione:

1. Copia `.env.example` a `.env.local`.
2. Rellena los valores de tu proyecto Supabase (URL, anon key, service role).

Si ya tienes un `.env` en la **raíz del monorepo**, puedes copiar las variables de Supabase a `apps/web/.env.local` o enlazar:

- Windows (PowerShell): `Copy-Item ..\..\.env .env.local`
- Luego revisa que existan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE` (o `SUPABASE_SERVICE_ROLE_KEY`).

**Si `/api/register` devuelve 500:** en Supabase (Project Settings > API) usa la clave **service_role** en formato JWT (empieza por `eyJ...`). Si tu clave es tipo `sb_secret_...` y falla el registro, sustituye por la JWT.

## Roles (Supabase + BD)

Los roles coinciden con el enum `RolUsuario` en la base de datos:

- `super_admin`, `admin`, `gerente`, `vendedor`, `contador`, `operador`

Solo `admin` y `super_admin` pueden gestionar usuarios (crear, editar, eliminar) desde la sección Administración.

## Desarrollo

```bash
pnpm dev
```

Desde la raíz del monorepo: `pnpm dev` (Turbo ejecuta la app web; asegúrate de tener las env en `apps/web/.env.local`).
