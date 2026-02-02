# Implementation Plan - Update Database Schema

This plan outlines the steps to update the `packages/database/prisma/schema.prisma` file to match the provided `docs/reference/supabase-schema-completo.sql`.

## Goal
Synchronize the Prisma Schema with the robust Supabase SQL reference, enabling Multi-tenancy, Auth integration, and the full "Cotizacion -> Conduce -> Proforma -> Factura" flow.

## User Review Required
> [!IMPORTANT]
> The SQL reference uses PostgreSQL native features (Triggers, Stored Procedures, RLS). Prisma Schema mainly defines the **Structure** (Tables/Relations). The Business Logic (Triggers/Functions) will need to be applied via Raw SQL Migrations or reimplemented in the Application Layer (Node.js). **This plan focuses on the Structure.**

## Proposed Changes

### `packages/database/prisma/schema.prisma`

#### [NEW] Enums
- `DocumentType` (TipoDocumento)
- `DocumentStatus` (EstadoDocumento) - Expanded
- `PaymentStatus` (EstadoPago)
- `PaymentMethod` (MetodoPago)
- `ApprovalStatus` (EstadoAprobacion)
- `ProductType` (TipoProducto)
- `UserRole` (RolUsuario)
- `NcfType` (TipoNCF)

#### [NEW] Identity & Config Models
- `Branch` (sucursales) - Linked to `Company`.
- `User` (usuarios) - Added `authUserId` (Supabase), `avatar`, `config`.
- `Session` (sesiones) - For manual session tracking if needed.
- `Permission` (permisos) & `RolePermission` (roles_permisos).
- `UserPermission` (usuarios_permisos).
- `Tax` (impuestos).
- `DocumentSequence` (numeraciones_documentos).
- `NcfSequence` (secuencias_ncf).

#### [MODIFY] Core Models
- **Company**: Added `commercialName`, `web`, `config`.
- **Customer**: Added `commercialName`, `creditLimit`, `paymentDays`, `tags`.
- **Product**: Added `cost`, `category`, `brand`.
- **Equipment**: Added `brand`, `model`, `year`.

#### [NEW] Billing Flow Models
- **Quote**: Added `branchId`, `currency`, `exchangeRate`, `pipeline` fields, `approval` fields.
- **Waybill (Conduce)**: Linked to `Branch`, `Driver`, `Hours`.
- **Proforma**: Added `branchId`, `currency`, `exchangeRate`.
- **Invoice**: Added `branchId`, `ncf` fields, `payment` fields.
- **Payment (Pagos)**: New table for tracking payments.
- **Approval (Aprobaciones)**: New table for workflow.
- **ApprovalRule (ReglasAprobacion)**: New table for workflow rules.
- **AuditLog**: Expanded fields.
- **Activity**: New table for timeline events.
- **DocumentDelivery (Envios)**: Tracking emails.

## Verification Plan

### Automated Verification
- Run `pnpm --filter @template/database db:generate` to ensure valid Schema.
- Run `pnpm check:arch` (if applicable) to verify no architectural violations.

### Manual Verification
- Inspect the generated client in `node_modules`.
