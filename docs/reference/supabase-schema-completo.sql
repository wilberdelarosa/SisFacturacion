-- =====================================================
-- SISTEMA DE FACTURACIÓN COMPLETO - SUPABASE
-- Incluye: Cotización, Conduces, Proforma, Factura
-- Base de datos: PostgreSQL (Supabase)
-- Fecha: 2 de febrero de 2026
-- =====================================================

-- =====================================================
-- EXTENSIONES
-- =====================================================

-- UUID para generación de IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgcrypto para funciones de encriptación
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TIPOS ENUM
-- =====================================================

-- Tipos de documentos del sistema
CREATE TYPE "TipoDocumento" AS ENUM (
  'cotizacion',
  'conduce',
  'proforma', 
  'factura',
  'nota_credito',
  'nota_debito'
);

-- Estados de documentos
CREATE TYPE "EstadoDocumento" AS ENUM (
  'borrador',
  'en_revision',
  'enviada',
  'aprobada',
  'rechazada',
  'aceptada',
  'en_proceso',
  'completada',
  'convertida',
  'pendiente_pago',
  'pagada',
  'vencida',
  'facturada',
  'cancelada',
  'anulada'
);

-- Tipos de cliente
CREATE TYPE "TipoCliente" AS ENUM (
  'individual',
  'empresa'
);

-- Tipos de producto/servicio
CREATE TYPE "TipoProducto" AS ENUM (
  'producto',
  'servicio',
  'alquiler',
  'transporte'
);

-- Roles de usuario
CREATE TYPE "RolUsuario" AS ENUM (
  'superadmin',
  'admin',
  'gerente',
  'vendedor',
  'operador',
  'contabilidad',
  'auditor'
);

-- Estados de pago
CREATE TYPE "EstadoPago" AS ENUM (
  'sin_pagar',
  'pago_parcial',
  'pagado',
  'reembolsado'
);

-- Métodos de pago
CREATE TYPE "MetodoPago" AS ENUM (
  'efectivo',
  'transferencia',
  'tarjeta',
  'cheque',
  'deposito',
  'otro'
);

-- Tipos NCF República Dominicana
CREATE TYPE "TipoNCF" AS ENUM (
  'B01', 'B02', 'B03', 'B04', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16',
  'E31', 'E32', 'E33', 'E34', 'E41', 'E43', 'E44', 'E45', 'E46', 'E47'
);

-- Estados de aprobación
CREATE TYPE "EstadoAprobacion" AS ENUM (
  'pendiente',
  'aprobada',
  'rechazada',
  'cancelada'
);

-- Tipos de condición de pago
CREATE TYPE "TipoPago" AS ENUM (
  'contado',
  'credito'
);

-- =====================================================
-- TABLAS BASE
-- =====================================================

-- -----------------------------------------------------
-- Tabla: empresas
-- -----------------------------------------------------
CREATE TABLE "empresas" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "nombre"                VARCHAR(255) NOT NULL,
  "nombre_comercial"      VARCHAR(255),
  "rnc"                   VARCHAR(50) NOT NULL UNIQUE,
  "direccion"             TEXT NOT NULL,
  "telefono"              VARCHAR(50) NOT NULL,
  "correo"                VARCHAR(255) NOT NULL,
  "sitio_web"             VARCHAR(255),
  "logo"                  TEXT,
  "moneda_base"           VARCHAR(3) DEFAULT 'DOP',
  "configuracion"         JSONB,
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "empresas" IS 'Empresas del sistema (multi-tenant)';
COMMENT ON COLUMN "empresas"."configuracion" IS 'Configuraciones: formato_fecha, prefijos, plantillas, etc.';

CREATE INDEX "idx_empresas_rnc" ON "empresas"("rnc");
CREATE INDEX "idx_empresas_estado" ON "empresas"("estado");

-- -----------------------------------------------------
-- Tabla: sucursales
-- -----------------------------------------------------
CREATE TABLE "sucursales" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "codigo"                VARCHAR(20) NOT NULL,
  "nombre"                VARCHAR(255) NOT NULL,
  "direccion"             TEXT NOT NULL,
  "telefono"              VARCHAR(50),
  "correo"                VARCHAR(255),
  "es_principal"          BOOLEAN DEFAULT FALSE,
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  UNIQUE ("empresa_id", "codigo")
);

COMMENT ON TABLE "sucursales" IS 'Sucursales/oficinas de las empresas';

CREATE INDEX "idx_sucursales_empresa" ON "sucursales"("empresa_id");

-- -----------------------------------------------------
-- Tabla: usuarios
-- -----------------------------------------------------
CREATE TABLE "usuarios" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "sucursal_id"           UUID,
  "auth_user_id"          UUID,  -- ID de Supabase Auth (si se usa)
  "nombre"                VARCHAR(255) NOT NULL,
  "correo"                VARCHAR(255) NOT NULL,
  "password_hash"         VARCHAR(255),
  "rol"                   "RolUsuario" DEFAULT 'operador',
  "telefono"              VARCHAR(50),
  "avatar"                TEXT,
  "permisos_adicionales"  JSONB,
  "configuracion"         JSONB,
  
  -- Seguridad
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "intentos_fallidos"     INTEGER DEFAULT 0,
  "bloqueado_hasta"       TIMESTAMP,
  "debe_cambiar_password" BOOLEAN DEFAULT FALSE,
  "ultimo_acceso"         TIMESTAMP,
  "ultima_ip"             VARCHAR(50),
  
  -- Auditoría
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL,
  UNIQUE ("correo")
);

COMMENT ON TABLE "usuarios" IS 'Usuarios del sistema con control de acceso';
COMMENT ON COLUMN "usuarios"."auth_user_id" IS 'Referencia a auth.users de Supabase';

CREATE INDEX "idx_usuarios_correo" ON "usuarios"("correo");
CREATE INDEX "idx_usuarios_empresa" ON "usuarios"("empresa_id");
CREATE INDEX "idx_usuarios_rol" ON "usuarios"("rol");
CREATE INDEX "idx_usuarios_sucursal" ON "usuarios"("sucursal_id");

-- -----------------------------------------------------
-- Tabla: sesiones
-- -----------------------------------------------------
CREATE TABLE "sesiones" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "usuario_id"            UUID NOT NULL,
  "token"                 VARCHAR(500) NOT NULL,
  "refresh_token"         VARCHAR(500),
  "ip_address"            VARCHAR(50),
  "user_agent"            TEXT,
  "activa"                BOOLEAN DEFAULT TRUE,
  "expira_en"             TIMESTAMP NOT NULL,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_cierre"          TIMESTAMP,
  
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

COMMENT ON TABLE "sesiones" IS 'Sesiones activas de usuarios (recordar sesión)';

CREATE INDEX "idx_sesiones_usuario" ON "sesiones"("usuario_id");
CREATE INDEX "idx_sesiones_token" ON "sesiones"("token");
CREATE INDEX "idx_sesiones_activa" ON "sesiones"("activa");

-- -----------------------------------------------------
-- Tabla: permisos
-- -----------------------------------------------------
CREATE TABLE "permisos" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "clave"                 VARCHAR(100) NOT NULL UNIQUE,
  "modulo"                VARCHAR(50) NOT NULL,
  "accion"                VARCHAR(50) NOT NULL,
  "descripcion"           TEXT,
  "activo"                BOOLEAN DEFAULT TRUE,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "permisos" IS 'Catálogo de permisos del sistema';
COMMENT ON COLUMN "permisos"."clave" IS 'Formato: modulo.accion (ej: cotizaciones.crear)';

CREATE INDEX "idx_permisos_modulo" ON "permisos"("modulo");
CREATE INDEX "idx_permisos_activo" ON "permisos"("activo");

-- -----------------------------------------------------
-- Tabla: roles_permisos
-- -----------------------------------------------------
CREATE TABLE "roles_permisos" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "rol"                   "RolUsuario" NOT NULL,
  "permiso_id"            UUID NOT NULL,
  "fecha_asignacion"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE,
  UNIQUE ("rol", "permiso_id")
);

