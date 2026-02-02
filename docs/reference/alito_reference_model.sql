-- =====================================================
-- MODELO AJUSTADO PARA ALITO GROUP
-- Flujo: Cotización → Conduces → Proforma → Factura
-- Base de datos: PostgreSQL
-- =====================================================

/*
╔════════════════════════════════════════════════════════════════════╗
║  FLUJO REAL DEL NEGOCIO (ALITO GROUP)                             ║
╚════════════════════════════════════════════════════════════════════╝

1️⃣ COTIZACIÓN (Presupuesto Global)
   - Cliente: "ACCURATE CONSTRUCTION"
   - Servicio: "Suministro de Caliche Camión de 18m3"
   - Cantidad estimada: 54 M3
   - Precio: $900 x M3 = $48,600
   - Estado: borrador → aprobada

2️⃣ CONDUCES (Registros de Trabajo Diario)
   - Documento físico por cada entrega/servicio
   - Ejemplo: Equipo Mini Excavadora, Placa: H-93
   - Hora: 4/0 TA
   - Materiales: Grava Arena, Grava, Arena, Caliche, etc.
   - Se generan MÚLTIPLES conduces por cotización
   - Total conduces: 200 viajes

3️⃣ PROFORMA (Reporte de Seguimiento)
   - Agrupa CONDUCES por periodo
   - Ejemplo: 4 días de trabajo
     * 27-ene: Transporte (1 PA) = $16,000
     * 27-ene: Bote Material (1 VI) = $5,000  
     * 28-ene: Bote Material (1 VI) = $5,000
     * 27-30-ene: Alquiler (4 DIA) = $104,000
   - TOTAL: $148,720 (vs cotización $48,600)
   - Muestra VARIACIONES respecto a cotización
   - Estado: en_proceso → completada

4️⃣ FACTURA (Documento Fiscal DESPUÉS del Pago)
   - NCF: B0100001849
   - RESUMIDA: Agrupa servicios similares
     * Transporte Retropala: 1 PA x $12,000 = $12,000
     * Alquiler Retropala: 3 DIAS x $20,000 = $60,000
   - ITBIS 18%: $10,800
   - TOTAL: $82,800
   - Se emite DESPUÉS de recibir el pago
   - Para efectos fiscales (DGII)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DIFERENCIAS CLAVE vs Modelo Tradicional:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- CONDUCES = Nueva entidad (documentos de trabajo)
- PROFORMA = Reporte de seguimiento (NO documento previo)
- FACTURA = Después del pago (NO para cobrar)
- Relación: 1 Cotización → N Conduces → 1 Proforma → 1 Factura
*/

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE "TipoDocumento" AS ENUM (
  'cotizacion',      -- Presupuesto global
  'conduce',         -- Constancia de trabajo/entrega
  'proforma',        -- Reporte de seguimiento
  'factura',         -- Documento fiscal
  'nota_credito',
  'nota_debito'
);

CREATE TYPE "EstadoDocumento" AS ENUM (
  'borrador',        -- Cotización inicial
  'enviada',         -- Enviada al cliente
  'aprobada',        -- Cotización aprobada
  'en_proceso',      -- Proforma en proceso (conduces activos)
  'completada',      -- Proforma completada
  'pendiente_pago',  -- Esperando pago
  'pagada',          -- Pago recibido
  'facturada',       -- Factura emitida
  'cancelada',
  'anulada'
);

CREATE TYPE "TipoCliente" AS ENUM ('individual', 'empresa');
CREATE TYPE "TipoProducto" AS ENUM ('producto', 'servicio', 'alquiler', 'transporte');
CREATE TYPE "RolUsuario" AS ENUM ('admin', 'vendedor', 'operador', 'contabilidad');
CREATE TYPE "EstadoPago" AS ENUM ('sin_pagar', 'pago_parcial', 'pagado', 'reembolsado');
CREATE TYPE "MetodoPago" AS ENUM ('efectivo', 'transferencia', 'tarjeta', 'cheque', 'otro');

