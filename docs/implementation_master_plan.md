# Plan Maestro de Implementación - SisFacturacion

> **Visión**: Crear una plataforma SaaS Multi-Tenant para facturación de servicios complejos (transporte, alquiler, construcción), iniciando con el caso de uso "Alito Group".

---

## 1. Arquitectura de Negocio (El Flujo Real)

El sistema se basa en un flujo de trabajo **operativo > financiero**, no solo fiscal.

```mermaid
graph LR
    Quote[Cotización 📝\n(Presupuesto Estimado)] 
    -->|Aprueba Cliente| Conduce[Conduces 🚚\n(Trabajo Diario)]
    Conduce -->|Agrupa| Proforma[Proforma 📊\n(Reporte de Avance)]
    Proforma -->|Confirma Pago| Invoice[Factura Fiscal 🇩🇴\n(Comprobante NCF)]

    style Quote fill:#fff3cd,stroke:#e1b12c
    style Conduce fill:#fab1a0,stroke:#e17055
    style Proforma fill:#74b9ff,stroke:#0984e3
    style Invoice fill:#55efc4,stroke:#00b894
```

### Entidades Clave
1.  **Cotización**: El "Techo" presupuestario. No obliga a facturar, pero limita el alcance.
2.  **Conduce (NUEVO)**: La unidad atómica de trabajo. Resuelve el problema: *"¿Cuántos viajes hizo el camión H-93 el martes?"*.
3.  **Proforma**: El conciliador. Compara `Cotizado` vs `Real (Sumatoria de Conduces)`. Si hubo más viajes, la proforma lo refleja.
4.  **Factura**: El documento final. Solo se emite al pagar. Es "Fiscalmente Resumida" (Agrupa "10 viajes" en "Transporte de Material").

---

## 2. Mapa de Arquitectura Hexagonal

Asignación de responsabilidades a los servicios del Monorepo.

| Servicio | Responsabilidad (Bounded Context) | Tablas (SQL) |
| :--- | :--- | :--- |
| **Identity** | Auth, Usuarios, Roles, Permisos | `usuarios`, `empresas` |
| **MasterData** | Catálogos compartidos, Clientes, Productos | `clientes`, `productos_servicios`, `equipos` |
| **Billing** | **CORE DEL NEGOCIO**. Flujo de documentos. | `cotizaciones`, `conduces`, `proformas`, `facturas` |
| **Fiscal** | Reglas de NCF y DGII (Rep. Dom.) | `secuencias_ncf` |
| **Reporting** | Dashboard y BI | Vistas SQL (`v_flujo_completo`) |

---

## 3. Roadmap de Implementación

### Fase 1: MVP (El "Walking Skeleton") 🚧
> **Objetivo**: Que "Alito Group" pueda hacer el ciclo `Cotizar -> Conduce -> Proforma -> Facturar` en Producción.

- [ ] **DB**: Migrar esquema SQL a Prisma (PostgreSQL).
- [ ] **Identity**: Login básico (JWT) y Multi-tenant lógico (`empresa_id` en todo).
- [ ] **MasterData**: CRUD de Clientes y Equipos (Camiones/Maquinaria).
- [ ] **Billing (Core)**:
    - [ ] Endpoint `POST /cotizaciones` (Crear presupuesto).
    - [ ] Endpoint `POST /conduces` (Registrar viaje diario).
    - [ ] **Lógica Compleja**: `POST /proformas/generar` (Algoritmo que busca conduces pendientes y crea la proforma).
- [ ] **Frontend**: 4 Pantallas clave (Listado Cotizaciones, Registro Conduce, Ver Proforma, Imprimir Factura).

### Fase 2: Robustez y Auditoría 🛡️
> **Objetivo**: Control y Seguridad.

- [ ] **Roles**: Validar que "Operador" solo crea Conduces, "Contabilidad" factura.
- [ ] **Workflow**: Estados estrictos (No facturar si no hay pago registrado).
- [ ] **PDF Engine**: Generación de PDFs bonitos para Cotizaciones y Facturas.
- [ ] **Notificaciones**: Email al cliente cuando se genera la Proforma.

### Fase 3: BI e Integraciones 📈
> **Objetivo**: Inteligencia de Negocios.

- [ ] **Dashboard**: Gráfica de "Cotizado vs Real" (Variaciones de presupuesto).
- [ ] **WhatsApp**: Bot para que los choferes registren conduces enviando una foto.
- [ ] **Contabilidad**: Exportar CSV para el contador.

---

## 4. Próximos Pasos Inmediatos (Para el Dev)

1.  **Actualizar el Schema**: Convertir el SQL provisto a `schema.prisma`.
2.  **API de Conduces**: Crear el endpoint para registrar el trabajo diario.
3.  **Algoritmo de Proforma**: Implementar la función `crear_proforma_desde_conduces` en TypeScript (lógica de dominio).

Este plan asegura que construimos exactamente lo que el negocio necesita, usando la estructura técnica robusta que ya definimos.