COMMENT ON TABLE "roles_permisos" IS 'Permisos asignados a cada rol';

CREATE INDEX "idx_roles_permisos_rol" ON "roles_permisos"("rol");

-- -----------------------------------------------------
-- Tabla: usuarios_permisos
-- -----------------------------------------------------
CREATE TABLE "usuarios_permisos" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "usuario_id"            UUID NOT NULL,
  "permiso_id"            UUID NOT NULL,
  "tipo"                  VARCHAR(20) NOT NULL, -- 'permitir' o 'denegar'
  "fecha_asignacion"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE,
  FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE,
  UNIQUE ("usuario_id", "permiso_id"),
  CHECK ("tipo" IN ('permitir', 'denegar'))
);

COMMENT ON TABLE "usuarios_permisos" IS 'Permisos específicos de usuario (sobreescriben rol)';

CREATE INDEX "idx_usuarios_permisos_usuario" ON "usuarios_permisos"("usuario_id");

-- =====================================================
-- MAESTROS
-- =====================================================

-- -----------------------------------------------------
-- Tabla: clientes
-- -----------------------------------------------------
CREATE TABLE "clientes" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "codigo"                VARCHAR(50),
  "nombre"                VARCHAR(255) NOT NULL,
  "nombre_comercial"      VARCHAR(255),
  "rnc_o_cedula"          VARCHAR(50),
  "tipo"                  "TipoCliente" NOT NULL,
  "direccion"             TEXT,
  "telefono"              VARCHAR(50),
  "correo"                VARCHAR(255),
  "contacto"              VARCHAR(255),
  "cargo_contacto"        VARCHAR(100),
  
  -- Condiciones comerciales
  "tipo_pago"             "TipoPago" DEFAULT 'contado',
  "limite_credito"        DECIMAL(20,2),
  "dias_credito"          INTEGER DEFAULT 0,
  "descuento_general"     DECIMAL(5,2) DEFAULT 0,
  
  -- Segmentación
  "segmento"              VARCHAR(100),
  "industria"             VARCHAR(100),
  "etiquetas"             TEXT[],
  
  -- Estado
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "notas"                 TEXT,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  UNIQUE ("empresa_id", "codigo")
);

COMMENT ON TABLE "clientes" IS 'Clientes de las empresas';

CREATE INDEX "idx_clientes_empresa" ON "clientes"("empresa_id");
CREATE INDEX "idx_clientes_rnc" ON "clientes"("rnc_o_cedula");
CREATE INDEX "idx_clientes_correo" ON "clientes"("correo");
CREATE INDEX "idx_clientes_estado" ON "clientes"("estado");

-- -----------------------------------------------------
-- Tabla: productos_servicios
-- -----------------------------------------------------
CREATE TABLE "productos_servicios" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "codigo"                VARCHAR(100),
  "nombre"                VARCHAR(255) NOT NULL,
  "descripcion"           TEXT,
  "tipo"                  "TipoProducto" NOT NULL,
  "unidad"                VARCHAR(50),
  "precio_unitario"       DECIMAL(20,2) NOT NULL,
  "costo"                 DECIMAL(20,2),
  "tasa_impuesto"         DECIMAL(5,2) DEFAULT 18.00,
  "categoria"             VARCHAR(100),
  "marca"                 VARCHAR(100),
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  UNIQUE ("empresa_id", "codigo")
);

COMMENT ON TABLE "productos_servicios" IS 'Catálogo de productos y servicios';

CREATE INDEX "idx_productos_empresa" ON "productos_servicios"("empresa_id");
CREATE INDEX "idx_productos_codigo" ON "productos_servicios"("codigo");
CREATE INDEX "idx_productos_tipo" ON "productos_servicios"("tipo");
CREATE INDEX "idx_productos_estado" ON "productos_servicios"("estado");

-- -----------------------------------------------------
-- Tabla: equipos
-- -----------------------------------------------------
CREATE TABLE "equipos" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "codigo"                VARCHAR(50),
  "nombre"                VARCHAR(255) NOT NULL,
  "placa"                 VARCHAR(50),
  "tipo"                  VARCHAR(100),
  "marca"                 VARCHAR(100),
  "modelo"                VARCHAR(100),
  "año"                   INTEGER,
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  UNIQUE ("empresa_id", "codigo")
);

COMMENT ON TABLE "equipos" IS 'Equipos y vehículos de la empresa';

CREATE INDEX "idx_equipos_empresa" ON "equipos"("empresa_id");
CREATE INDEX "idx_equipos_placa" ON "equipos"("placa");

-- -----------------------------------------------------
-- Tabla: impuestos
-- -----------------------------------------------------
CREATE TABLE "impuestos" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "nombre"                VARCHAR(100) NOT NULL,
  "tasa"                  DECIMAL(5,2) NOT NULL,
  "tipo"                  VARCHAR(50),
  "descripcion"           TEXT,
  "activo"                BOOLEAN DEFAULT TRUE,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
);

COMMENT ON TABLE "impuestos" IS 'Impuestos configurables por empresa';

CREATE INDEX "idx_impuestos_empresa" ON "impuestos"("empresa_id");

-- -----------------------------------------------------
-- Tabla: numeraciones_documentos
-- -----------------------------------------------------
CREATE TABLE "numeraciones_documentos" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "sucursal_id"           UUID,
  "tipo_documento"        "TipoDocumento" NOT NULL,
  "prefijo"               VARCHAR(20),
  "siguiente_numero"      INTEGER DEFAULT 1,
  "formato"               VARCHAR(100),
  "activo"                BOOLEAN DEFAULT TRUE,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE CASCADE
);

COMMENT ON TABLE "numeraciones_documentos" IS 'Numeración automática de documentos';
COMMENT ON COLUMN "numeraciones_documentos"."formato" IS 'Ej: {PREFIJO}-{YYYY}{MM}{DD}-{NNNN}';

CREATE INDEX "idx_numeraciones_empresa" ON "numeraciones_documentos"("empresa_id");
CREATE INDEX "idx_numeraciones_tipo" ON "numeraciones_documentos"("tipo_documento");

-- -----------------------------------------------------
-- Tabla: secuencias_ncf
-- -----------------------------------------------------
CREATE TABLE "secuencias_ncf" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "tipo"                  "TipoNCF" NOT NULL,
  "serie"                 VARCHAR(20) NOT NULL,
  "secuencia_actual"      INTEGER DEFAULT 1,
  "secuencia_inicial"     INTEGER DEFAULT 1,
  "secuencia_final"       INTEGER NOT NULL,
  "fecha_expiracion"      DATE NOT NULL,
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
);

COMMENT ON TABLE "secuencias_ncf" IS 'Secuencias NCF República Dominicana';

CREATE INDEX "idx_secuencias_empresa_tipo" ON "secuencias_ncf"("empresa_id", "tipo");

-- =====================================================
-- MÓDULO DOCUMENTOS
-- =====================================================