-- NCF República Dominicana
CREATE TYPE "TipoNCF" AS ENUM (
  'B01', 'B02', 'B03', 'B04', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16',
  'E31', 'E32', 'E33', 'E34', 'E41', 'E43', 'E44', 'E45', 'E46', 'E47'
);

-- =====================================================
-- TABLAS BASE
-- =====================================================

CREATE TABLE "empresas" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "nombre"                VARCHAR(255) NOT NULL,
  "rnc"                   VARCHAR(50) NOT NULL,
  "direccion"             TEXT NOT NULL,
  "telefono"              VARCHAR(50) NOT NULL,
  "correo"                VARCHAR(255) NOT NULL,
  "logo"                  TEXT,
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "usuarios" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "empresa_id"            VARCHAR(36) NOT NULL,
  "nombre"                VARCHAR(255) NOT NULL,
  "correo"                VARCHAR(255) NOT NULL UNIQUE,
  "password_hash"         VARCHAR(255) NOT NULL,
  "rol"                   "RolUsuario" DEFAULT 'operador',
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
);

CREATE TABLE "clientes" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "empresa_id"            VARCHAR(36) NOT NULL,
  "nombre"                VARCHAR(255) NOT NULL,
  "rnc_o_cedula"          VARCHAR(50),
  "tipo"                  "TipoCliente" NOT NULL,
  "direccion"             TEXT,
  "telefono"              VARCHAR(50),
  "correo"                VARCHAR(255),
  "contacto"              VARCHAR(255),
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_clientes_empresa" ON "clientes"("empresa_id");
CREATE INDEX "idx_clientes_rnc" ON "clientes"("rnc_o_cedula");

CREATE TABLE "productos_servicios" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "empresa_id"            VARCHAR(36) NOT NULL,
  "codigo"                VARCHAR(100),
  "nombre"                VARCHAR(255) NOT NULL,
  "descripcion"           TEXT,
  "tipo"                  "TipoProducto" NOT NULL,
  "unidad"                VARCHAR(50),  -- M3, PA, DIA, VI, etc.
  "precio_unitario"       DECIMAL(20,2) NOT NULL,
  "tasa_impuesto"         DECIMAL(5,2) DEFAULT 18.00,
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
);

COMMENT ON COLUMN "productos_servicios"."unidad" IS 'M3, PA (pasada), DIA, VI (viaje), HORA, etc.';

CREATE INDEX "idx_productos_empresa" ON "productos_servicios"("empresa_id");

CREATE TABLE "equipos" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "empresa_id"            VARCHAR(36) NOT NULL,
  "nombre"                VARCHAR(255) NOT NULL,  -- "Mini Excavadora", "Camión 1020247"
  "placa"                 VARCHAR(50),            -- "H-93"
  "codigo"                VARCHAR(50),
  "tipo"                  VARCHAR(100),           -- "Excavadora", "Camión", "Retropala"
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
);

COMMENT ON TABLE "equipos" IS 'Equipos/vehículos de la empresa (para conduces)';

CREATE INDEX "idx_equipos_empresa" ON "equipos"("empresa_id");

-- =====================================================
-- 1️⃣ COTIZACIÓN (Presupuesto Global)
-- =====================================================

CREATE TABLE "cotizaciones" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "numero_cotizacion"     VARCHAR(50) NOT NULL UNIQUE,
  "empresa_id"            VARCHAR(36) NOT NULL,
  "cliente_id"            VARCHAR(36) NOT NULL,
  "usuario_id"            VARCHAR(36),
  
  -- Información
  "lugar"                 VARCHAR(255),  -- "CAYUCO #39"
  "fecha_emision"         TIMESTAMP NOT NULL,
  "valido_hasta"          TIMESTAMP,
  "estado"                "EstadoDocumento" DEFAULT 'borrador',
  
  -- Montos
  "subtotal"              DECIMAL(20,2) DEFAULT 0,
  "monto_impuesto"        DECIMAL(20,2) DEFAULT 0,
  "total"                 DECIMAL(20,2) DEFAULT 0,
  
  -- Adicional
  "notas"                 TEXT,
  "terminos_condiciones"  TEXT,
  "pago_al_contado"       BOOLEAN DEFAULT FALSE,
  
  "creado_por"            VARCHAR(36),
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "cotizaciones" IS '1️⃣ Presupuesto global estimado';

