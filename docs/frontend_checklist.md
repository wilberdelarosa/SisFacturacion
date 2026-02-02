# Frontend checklist y mapa funcional (segun base de datos)

> Objetivo: guiar la construccion del frontend completo (login, layout, formularios, flujos y conexiones a API/Supabase) alineado al esquema de base de datos del sistema de facturacion (cotizaciones, conduces, proformas, facturas, pagos, NCF, aprobaciones, auditoria).

## Login y seguridad
- [ ] Pantalla de login con usuario por defecto Admin / !Admin (seed inicial) y opcion recordar sesion.
- [ ] Validacion de credenciales contra Auth o tabla usuarios (email + password_hash); manejar bloqueo por intentos_fallidos y bloqueado_hasta.
- [ ] Guardar sesion/refresh en tabla sesiones (token, refresh_token, ip, user_agent, expira_en) y cerrar sesion.
- [ ] Recuperar password y flujo de debe_cambiar_password.
- [ ] Auditoria de accesos (ultimo_acceso, ultima_ip) y registro en audit_log.

## Shell y navegacion
- [ ] Layout principal con header (empresa/sucursal activa, usuario, logout), sidebar por modulo y breadcrumbs.
- [ ] Selector de empresa y sucursal (multi-tenant) que filtra todas las consultas por empresa_id y sucursal_id.
- [ ] Bandeja de notificaciones (actividades, aprobaciones pendientes, errores de envios_documentos).

## Gestion de usuarios y permisos
- [ ] CRUD de usuarios (nombre, correo, telefono, rol, estado) con asignacion de sucursal y avatar.
- [ ] Asignacion de rol (RolUsuario) y permisos especificos (usuarios_permisos) con override permitir/denegar.
- [ ] Catalogo de permisos (permisos.clave modulo.accion) y mapa de roles_permisos.
- [ ] Reset de password, bloqueo/desbloqueo, y bandeja de intentos fallidos.

## Parametrizacion inicial
- [ ] Perfil de empresa (empresas) con logo, rnc, direccion, moneda_base, configuracion JSON.
- [ ] Sucursales (sucursales) con codigo unico por empresa y flag es_principal.
- [ ] Numeracion de documentos (numeraciones_documentos) por tipo y sucursal; preview del formato.
- [ ] Secuencias NCF (secuencias_ncf) con rango, serie, estado y alerta de expiracion.
- [ ] Impuestos (impuestos) y tipos de pago/metodo de pago para listas desplegables.

## Maestros comerciales
- [ ] Clientes (clientes) con codigo, tipo_pago (contado/credito), limite_credito, dias_credito, descuento_general, etiquetas.
- [ ] Productos/servicios (productos_servicios) con precio, costo, tasa_impuesto, categoria, marca, tipo (producto/servicio/alquiler/transporte).
- [ ] Equipos/vehiculos (equipos) con placa, marca, modelo, estado.

## Documentos y flujo comercial
- [ ] Cotizaciones: lista, filtros por estado/cliente/vendedor/fecha; alta/edicion con items (cotizaciones_items), calculo de impuestos/descuentos y pipeline (etapa, probabilidad). Conversor a proforma o factura; firma y url_pdf.
- [ ] Conduces: lista y creacion ligada a cotizacion; captura de equipo, conductor, origen/destino, materiales, firmas; marca incluido_en_proforma en triggers.
- [ ] Proformas: lista y detalle; generar desde cotizacion o conduces; items (proformas_items) con referencia a conduce_id; comparacion variacion_monto vs cotizacion.
- [ ] Facturas: generacion desde proforma o cotizacion; NCF (numero_ncf, tipo_ncf, vigencia); calculo de impuestos y saldo_pendiente; anulacion (anulado_por, razon_anulacion) y url_pdf.
- [ ] Items de factura (facturas_items) con impuestos y totales en linea.
- [ ] Conversores de estado: borrador -> en_revision -> aprobada/rechazada -> enviada -> pendiente_pago -> pagada/vencida/cancelada/anulada.