-- -----------------------------------------------------
-- Tabla: cotizaciones
-- -----------------------------------------------------
CREATE TABLE "cotizaciones" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "numero_cotizacion"     VARCHAR(50) NOT NULL,
  "empresa_id"            UUID NOT NULL,
  "sucursal_id"           UUID,
  "cliente_id"            UUID NOT NULL,
  "usuario_id"            UUID,
  "moneda"                VARCHAR(3) DEFAULT 'DOP',
  "tasa_cambio"           DECIMAL(20,6) DEFAULT 1,
  
  -- Información
  "titulo"                VARCHAR(255),
  "lugar"                 VARCHAR(255),
  "fecha_emision"         DATE NOT NULL,
  "valido_hasta"          DATE,
  "estado"                "EstadoDocumento" DEFAULT 'borrador',
  
  -- Montos
  "subtotal"              DECIMAL(20,2) DEFAULT 0,
  "descuento_total"       DECIMAL(20,2) DEFAULT 0,
  "monto_impuesto"        DECIMAL(20,2) DEFAULT 0,
  "total"                 DECIMAL(20,2) DEFAULT 0,
  "total_moneda_base"     DECIMAL(20,2) GENERATED ALWAYS AS (ROUND("total" * "tasa_cambio", 2)) STORED,
  
  -- Pipeline (CRM)
  "etapa"                 VARCHAR(50),
  "probabilidad"          INTEGER DEFAULT 0,
  "fecha_cierre_estimada" DATE,
  
  -- Aprobaciones
  "requiere_aprobacion"   BOOLEAN DEFAULT FALSE,
  "aprobado_por"          UUID,
  "fecha_aprobacion"      TIMESTAMP,
  "comentarios_aprobacion" TEXT,
  
  -- Conversión
  "convertida_a_proforma" BOOLEAN DEFAULT FALSE,
  "proforma_id"           UUID,
  "convertida_a_factura"  BOOLEAN DEFAULT FALSE,
  "factura_id"            UUID,
  
  -- Adicional
  "notas"                 TEXT,
  "terminos_condiciones"  TEXT,
  "pago_al_contado"       BOOLEAN DEFAULT FALSE,
  "firma"                 TEXT,
  "url_pdf"               TEXT,
  
  -- Auditoría
  "creado_por"            UUID,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL,
  FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL,
  FOREIGN KEY ("aprobado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL,
  UNIQUE ("empresa_id", "numero_cotizacion")
);

COMMENT ON TABLE "cotizaciones" IS 'Cotizaciones y presupuestos';

CREATE INDEX "idx_cotizaciones_numero" ON "cotizaciones"("numero_cotizacion");
CREATE INDEX "idx_cotizaciones_empresa" ON "cotizaciones"("empresa_id");
CREATE INDEX "idx_cotizaciones_cliente" ON "cotizaciones"("cliente_id");
CREATE INDEX "idx_cotizaciones_usuario" ON "cotizaciones"("usuario_id");
CREATE INDEX "idx_cotizaciones_estado" ON "cotizaciones"("estado");
CREATE INDEX "idx_cotizaciones_fecha" ON "cotizaciones"("fecha_emision");

-- -----------------------------------------------------
-- Tabla: cotizaciones_items
-- -----------------------------------------------------
CREATE TABLE "cotizaciones_items" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cotizacion_id"         UUID NOT NULL,
  "producto_servicio_id"  UUID,
  "descripcion"           TEXT NOT NULL,
  "cantidad"              DECIMAL(10,2) NOT NULL,
  "unidad"                VARCHAR(50),
  "precio_unitario"       DECIMAL(20,2) NOT NULL,
  "descuento"             DECIMAL(20,2) DEFAULT 0,
  "tasa_impuesto"         DECIMAL(5,2) DEFAULT 0,
  "monto_impuesto"        DECIMAL(20,2) DEFAULT 0,
  "subtotal"              DECIMAL(20,2) NOT NULL,
  "total"                 DECIMAL(20,2) NOT NULL,
  "notas"                 TEXT,
  "orden"                 INTEGER DEFAULT 0,
  
  FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE CASCADE,
  FOREIGN KEY ("producto_servicio_id") REFERENCES "productos_servicios"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "cotizaciones_items" IS 'Líneas de items de cotizaciones';

CREATE INDEX "idx_cotizaciones_items_cotizacion" ON "cotizaciones_items"("cotizacion_id");
CREATE INDEX "idx_cotizaciones_items_producto" ON "cotizaciones_items"("producto_servicio_id");

-- -----------------------------------------------------
-- Tabla: conduces
-- -----------------------------------------------------
CREATE TABLE "conduces" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "numero_conduce"        VARCHAR(50) NOT NULL,
  "empresa_id"            UUID NOT NULL,
  "sucursal_id"           UUID,
  "cotizacion_id"         UUID,
  "cliente_id"            UUID,
  
  -- Detalles
  "equipo_id"             UUID,
  "equipo_nombre"         VARCHAR(255),
  "placa"                 VARCHAR(50),
  "conductor"             VARCHAR(255),
  "hora_salida"           TIME,
  "hora_llegada"          TIME,
  "hora_manana"           VARCHAR(20),
  "hora_tarde"            VARCHAR(20),
  
  -- Fecha y lugar
  "fecha"                 DATE NOT NULL,
  "lugar_origen"          VARCHAR(255),
  "lugar_destino"         VARCHAR(255),
  
  -- Materiales/Servicios (específico construcción)
  "grava_arena"           DECIMAL(10,2),
  "grava"                 DECIMAL(10,2),
  "arena"                 DECIMAL(10,2),
  "caliche"               DECIMAL(10,2),
  "bote_escombros"        DECIMAL(10,2),
  "otros"                 TEXT,
  
  -- Montos
  "subtotal"              DECIMAL(20,2),
  "monto_impuesto"        DECIMAL(20,2),
  "total"                 DECIMAL(20,2),
  
  -- Firmas
  "entregado_por"         VARCHAR(255),
  "recibido_por"          VARCHAR(255),
  "firma_entrega"         TEXT,
  "firma_recibido"        TEXT,
  
  -- Estado
  "estado"                VARCHAR(20) DEFAULT 'activo',
  "incluido_en_proforma"  BOOLEAN DEFAULT FALSE,
  "proforma_id"           UUID,
  "url_pdf"               TEXT,
  
  -- Auditoría
  "creado_por"            UUID,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL,
  FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE SET NULL,
  FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL,
  FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE SET NULL,
  UNIQUE ("empresa_id", "numero_conduce")
);

COMMENT ON TABLE "conduces" IS 'Documentos de entrega/trabajo (constancia física)';

CREATE INDEX "idx_conduces_numero" ON "conduces"("numero_conduce");
CREATE INDEX "idx_conduces_empresa" ON "conduces"("empresa_id");
CREATE INDEX "idx_conduces_cotizacion" ON "conduces"("cotizacion_id");
CREATE INDEX "idx_conduces_fecha" ON "conduces"("fecha");
CREATE INDEX "idx_conduces_proforma" ON "conduces"("proforma_id");
CREATE INDEX "idx_conduces_incluido" ON "conduces"("incluido_en_proforma");

-- -----------------------------------------------------
-- Tabla: proformas
-- -----------------------------------------------------
CREATE TABLE "proformas" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "numero_proforma"       VARCHAR(50) NOT NULL,
  "empresa_id"            UUID NOT NULL,
  "sucursal_id"           UUID,
  "cotizacion_id"         UUID,
  "cliente_id"            UUID NOT NULL,
  "moneda"                VARCHAR(3) DEFAULT 'DOP',
  "tasa_cambio"           DECIMAL(20,6) DEFAULT 1,
  
  -- Periodo (si aplica)
  "fecha_emision"         DATE NOT NULL,
  "fecha_inicio"          DATE,
  "fecha_fin"             DATE,
  "valido_hasta"          DATE,
  "estado"                "EstadoDocumento" DEFAULT 'en_proceso',
  
  -- Montos
  "subtotal"              DECIMAL(20,2) DEFAULT 0,
  "descuento_total"       DECIMAL(20,2) DEFAULT 0,
  "total_exc"             DECIMAL(20,2) DEFAULT 0,
  "total_grav"            DECIMAL(20,2) DEFAULT 0,
  "total_general"         DECIMAL(20,2) DEFAULT 0,
  "monto_impuesto"        DECIMAL(20,2) DEFAULT 0,
  "itbis_18"              DECIMAL(20,2) DEFAULT 0,
  "total"                 DECIMAL(20,2) DEFAULT 0,
  "total_rd"              DECIMAL(20,2) DEFAULT 0,
  "total_moneda_base"     DECIMAL(20,2) GENERATED ALWAYS AS (ROUND("total" * "tasa_cambio", 2)) STORED,
  
  -- Comparación (si viene de cotización)
  "cotizacion_total"      DECIMAL(20,2),
  "variacion_monto"       DECIMAL(20,2),
  "variacion_porcentaje"  DECIMAL(5,2),
  
  -- Conversión
  "convertida_a_factura"  BOOLEAN DEFAULT FALSE,
  "factura_id"            UUID,
  
  -- Adicional
  "observaciones"         TEXT,
  "cantidad_conduces"     INTEGER DEFAULT 0,
  "notas"                 TEXT,
  "terminos_condiciones"  TEXT,
  "url_pdf"               TEXT,
  
  -- Auditoría
  "creado_por"            UUID,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL,
  FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE SET NULL,
  FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT,
  UNIQUE ("empresa_id", "numero_proforma")
);