CREATE INDEX "idx_cotizaciones_numero" ON "cotizaciones"("numero_cotizacion");
CREATE INDEX "idx_cotizaciones_cliente" ON "cotizaciones"("cliente_id");
CREATE INDEX "idx_cotizaciones_estado" ON "cotizaciones"("estado");

CREATE TABLE "cotizaciones_items" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "cotizacion_id"         VARCHAR(36) NOT NULL,
  "producto_servicio_id"  VARCHAR(36),
  "descripcion"           TEXT NOT NULL,
  "cantidad"              DECIMAL(10,2) NOT NULL,
  "unidad"                VARCHAR(50),
  "precio_unitario"       DECIMAL(20,2) NOT NULL,
  "tasa_impuesto"         DECIMAL(5,2) DEFAULT 0,
  "subtotal"              DECIMAL(20,2) NOT NULL,
  "orden"                 INTEGER DEFAULT 0,
  
  FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE CASCADE,
  FOREIGN KEY ("producto_servicio_id") REFERENCES "productos_servicios"("id") ON DELETE SET NULL
);

CREATE INDEX "idx_cotizaciones_items_cotizacion" ON "cotizaciones_items"("cotizacion_id");

-- =====================================================
-- 2️⃣ CONDUCES (Constancias de Trabajo/Entrega)
-- =====================================================

CREATE TABLE "conduces" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "numero_conduce"        VARCHAR(50) NOT NULL,
  "empresa_id"            VARCHAR(36) NOT NULL,
  "cotizacion_id"         VARCHAR(36),  -- Puede estar asociado a cotización
  "cliente_id"            VARCHAR(36),
  
  -- Detalles del conduce
  "equipo_id"             VARCHAR(36),
  "equipo_nombre"         VARCHAR(255),  -- "Mini Excavadora"
  "placa"                 VARCHAR(50),   -- "H-93"
  "hora_manana"           VARCHAR(20),   -- "4/0 TA"
  "hora_tarde"            VARCHAR(20),   -- "12"
  
  -- Fecha y lugar
  "fecha"                 DATE NOT NULL,
  "lugar"                 VARCHAR(255),
  
  -- Materiales/Servicios
  "grava_arena"           DECIMAL(10,2),
  "grava"                 DECIMAL(10,2),
  "arena"                 DECIMAL(10,2),
  "caliche"               DECIMAL(10,2),
  "bote_escombros"        DECIMAL(10,2),
  "otros"                 TEXT,
  
  -- Montos (si aplica)
  "subtotal"              DECIMAL(20,2),
  "monto_impuesto"        DECIMAL(20,2),
  "total"                 DECIMAL(20,2),
  
  -- Firmas
  "entregado_por"         VARCHAR(255),
  "recibido_por"          VARCHAR(255),
  "firma_entrega"         TEXT,  -- Base64
  "firma_recibido"        TEXT,  -- Base64
  
  -- Estado
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "incluido_en_proforma"  BOOLEAN DEFAULT FALSE,
  "proforma_id"           VARCHAR(36),  -- Se llena al incluir en proforma
  
  "creado_por"            VARCHAR(36),
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE SET NULL,
  FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL,
  FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "conduces" IS '2️⃣ Documentos de entrega/trabajo diario (constancia física)';