## Pagos y cartera
- [ ] Registro de pagos (pagos) por factura, soportando metodos (efectivo, transferencia, tarjeta, cheque, deposito, otro) y referencia/banco/cuenta.
- [ ] Recalculo de estado_pago via trigger (sin_pagar, pago_parcial, pagado) y actualizacion de saldo_pendiente.
- [ ] Comprobantes (comprobante_url) y notas de pago.

## Aprobaciones y firmas
- [ ] Configuracion de reglas_aprobacion por tipo_documento (limite de monto, descuento_maximo, rol_aprobador o usuario_aprobador_id).
- [ ] Bandeja de aprobaciones (aprobaciones) con estados pendiente/aprobada/rechazada/cancelada, comentario y fechas.
- [ ] Firma digital o captura de firma (cotizaciones.firma, conduces.firma_entrega/firma_recibido).

## Envio y comunicacion
- [ ] Enviar documentos (envios_documentos) por correo/whatsapp/etc con asunto, mensaje y adjuntos; mostrar estado y errores.
- [ ] Reenvio y registro en audit_log/actividades.

## Auditoria y actividades
- [ ] Listado filtrable de audit_log por modulo, entidad y fecha; mostrar dif de datos_anteriores vs datos_nuevos.
- [ ] Timeline de actividades (actividades) por entidad (cotizacion, proforma, factura, cliente, etc.).

## Reportes y BI
- [ ] Dashboard de flujo comercial basado en vista v_flujo_documentos (totales cotizacion->conduces->proforma->factura y estado_pago).
- [ ] Reporte de ventas por periodo (v_ventas_periodo) y filtros por empresa/sucursal/cliente/usuario.
- [ ] Reporte de cartera: facturas por estado_pago y vencimiento.

## UX adicional
- [ ] Buscador global (clientes, documentos, productos) con atajos.
- [ ] Soporte multi-moneda: mostrar total_moneda_base y tasa_cambio donde aplique.
- [ ] Exportar/descargar PDF en cotizaciones, proformas, facturas, conduces.
- [ ] Tabs o secciones de comentarios/notas y terminos_condiciones en documentos.

## Conexiones y contratos front-back
- [ ] Todas las llamadas deben enviar empresa_id y sucursal_id vigentes.
- [ ] Catalogos reutilizables: tipos enum (TipoDocumento, EstadoDocumento, TipoCliente, TipoProducto, RolUsuario, EstadoPago, MetodoPago, TipoNCF, EstadoAprobacion, TipoPago).
- [ ] Manejar relaciones clave: usuario -> empresa/sucursal; cotizacion -> items/clientes/usuarios; conduce -> cotizacion/cliente/equipo; proforma -> cotizacion/conduces/items; factura -> proforma/cotizacion/items/pagos; pagos -> factura/empresa.
- [ ] Triggers que afectan UI: marcar_conduce_en_proforma y actualizar_estado_pago_factura; refrescar vistas tras insercion/edicion.

## Primer release (orden sugerido)
1) Login robusto y shell con selector empresa/sucursal.
2) Maestros: empresa, sucursales, usuarios/roles/permisos, clientes, productos_servicios, impuestos, equipos.
3) Parametrizacion: numeraciones_documentos, secuencias_ncf.
4) Flujo documentos: cotizacion -> conduce -> proforma -> factura + items + PDF.
5) Pagos y estado de factura.
6) Aprobaciones y envios_documentos.
7) Auditoria/actividades y reportes BI.

## Datos de prueba minimos
- Usuario admin: Admin / !Admin (rol admin o superadmin) asociado a empresa y sucursal principal.
- Empresa demo con una sucursal principal.
- Cliente demo, producto/servicio demo, impuesto 18%, numeracion y secuencia NCF activa.
- Una cotizacion con items, un conduce vinculado, una proforma y una factura generada, con pago parcial y pagos registrados.