COMMENT ON TABLE "proformas" IS 'Proformas (puede ser reporte o documento previo)';

CREATE INDEX "idx_proformas_numero" ON "proformas"("numero_proforma");
CREATE INDEX "idx_proformas_empresa" ON "proformas"("empresa_id");
CREATE INDEX "idx_proformas_cotizacion" ON "proformas"("cotizacion_id");
CREATE INDEX "idx_proformas_cliente" ON "proformas"("cliente_id");
CREATE INDEX "idx_proformas_estado" ON "proformas"("estado");

-- -----------------------------------------------------
-- Tabla: proformas_items
-- -----------------------------------------------------
CREATE TABLE "proformas_items" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "proforma_id"           UUID NOT NULL,
  "conduce_id"            UUID,
  "producto_servicio_id"  UUID,
  "numero_conduce"        VARCHAR(50),
  "fecha"                 DATE,
  "equipo"                VARCHAR(255),
  "descripcion"           TEXT NOT NULL,
  "cantidad"              DECIMAL(10,2) NOT NULL,
  "unidad"                VARCHAR(50),
  "precio_unitario"       DECIMAL(20,2) NOT NULL,
  "descuento"             DECIMAL(20,2) DEFAULT 0,
  "tasa_impuesto"         DECIMAL(5,2) DEFAULT 0,
  "monto_impuesto"        DECIMAL(20,2) DEFAULT 0,
  "subtotal"              DECIMAL(20,2) NOT NULL,
  "total"                 DECIMAL(20,2) NOT NULL,
  "orden"                 INTEGER DEFAULT 0,
  
  FOREIGN KEY ("proforma_id") REFERENCES "proformas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("conduce_id") REFERENCES "conduces"("id") ON DELETE SET NULL,
  FOREIGN KEY ("producto_servicio_id") REFERENCES "productos_servicios"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "proformas_items" IS 'Líneas de proforma';

CREATE INDEX "idx_proformas_items_proforma" ON "proformas_items"("proforma_id");
CREATE INDEX "idx_proformas_items_conduce" ON "proformas_items"("conduce_id");

-- -----------------------------------------------------
-- Tabla: facturas
-- -----------------------------------------------------
CREATE TABLE "facturas" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "numero_factura"        VARCHAR(50) NOT NULL,
  "empresa_id"            UUID NOT NULL,
  "sucursal_id"           UUID,
  "proforma_id"           UUID,
  "cotizacion_id"         UUID,
  "cliente_id"            UUID NOT NULL,
  "moneda"                VARCHAR(3) DEFAULT 'DOP',
  "tasa_cambio"           DECIMAL(20,6) DEFAULT 1,
  
  -- NCF
  "numero_ncf"            VARCHAR(50),
  "tipo_ncf"              "TipoNCF",
  "vigente_hasta"         DATE,
  
  -- Fechas
  "fecha_emision"         DATE NOT NULL,
  "fecha_vencimiento"     DATE,
  
  -- Montos
  "subtotal"              DECIMAL(20,2) DEFAULT 0,
  "descuento_total"       DECIMAL(20,2) DEFAULT 0,
  "valor_excento"         DECIMAL(20,2) DEFAULT 0,
  "valor_gravado"         DECIMAL(20,2) DEFAULT 0,
  "monto_impuesto"        DECIMAL(20,2) DEFAULT 0,
  "itbis_18"              DECIMAL(20,2) DEFAULT 0,
  "total"                 DECIMAL(20,2) DEFAULT 0,
  "total_rd"              DECIMAL(20,2) DEFAULT 0,
  "total_moneda_base"     DECIMAL(20,2) GENERATED ALWAYS AS (ROUND("total" * "tasa_cambio", 2)) STORED,
  
  -- Pagos
  "estado_pago"           "EstadoPago" DEFAULT 'sin_pagar',
  "monto_pagado"          DECIMAL(20,2) DEFAULT 0,
  "saldo_pendiente"       DECIMAL(20,2) DEFAULT 0,
  
  -- Estado
  "estado"                "EstadoDocumento" DEFAULT 'pendiente_pago',
  "enviado_dgii"          BOOLEAN DEFAULT FALSE,
  "fecha_envio_dgii"      TIMESTAMP,
  
  -- Adicional
  "notas"                 TEXT,
  "terminos_condiciones"  TEXT,
  "url_pdf"               TEXT,
  
  -- Auditoría
  "creado_por"            UUID,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "anulado_por"           UUID,
  "fecha_anulacion"       TIMESTAMP,
  "razon_anulacion"       TEXT,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL,
  FOREIGN KEY ("proforma_id") REFERENCES "proformas"("id") ON DELETE SET NULL,
  FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE SET NULL,
  FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT,
  UNIQUE ("empresa_id", "numero_factura"),
  UNIQUE ("numero_ncf")
);

COMMENT ON TABLE "facturas" IS 'Facturas del sistema';

CREATE INDEX "idx_facturas_numero" ON "facturas"("numero_factura");
CREATE INDEX "idx_facturas_empresa" ON "facturas"("empresa_id");
CREATE INDEX "idx_facturas_cliente" ON "facturas"("cliente_id");
CREATE INDEX "idx_facturas_ncf" ON "facturas"("numero_ncf");
CREATE INDEX "idx_facturas_estado" ON "facturas"("estado");
CREATE INDEX "idx_facturas_estado_pago" ON "facturas"("estado_pago");
CREATE INDEX "idx_facturas_fecha" ON "facturas"("fecha_emision");

-- -----------------------------------------------------
-- Tabla: facturas_items
-- -----------------------------------------------------
CREATE TABLE "facturas_items" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "factura_id"            UUID NOT NULL,
  "producto_servicio_id"  UUID,
  "descripcion"           TEXT NOT NULL,
  "cantidad"              DECIMAL(10,2) NOT NULL,
  "unidad"                VARCHAR(50),
  "precio_unitario"       DECIMAL(20,2) NOT NULL,
  "descuento"             DECIMAL(20,2) DEFAULT 0,
  "tasa_impuesto"         DECIMAL(5,2) DEFAULT 0,
  "monto_impuesto"        DECIMAL(20,2) DEFAULT 0,
  "itbis"                 DECIMAL(20,2) DEFAULT 0,
  "subtotal"              DECIMAL(20,2) NOT NULL,
  "total"                 DECIMAL(20,2) NOT NULL,
  "orden"                 INTEGER DEFAULT 0,
  
  FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("producto_servicio_id") REFERENCES "productos_servicios"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "facturas_items" IS 'Líneas de factura';

CREATE INDEX "idx_facturas_items_factura" ON "facturas_items"("factura_id");

-- -----------------------------------------------------
-- Tabla: pagos
-- -----------------------------------------------------
CREATE TABLE "pagos" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "factura_id"            UUID NOT NULL,
  "empresa_id"            UUID NOT NULL,
  "numero_pago"           VARCHAR(50),
  "fecha_pago"            DATE NOT NULL,
  "monto"                 DECIMAL(20,2) NOT NULL,
  "moneda"                VARCHAR(3) DEFAULT 'DOP',
  "tasa_cambio"           DECIMAL(20,6) DEFAULT 1,
  "monto_moneda_base"     DECIMAL(20,2) GENERATED ALWAYS AS (ROUND("monto" * "tasa_cambio", 2)) STORED,
  "metodo"                "MetodoPago" NOT NULL,
  "referencia"            VARCHAR(100),
  "banco"                 VARCHAR(100),
  "cuenta"                VARCHAR(100),
  "comprobante_url"       TEXT,
  "notas"                 TEXT,
  "estado"                VARCHAR(20) DEFAULT 'aplicado',
  "registrado_por"        UUID,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "pagos" IS 'Pagos recibidos por facturas';