COMMENT ON COLUMN "conduces"."hora_manana" IS 'Ej: "4/0 TA" (4 horas mañana, turno tarde)';

CREATE INDEX "idx_conduces_numero" ON "conduces"("numero_conduce");
CREATE INDEX "idx_conduces_cotizacion" ON "conduces"("cotizacion_id");
CREATE INDEX "idx_conduces_fecha" ON "conduces"("fecha");
CREATE INDEX "idx_conduces_proforma" ON "conduces"("proforma_id");

-- =====================================================
-- 3️⃣ PROFORMA (Reporte de Seguimiento)
-- =====================================================

CREATE TABLE "proformas" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "numero_proforma"       VARCHAR(50) NOT NULL UNIQUE,
  "empresa_id"            VARCHAR(36) NOT NULL,
  "cotizacion_id"         VARCHAR(36) NOT NULL,
  "cliente_id"            VARCHAR(36) NOT NULL,
  
  -- Periodo del reporte
  "fecha_inicio"          DATE NOT NULL,
  "fecha_fin"             DATE NOT NULL,
  "fecha_emision"         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Estado
  "estado"                "EstadoDocumento" DEFAULT 'en_proceso',
  
  -- Montos calculados de conduces
  "total_exc"             DECIMAL(20,2) DEFAULT 0,  -- TOTAL EXC
  "total_grav"            DECIMAL(20,2) DEFAULT 0,  -- TOTAL GRAV
  "total_general"         DECIMAL(20,2) DEFAULT 0,  -- TOTAL EXC + GRAV
  "itbis_18"              DECIMAL(20,2) DEFAULT 0,  -- ITBIS 18%
  "total_rd"              DECIMAL(20,2) DEFAULT 0,  -- TOTAL GENERAL RD
  
  -- Comparación con cotización
  "cotizacion_total"      DECIMAL(20,2),
  "variacion_monto"       DECIMAL(20,2),  -- Diferencia
  "variacion_porcentaje"  DECIMAL(5,2),   -- %
  
  -- Adicional
  "observaciones"         TEXT,
  "cantidad_conduces"     INTEGER DEFAULT 0,
  
  "creado_por"            VARCHAR(36),
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT
);

COMMENT ON TABLE "proformas" IS '3️⃣ Reporte que agrupa conduces y compara vs cotización';
COMMENT ON COLUMN "proformas"."variacion_monto" IS 'Diferencia entre trabajo real y cotización';

CREATE INDEX "idx_proformas_numero" ON "proformas"("numero_proforma");
CREATE INDEX "idx_proformas_cotizacion" ON "proformas"("cotizacion_id");
CREATE INDEX "idx_proformas_estado" ON "proformas"("estado");

CREATE TABLE "proformas_items" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "proforma_id"           VARCHAR(36) NOT NULL,
  "conduce_id"            VARCHAR(36),  -- Referencia al conduce
  "numero_conduce"        VARCHAR(50),
  "fecha"                 DATE,
  "equipo"                VARCHAR(255),
  "descripcion"           TEXT NOT NULL,
  "cantidad"              DECIMAL(10,2) NOT NULL,
  "unidad"                VARCHAR(50),
  "precio_unitario"       DECIMAL(20,2) NOT NULL,
  "total"                 DECIMAL(20,2) NOT NULL,
  "orden"                 INTEGER DEFAULT 0,
  
  FOREIGN KEY ("proforma_id") REFERENCES "proformas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("conduce_id") REFERENCES "conduces"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "proformas_items" IS 'Líneas de la proforma (agrupación de conduces)';

CREATE INDEX "idx_proformas_items_proforma" ON "proformas_items"("proforma_id");
CREATE INDEX "idx_proformas_items_conduce" ON "proformas_items"("conduce_id");

-- =====================================================
-- 4️⃣ FACTURA (Documento Fiscal DESPUÉS DEL PAGO)
-- =====================================================

CREATE TABLE "facturas" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "numero_factura"        VARCHAR(50) NOT NULL UNIQUE,
  "empresa_id"            VARCHAR(36) NOT NULL,
  "proforma_id"           VARCHAR(36),  -- Viene de la proforma
  "cotizacion_id"         VARCHAR(36),
  "cliente_id"            VARCHAR(36) NOT NULL,
  
  -- NCF (República Dominicana)
  "numero_ncf"            VARCHAR(50) UNIQUE,
  "tipo_ncf"              "TipoNCF",
  "vigente_hasta"         DATE,
  
  -- Fecha
  "fecha_emision"         DATE NOT NULL,
  
  -- Montos RESUMIDOS
  "valor_excento"         DECIMAL(20,2) DEFAULT 0,
  "valor_gravado"         DECIMAL(20,2) DEFAULT 0,
  "subtotal"              DECIMAL(20,2) DEFAULT 0,
  "itbis_18"              DECIMAL(20,2) DEFAULT 0,
  "total_rd"              DECIMAL(20,2) DEFAULT 0,
  
  -- Pago (ya se recibió ANTES de facturar)
  "estado_pago"           "EstadoPago" DEFAULT 'pagado',
  "metodo_pago"           "MetodoPago",
  "fecha_pago"            DATE,
  "referencia_pago"       VARCHAR(100),
  
  -- Estado
  "estado"                "EstadoDocumento" DEFAULT 'facturada',
  "enviado_dgii"          BOOLEAN DEFAULT FALSE,
  "fecha_envio_dgii"      TIMESTAMP,
  
  "creado_por"            VARCHAR(36),
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("proforma_id") REFERENCES "proformas"("id") ON DELETE SET NULL,
  FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE SET NULL,
  FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT
);

COMMENT ON TABLE "facturas" IS '4️⃣ Documento fiscal RESUMIDO emitido DESPUÉS del pago';
COMMENT ON COLUMN "facturas"."estado_pago" IS 'Por defecto "pagado" porque se emite después del pago';

CREATE INDEX "idx_facturas_numero" ON "facturas"("numero_factura");
CREATE INDEX "idx_facturas_ncf" ON "facturas"("numero_ncf");
CREATE INDEX "idx_facturas_proforma" ON "facturas"("proforma_id");
CREATE INDEX "idx_facturas_fecha" ON "facturas"("fecha_emision");

CREATE TABLE "facturas_items" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "factura_id"            VARCHAR(36) NOT NULL,
  "descripcion"           TEXT NOT NULL,  -- "TRANSPORTE DE RETROPALA", "ALQUILER DE RETROPALA"
  "cantidad"              DECIMAL(10,2) NOT NULL,
  "unidad"                VARCHAR(50),    -- "PA", "DIAS"
  "precio_unitario"       DECIMAL(20,2) NOT NULL,
  "itbis"                 DECIMAL(20,2) DEFAULT 0,
  "total"                 DECIMAL(20,2) NOT NULL,
  "orden"                 INTEGER DEFAULT 0,
  
  FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE
);

COMMENT ON TABLE "facturas_items" IS 'Items RESUMIDOS de la factura (agrupa servicios similares)';

CREATE INDEX "idx_facturas_items_factura" ON "facturas_items"("factura_id");

-- =====================================================
-- SECUENCIAS NCF
-- =====================================================

CREATE TABLE "secuencias_ncf" (
  "id"                    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "empresa_id"            VARCHAR(36) NOT NULL,
  "tipo"                  "TipoNCF" NOT NULL,
  "serie"                 VARCHAR(20) NOT NULL,
  "secuencia_actual"      INTEGER DEFAULT 1,
  "secuencia_final"       INTEGER NOT NULL,
  "fecha_expiracion"      DATE NOT NULL,
  "estado"                VARCHAR(20) DEFAULT 'activo',
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_secuencias_empresa_tipo" ON "secuencias_ncf"("empresa_id", "tipo");