CREATE INDEX "idx_pagos_factura" ON "pagos"("factura_id");
CREATE INDEX "idx_pagos_empresa" ON "pagos"("empresa_id");
CREATE INDEX "idx_pagos_fecha" ON "pagos"("fecha_pago");

-- =====================================================
-- APROBACIONES
-- =====================================================

-- -----------------------------------------------------
-- Tabla: reglas_aprobacion
-- -----------------------------------------------------
CREATE TABLE "reglas_aprobacion" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "nombre"                VARCHAR(255) NOT NULL,
  "tipo_documento"        "TipoDocumento" NOT NULL,
  "condicion"             VARCHAR(50) NOT NULL,
  "valor_minimo"          DECIMAL(20,2),
  "descuento_maximo"      DECIMAL(5,2),
  "rol_aprobador"         "RolUsuario",
  "usuario_aprobador_id"  UUID,
  "activa"                BOOLEAN DEFAULT TRUE,
  "fecha_creacion"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("usuario_aprobador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "reglas_aprobacion" IS 'Reglas de aprobación de documentos';

CREATE INDEX "idx_reglas_empresa" ON "reglas_aprobacion"("empresa_id");

-- -----------------------------------------------------
-- Tabla: aprobaciones
-- -----------------------------------------------------
CREATE TABLE "aprobaciones" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "documento_tipo"        "TipoDocumento" NOT NULL,
  "documento_id"          UUID NOT NULL,
  "regla_id"              UUID,
  "usuario_solicita"      UUID,
  "usuario_aprueba"       UUID,
  "estado"                "EstadoAprobacion" DEFAULT 'pendiente',
  "comentario"            TEXT,
  "fecha_solicitud"       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_respuesta"       TIMESTAMP,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("regla_id") REFERENCES "reglas_aprobacion"("id") ON DELETE SET NULL,
  FOREIGN KEY ("usuario_solicita") REFERENCES "usuarios"("id") ON DELETE SET NULL,
  FOREIGN KEY ("usuario_aprueba") REFERENCES "usuarios"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "aprobaciones" IS 'Registro de aprobaciones de documentos';

CREATE INDEX "idx_aprobaciones_empresa" ON "aprobaciones"("empresa_id");
CREATE INDEX "idx_aprobaciones_documento" ON "aprobaciones"("documento_tipo", "documento_id");
CREATE INDEX "idx_aprobaciones_estado" ON "aprobaciones"("estado");

-- =====================================================
-- AUDITORÍA Y TRAZABILIDAD
-- =====================================================

-- -----------------------------------------------------
-- Tabla: audit_log
-- -----------------------------------------------------
CREATE TABLE "audit_log" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID,
  "usuario_id"            UUID,
  "accion"                VARCHAR(50) NOT NULL,
  "modulo"                VARCHAR(50) NOT NULL,
  "entidad_tipo"          VARCHAR(50),
  "entidad_id"            UUID,
  "datos_anteriores"      JSONB,
  "datos_nuevos"          JSONB,
  "ip_address"            VARCHAR(50),
  "user_agent"            TEXT,
  "fecha"                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "audit_log" IS 'Auditoría completa del sistema';

CREATE INDEX "idx_audit_empresa" ON "audit_log"("empresa_id");
CREATE INDEX "idx_audit_usuario" ON "audit_log"("usuario_id");
CREATE INDEX "idx_audit_fecha" ON "audit_log"("fecha");
CREATE INDEX "idx_audit_modulo" ON "audit_log"("modulo");
CREATE INDEX "idx_audit_entidad" ON "audit_log"("entidad_tipo", "entidad_id");

-- -----------------------------------------------------
-- Tabla: actividades
-- -----------------------------------------------------
CREATE TABLE "actividades" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "tipo"                  VARCHAR(50) NOT NULL,
  "descripcion"           TEXT NOT NULL,
  "entidad_tipo"          VARCHAR(50),
  "entidad_id"            UUID,
  "usuario_id"            UUID,
  "fecha"                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "metadata"              JSONB,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "actividades" IS 'Actividades y eventos del sistema';

CREATE INDEX "idx_actividades_empresa" ON "actividades"("empresa_id");
CREATE INDEX "idx_actividades_entidad" ON "actividades"("entidad_tipo", "entidad_id");
CREATE INDEX "idx_actividades_fecha" ON "actividades"("fecha");

-- -----------------------------------------------------
-- Tabla: envios_documentos
-- -----------------------------------------------------
CREATE TABLE "envios_documentos" (
  "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "empresa_id"            UUID NOT NULL,
  "documento_tipo"        "TipoDocumento" NOT NULL,
  "documento_id"          UUID NOT NULL,
  "destinatario"          VARCHAR(255) NOT NULL,
  "metodo"                VARCHAR(50) NOT NULL,
  "asunto"                VARCHAR(255),
  "mensaje"               TEXT,
  "adjuntos"              TEXT[],
  "estado"                VARCHAR(50) DEFAULT 'pendiente',
  "error"                 TEXT,
  "fecha_envio"           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "fecha_entrega"         TIMESTAMP,
  "enviado_por"           UUID,
  
  FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
  FOREIGN KEY ("enviado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "envios_documentos" IS 'Historial de envíos de documentos';

CREATE INDEX "idx_envios_empresa" ON "envios_documentos"("empresa_id");
CREATE INDEX "idx_envios_documento" ON "envios_documentos"("documento_tipo", "documento_id");

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Función: Actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas relevantes
CREATE TRIGGER trg_empresas_updated BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON productos_servicios
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_cotizaciones_updated BEFORE UPDATE ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_proformas_updated BEFORE UPDATE ON proformas
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_facturas_updated BEFORE UPDATE ON facturas
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Función: Registrar auditoría automática
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
DECLARE
  v_usuario_id UUID;
  v_empresa_id UUID;
BEGIN
  -- Obtener usuario del contexto (Supabase)
  BEGIN
    v_usuario_id := (SELECT id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1);
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id := NULL;
  END;
  
  -- Obtener empresa_id del registro
  v_empresa_id := COALESCE(NEW.empresa_id, OLD.empresa_id);
  
  INSERT INTO audit_log (
    empresa_id,
    usuario_id,
    accion,
    modulo,
    entidad_tipo,
    entidad_id,
    datos_anteriores,
    datos_nuevos
  ) VALUES (
    v_empresa_id,
    v_usuario_id,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a tablas críticas (opcional, puede generar mucho volumen)
CREATE TRIGGER trg_audit_cotizaciones AFTER INSERT OR UPDATE OR DELETE ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
CREATE TRIGGER trg_audit_proformas AFTER INSERT OR UPDATE OR DELETE ON proformas
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
CREATE TRIGGER trg_audit_facturas AFTER INSERT OR UPDATE OR DELETE ON facturas
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
CREATE TRIGGER trg_audit_pagos AFTER INSERT OR UPDATE OR DELETE ON pagos
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
CREATE TRIGGER trg_audit_clientes AFTER INSERT OR UPDATE OR DELETE ON clientes
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
CREATE TRIGGER trg_audit_productos AFTER INSERT OR UPDATE OR DELETE ON productos_servicios
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

-- Función: Marcar conduce en proforma
CREATE OR REPLACE FUNCTION marcar_conduce_en_proforma()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conduce_id IS NOT NULL THEN
    UPDATE conduces
    SET incluido_en_proforma = TRUE,
        proforma_id = NEW.proforma_id
    WHERE id = NEW.conduce_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marcar_conduce AFTER INSERT ON proformas_items
  FOR EACH ROW EXECUTE FUNCTION marcar_conduce_en_proforma();

-- Función: Actualizar estado pago factura
CREATE OR REPLACE FUNCTION actualizar_estado_pago_factura()
RETURNS TRIGGER AS $$
DECLARE
  v_total_pagado DECIMAL(20,2);
  v_total_factura DECIMAL(20,2);
  v_nuevo_estado "EstadoPago";
BEGIN
  -- Calcular total pagado
  SELECT COALESCE(SUM(monto), 0) INTO v_total_pagado
  FROM pagos
  WHERE factura_id = COALESCE(NEW.factura_id, OLD.factura_id)
    AND estado = 'aplicado';
  
  -- Obtener total factura
  SELECT total INTO v_total_factura
  FROM facturas
  WHERE id = COALESCE(NEW.factura_id, OLD.factura_id);
  
  -- Determinar nuevo estado
  IF v_total_pagado = 0 THEN
    v_nuevo_estado := 'sin_pagar';
  ELSIF v_total_pagado >= v_total_factura THEN
    v_nuevo_estado := 'pagado';
  ELSE
    v_nuevo_estado := 'pago_parcial';
  END IF;
  
  -- Actualizar factura
  UPDATE facturas
  SET estado_pago = v_nuevo_estado,
      monto_pagado = v_total_pagado,
      saldo_pendiente = v_total_factura - v_total_pagado
  WHERE id = COALESCE(NEW.factura_id, OLD.factura_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_pago_factura AFTER INSERT OR UPDATE OR DELETE ON pagos
  FOR EACH ROW EXECUTE FUNCTION actualizar_estado_pago_factura();

-- =====================================================
-- VISTAS BI Y REPORTES
-- =====================================================

-- Vista: Flujo completo documentos
CREATE VIEW v_flujo_documentos AS
SELECT 
  cot.empresa_id,
  cot.id as cotizacion_id,
  cot.numero_cotizacion,
  cot.estado as estado_cotizacion,
  cot.total as monto_cotizado,
  cli.nombre as cliente,
  u.nombre as vendedor,
  
  COUNT(DISTINCT con.id) as total_conduces,
  
  pro.id as proforma_id,
  pro.numero_proforma,
  pro.estado as estado_proforma,
  pro.total_general as monto_proforma,
  pro.variacion_monto,
  
  fac.id as factura_id,
  fac.numero_factura,
  fac.numero_ncf,
  fac.total as monto_factura,
  fac.estado_pago
  
FROM cotizaciones cot
LEFT JOIN clientes cli ON cot.cliente_id = cli.id
LEFT JOIN usuarios u ON cot.usuario_id = u.id
LEFT JOIN conduces con ON con.cotizacion_id = cot.id
LEFT JOIN proformas pro ON pro.cotizacion_id = cot.id
LEFT JOIN facturas fac ON fac.proforma_id = pro.id OR fac.cotizacion_id = cot.id
GROUP BY cot.id, cli.nombre, u.nombre, pro.id, fac.id;

-- Vista: Ventas por período
CREATE VIEW v_ventas_periodo AS
SELECT 
  f.empresa_id,
  DATE_TRUNC('month', f.fecha_emision) as periodo,
  DATE_TRUNC('year', f.fecha_emision) as año,
  TO_CHAR(f.fecha_emision, 'YYYY-MM') as mes,
  COUNT(*) as cantidad_facturas,
  SUM(f.subtotal) as subtotal,
  SUM(f.monto_impuesto) as impuestos,
  SUM(f.total) as total_ventas,
  SUM(f.monto_pagado) as total_cobrado,
  SUM(f.saldo_pendiente) as saldo_pendiente,
  ROUND(AVG(f.total), 2) as ticket_promedio
FROM facturas f
WHERE f.estado != 'anulada'
GROUP BY f.empresa_id, DATE_TRUNC('month', f.fecha_emision), 
         DATE_TRUNC('year', f.fecha_emision), TO_CHAR(f.fecha_emision, 'YYYY-MM');

-- Vista: Conversión de cotizaciones
CREATE VIEW v_conversion_cotizaciones AS
SELECT 
  c.empresa_id,
  COUNT(*) as total_cotizaciones,
  COUNT(CASE WHEN c.estado = 'enviada' THEN 1 END) as enviadas,
  COUNT(CASE WHEN c.estado = 'aprobada' THEN 1 END) as aprobadas,
  COUNT(CASE WHEN c.convertida_a_factura THEN 1 END) as facturadas,
  ROUND(COUNT(CASE WHEN c.estado = 'aprobada' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2) as tasa_aprobacion,
  ROUND(COUNT(CASE WHEN c.convertida_a_factura THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2) as tasa_conversion
FROM cotizaciones c
GROUP BY c.empresa_id;

-- Vista: Cuentas por cobrar (aging)
CREATE VIEW v_cuentas_por_cobrar AS
SELECT 
  f.empresa_id,
  cli.id as cliente_id,
  cli.nombre as cliente,
  cli.rnc_o_cedula,
  f.id as factura_id,
  f.numero_factura,
  f.fecha_emision,
  f.fecha_vencimiento,
  f.total,
  f.monto_pagado,
  f.saldo_pendiente,
  CURRENT_DATE - f.fecha_vencimiento as dias_vencido,
  CASE 
    WHEN f.fecha_vencimiento IS NULL OR f.fecha_vencimiento >= CURRENT_DATE THEN 'Al día'
    WHEN CURRENT_DATE - f.fecha_vencimiento <= 30 THEN '1-30 días'
    WHEN CURRENT_DATE - f.fecha_vencimiento <= 60 THEN '31-60 días'
    WHEN CURRENT_DATE - f.fecha_vencimiento <= 90 THEN '61-90 días'
    ELSE 'Más de 90 días'
  END as aging
FROM facturas f
INNER JOIN clientes cli ON f.cliente_id = cli.id
WHERE f.estado_pago IN ('sin_pagar', 'pago_parcial')
  AND f.estado != 'anulada';

-- Vista: Top clientes
CREATE VIEW v_top_clientes AS
SELECT 
  f.empresa_id,
  cli.id as cliente_id,
  cli.nombre as cliente,
  COUNT(f.id) as total_facturas,
  SUM(f.total) as total_facturado,
  SUM(f.monto_pagado) as total_pagado,
  SUM(f.saldo_pendiente) as saldo_pendiente,
  ROUND(AVG(f.total), 2) as ticket_promedio,
  MAX(f.fecha_emision) as ultima_compra
FROM facturas f
INNER JOIN clientes cli ON f.cliente_id = cli.id
WHERE f.estado != 'anulada'
GROUP BY f.empresa_id, cli.id, cli.nombre
ORDER BY total_facturado DESC;

-- Vista: Top productos
CREATE VIEW v_top_productos AS
SELECT 
  ps.empresa_id,
  ps.id as producto_id,
  ps.codigo,
  ps.nombre,
  ps.tipo,
  COUNT(DISTINCT fi.factura_id) as veces_vendido,
  SUM(fi.cantidad) as cantidad_total,
  SUM(fi.subtotal) as ingresos_brutos,
  SUM(fi.total) as ingresos_totales,
  ROUND(AVG(fi.precio_unitario), 2) as precio_promedio
FROM productos_servicios ps
INNER JOIN facturas_items fi ON ps.id = fi.producto_servicio_id
INNER JOIN facturas f ON fi.factura_id = f.id
WHERE f.estado != 'anulada'
GROUP BY ps.id, ps.empresa_id, ps.codigo, ps.nombre, ps.tipo
ORDER BY ingresos_totales DESC;

-- Vista: Conduces pendientes
CREATE VIEW v_conduces_pendientes AS
SELECT 
  con.empresa_id,
  con.id,
  con.numero_conduce,
  con.fecha,
  cli.nombre as cliente,
  cot.numero_cotizacion,
  con.equipo_nombre,
  con.placa,
  con.total,
  con.fecha_creacion
FROM conduces con
LEFT JOIN clientes cli ON con.cliente_id = cli.id
LEFT JOIN cotizaciones cot ON con.cotizacion_id = cot.id
WHERE con.incluido_en_proforma = FALSE
  AND con.estado = 'activo'
ORDER BY con.fecha DESC;

-- Vista: Estado NCF
CREATE VIEW v_estado_ncf AS
SELECT 
  e.id as empresa_id,
  e.nombre as empresa,
  sn.tipo as tipo_ncf,
  sn.serie,
  sn.secuencia_actual,
  sn.secuencia_final,
  sn.secuencia_final - sn.secuencia_actual as disponibles,
  ROUND((sn.secuencia_actual::DECIMAL / sn.secuencia_final * 100), 2) as porcentaje_uso,
  sn.fecha_expiracion,
  CASE 
    WHEN sn.fecha_expiracion < CURRENT_DATE THEN 'Vencido'
    WHEN sn.fecha_expiracion < CURRENT_DATE + INTERVAL '30 days' THEN 'Por vencer'
    ELSE 'Vigente'
  END as estado,
  sn.estado as estado_activo
FROM empresas e
INNER JOIN secuencias_ncf sn ON e.id = sn.empresa_id
ORDER BY e.nombre, sn.tipo;

-- Vista: Dashboard general
CREATE VIEW v_dashboard_general AS
SELECT 
  emp.id as empresa_id,
  emp.nombre as empresa,
  
  -- Ventas del mes
  (SELECT COUNT(*) FROM facturas WHERE empresa_id = emp.id 
   AND fecha_emision >= DATE_TRUNC('month', CURRENT_DATE)
   AND estado != 'anulada') as facturas_mes,
  (SELECT COALESCE(SUM(total), 0) FROM facturas WHERE empresa_id = emp.id 
   AND fecha_emision >= DATE_TRUNC('month', CURRENT_DATE)
   AND estado != 'anulada') as ventas_mes,
  
  -- Cotizaciones activas
  (SELECT COUNT(*) FROM cotizaciones WHERE empresa_id = emp.id 
   AND estado IN ('borrador', 'enviada', 'en_revision')) as cotizaciones_activas,
  (SELECT COALESCE(SUM(total), 0) FROM cotizaciones WHERE empresa_id = emp.id 
   AND estado IN ('borrador', 'enviada', 'en_revision')) as pipeline,
  
  -- Cuentas por cobrar
  (SELECT COALESCE(SUM(saldo_pendiente), 0) FROM facturas WHERE empresa_id = emp.id 
   AND estado_pago IN ('sin_pagar', 'pago_parcial')
   AND estado != 'anulada') as por_cobrar,
  
  -- Facturas vencidas
  (SELECT COUNT(*) FROM facturas WHERE empresa_id = emp.id 
   AND estado_pago IN ('sin_pagar', 'pago_parcial')
   AND fecha_vencimiento < CURRENT_DATE
   AND estado != 'anulada') as facturas_vencidas
  
FROM empresas emp;

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función: Obtener siguiente número de documento
CREATE OR REPLACE FUNCTION obtener_siguiente_numero(
  p_empresa_id UUID,
  p_tipo_documento "TipoDocumento",
  p_sucursal_id UUID DEFAULT NULL
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_numeracion RECORD;
  v_numero VARCHAR(50);
  v_lock_key BIGINT;
BEGIN
  -- Lock por empresa + tipo para evitar colisiones concurrentes
  v_lock_key := hashtextextended(p_empresa_id::text || ':' || p_tipo_documento::text, 0);
  PERFORM pg_advisory_lock(v_lock_key);

  -- Obtener configuración de numeración
  SELECT * INTO v_numeracion
  FROM numeraciones_documentos
  WHERE empresa_id = p_empresa_id
    AND tipo_documento = p_tipo_documento
    AND (sucursal_id = p_sucursal_id OR sucursal_id IS NULL)
    AND activo = TRUE
  ORDER BY sucursal_id NULLS LAST
  LIMIT 1
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay numeración configurada para % en empresa %', 
                    p_tipo_documento, p_empresa_id;
  END IF;
  
  -- Generar número según formato
  v_numero := COALESCE(v_numeracion.prefijo, '') || 
              LPAD(v_numeracion.siguiente_numero::TEXT, 8, '0');
  
  -- Actualizar siguiente número
  UPDATE numeraciones_documentos
  SET siguiente_numero = siguiente_numero + 1
  WHERE id = v_numeracion.id;
  
  PERFORM pg_advisory_unlock(v_lock_key);
  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- Función: Obtener siguiente NCF
CREATE OR REPLACE FUNCTION obtener_siguiente_ncf(
  p_empresa_id UUID,
  p_tipo_ncf "TipoNCF"
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_secuencia RECORD;
  v_ncf VARCHAR(50);
  v_lock_key BIGINT;
BEGIN
  v_lock_key := hashtextextended(p_empresa_id::text || ':NCF:' || p_tipo_ncf::text, 0);
  PERFORM pg_advisory_lock(v_lock_key);

  -- Obtener secuencia activa
  SELECT * INTO v_secuencia
  FROM secuencias_ncf
  WHERE empresa_id = p_empresa_id
    AND tipo = p_tipo_ncf
    AND estado = 'activo'
    AND fecha_expiracion > CURRENT_DATE
    AND secuencia_actual < secuencia_final
  ORDER BY fecha_expiracion
  LIMIT 1
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay secuencia NCF válida para tipo % en empresa %', 
                    p_tipo_ncf, p_empresa_id;
  END IF;
  
  -- Generar NCF
  v_ncf := v_secuencia.serie || LPAD(v_secuencia.secuencia_actual::TEXT, 8, '0');
  
  -- Actualizar secuencia
  UPDATE secuencias_ncf
  SET secuencia_actual = secuencia_actual + 1
  WHERE id = v_secuencia.id;
  
  PERFORM pg_advisory_unlock(v_lock_key);
  RETURN v_ncf;
END;
$$ LANGUAGE plpgsql;

-- Función: Aplicar pago a factura
CREATE OR REPLACE FUNCTION aplicar_pago(
  p_factura_id UUID,
  p_monto DECIMAL(20,2),
  p_metodo "MetodoPago",
  p_fecha_pago DATE,
  p_referencia VARCHAR(100) DEFAULT NULL,
  p_usuario_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_pago_id UUID;
  v_factura RECORD;
BEGIN
  -- Obtener factura
  SELECT * INTO v_factura FROM facturas WHERE id = p_factura_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Factura no encontrada';
  END IF;
  
  IF v_factura.estado = 'anulada' THEN
    RAISE EXCEPTION 'No se puede aplicar pago a factura anulada';
  END IF;
  
  -- Crear pago
  INSERT INTO pagos (
    factura_id, empresa_id, fecha_pago, monto, metodo, 
    referencia, registrado_por
  ) VALUES (
    p_factura_id, v_factura.empresa_id, p_fecha_pago, p_monto, 
    p_metodo, p_referencia, p_usuario_id
  ) RETURNING id INTO v_pago_id;
  
  RETURN v_pago_id;
END;
$$ LANGUAGE plpgsql;

-- Función: Crear proforma desde cotización
CREATE OR REPLACE FUNCTION crear_proforma_desde_cotizacion(
  p_cotizacion_id UUID,
  p_usuario_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_proforma_id UUID;
  v_numero_proforma VARCHAR(50);
  v_cotizacion RECORD;
BEGIN
  -- Obtener cotización
  SELECT * INTO v_cotizacion FROM cotizaciones WHERE id = p_cotizacion_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cotización no encontrada';
  END IF;
  
  IF v_cotizacion.estado != 'aprobada' THEN
    RAISE EXCEPTION 'La cotización debe estar aprobada';
  END IF;
  
  -- Generar número
  v_numero_proforma := obtener_siguiente_numero(
    v_cotizacion.empresa_id, 
    'proforma', 
    v_cotizacion.sucursal_id
  );
  
  -- Crear proforma
  v_proforma_id := uuid_generate_v4();
  
  INSERT INTO proformas (
    id, numero_proforma, empresa_id, sucursal_id, cotizacion_id, cliente_id,
    fecha_emision, valido_hasta, subtotal, descuento_total, 
    monto_impuesto, total, cotizacion_total, notas, terminos_condiciones,
    creado_por
  ) SELECT
    v_proforma_id, v_numero_proforma, empresa_id, sucursal_id, id, cliente_id,
    CURRENT_DATE, valido_hasta, subtotal, descuento_total,
    monto_impuesto, total, total, notas, terminos_condiciones,
    p_usuario_id
  FROM cotizaciones WHERE id = p_cotizacion_id;
  
  -- Copiar items
  INSERT INTO proformas_items (
    proforma_id, producto_servicio_id, descripcion, cantidad, unidad,
    precio_unitario, descuento, tasa_impuesto, monto_impuesto, 
    subtotal, total, orden
  ) SELECT
    v_proforma_id, producto_servicio_id, descripcion, cantidad, unidad,
    precio_unitario, descuento, tasa_impuesto, monto_impuesto,
    subtotal, total, orden
  FROM cotizaciones_items WHERE cotizacion_id = p_cotizacion_id;
  
  -- Marcar cotización como convertida
  UPDATE cotizaciones
  SET convertida_a_proforma = TRUE,
      proforma_id = v_proforma_id,
      estado = 'convertida'
  WHERE id = p_cotizacion_id;
  
  RETURN v_proforma_id;
END;
$$ LANGUAGE plpgsql;

-- Función: Crear factura desde proforma
CREATE OR REPLACE FUNCTION crear_factura_desde_proforma(
  p_proforma_id UUID,
  p_tipo_ncf "TipoNCF" DEFAULT 'B02',
  p_usuario_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_factura_id UUID;
  v_numero_factura VARCHAR(50);
  v_ncf VARCHAR(50);
  v_proforma RECORD;
BEGIN
  -- Obtener proforma
  SELECT * INTO v_proforma FROM proformas WHERE id = p_proforma_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proforma no encontrada';
  END IF;
  
  -- Generar números
  v_numero_factura := obtener_siguiente_numero(
    v_proforma.empresa_id,
    'factura',
    v_proforma.sucursal_id
  );
  
  v_ncf := obtener_siguiente_ncf(v_proforma.empresa_id, p_tipo_ncf);
  
  -- Crear factura
  v_factura_id := uuid_generate_v4();
  
  INSERT INTO facturas (
    id, numero_factura, numero_ncf, tipo_ncf,
    empresa_id, sucursal_id, proforma_id, cotizacion_id, cliente_id,
    fecha_emision, subtotal, descuento_total, monto_impuesto, total,
    notas, terminos_condiciones, creado_por
  ) SELECT
    v_factura_id, v_numero_factura, v_ncf, p_tipo_ncf,
    empresa_id, sucursal_id, id, cotizacion_id, cliente_id,
    CURRENT_DATE, subtotal, descuento_total, monto_impuesto, total,
    notas, terminos_condiciones, p_usuario_id
  FROM proformas WHERE id = p_proforma_id;
  
  -- Copiar items
  INSERT INTO facturas_items (
    factura_id, producto_servicio_id, descripcion, cantidad, unidad,
    precio_unitario, descuento, tasa_impuesto, monto_impuesto,
    subtotal, total, orden
  ) SELECT
    v_factura_id, producto_servicio_id, descripcion, cantidad, unidad,
    precio_unitario, descuento, tasa_impuesto, monto_impuesto,
    subtotal, total, orden
  FROM proformas_items WHERE proforma_id = p_proforma_id;
  
  -- Marcar proforma como convertida
  UPDATE proformas
  SET convertida_a_factura = TRUE,
      factura_id = v_factura_id,
      estado = 'convertida'
  WHERE id = p_proforma_id;
  
  RETURN v_factura_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas principales
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proformas_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conduces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglas_aprobacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprobaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE numeraciones_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE secuencias_ncf ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (ajustar según necesidades de Supabase Auth)
/* Políticas base por empresa (ajusta según tu mapping auth.uid -> usuarios.auth_user_id) */
CREATE POLICY pol_empresas_self ON empresas
  FOR SELECT USING (id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_tablas_empresa ON clientes
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_productos_empresa ON productos_servicios
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_docs_empresa ON cotizaciones
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_proformas_empresa ON proformas
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_facturas_empresa ON facturas
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_items_empresa ON cotizaciones_items
  FOR ALL
  USING (cotizacion_id IN (SELECT id FROM cotizaciones WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid())))
  WITH CHECK (cotizacion_id IN (SELECT id FROM cotizaciones WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid())));

CREATE POLICY pol_items_proforma_empresa ON proformas_items
  FOR ALL
  USING (proforma_id IN (SELECT id FROM proformas WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid())))
  WITH CHECK (proforma_id IN (SELECT id FROM proformas WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid())));

CREATE POLICY pol_items_factura_empresa ON facturas_items
  FOR ALL
  USING (factura_id IN (SELECT id FROM facturas WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid())))
  WITH CHECK (factura_id IN (SELECT id FROM facturas WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid())));

CREATE POLICY pol_conduces_empresa ON conduces
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_pagos_empresa ON pagos
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_aprobaciones_empresa ON aprobaciones
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_reglas_aprobacion_empresa ON reglas_aprobacion
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_numeraciones_empresa ON numeraciones_documentos
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_secuencias_ncf_empresa ON secuencias_ncf
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_envios_empresa ON envios_documentos
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_actividades_empresa ON actividades
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY pol_audit_log_empresa ON audit_log
  FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()));

-- =====================================================
-- DATOS INICIALES (OPCIONAL - DESCOMENTAR SI SE NECESITA)
-- =====================================================

/*
-- Permisos base del sistema
INSERT INTO permisos (clave, modulo, accion, descripcion) VALUES
-- Cotizaciones
('cotizaciones.ver', 'cotizaciones', 'ver', 'Ver cotizaciones'),
('cotizaciones.crear', 'cotizaciones', 'crear', 'Crear cotizaciones'),
('cotizaciones.editar', 'cotizaciones', 'editar', 'Editar cotizaciones'),
('cotizaciones.eliminar', 'cotizaciones', 'eliminar', 'Eliminar cotizaciones'),
('cotizaciones.aprobar', 'cotizaciones', 'aprobar', 'Aprobar cotizaciones'),
('cotizaciones.enviar', 'cotizaciones', 'enviar', 'Enviar cotizaciones'),
-- Facturas
('facturas.ver', 'facturas', 'ver', 'Ver facturas'),
('facturas.crear', 'facturas', 'crear', 'Crear facturas'),
('facturas.editar', 'facturas', 'editar', 'Editar facturas'),
('facturas.anular', 'facturas', 'anular', 'Anular facturas'),
('facturas.cobrar', 'facturas', 'cobrar', 'Registrar pagos'),
-- Clientes
('clientes.ver', 'clientes', 'ver', 'Ver clientes'),
('clientes.crear', 'clientes', 'crear', 'Crear clientes'),
('clientes.editar', 'clientes', 'editar', 'Editar clientes'),
-- Productos
('productos.ver', 'productos', 'ver', 'Ver productos'),
('productos.crear', 'productos', 'crear', 'Crear productos'),
('productos.editar', 'productos', 'editar', 'Editar productos'),
-- Reportes
('reportes.ver', 'reportes', 'ver', 'Ver reportes'),
('reportes.exportar', 'reportes', 'exportar', 'Exportar reportes'),
-- Configuración
('config.ver', 'configuracion', 'ver', 'Ver configuración'),
('config.editar', 'configuracion', 'editar', 'Editar configuración');

-- Asignar permisos a roles (ejemplo admin)
INSERT INTO roles_permisos (rol, permiso_id)
SELECT 'admin', id FROM permisos;
*/

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON DATABASE CURRENT_DATABASE IS 'Sistema de Facturación Completo para Supabase';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
