# Matriz de pruebas — MercaVerde

Proyecto: MercaVerde (app Expo + API Express/Firebase)
Fecha: 6 de noviembre de 2026
Estado: en ejecución

Los casos que dice **Verificado** se comprobaron contra la API con tokens reales de cada rol (comprador, vendedor y administrador). Los que dicen **Pendiente** hay que probarlos a mano en los dos iPhones y en web, y anotar la evidencia.

---

## 1. Alcance

| Módulo | Qué se prueba | Dónde |
|---|---|---|
| Catálogo (comprador) | Listado, filtros, ficha del producto, agregar al carrito, ver el pedido | 2 iPhones + web |
| Inventario (vendedor/admin) | Crear, editar, archivar, restaurar, stock con +/− y escrito | 2 iPhones + web |
| Pedidos | Crear pedido, estados, aceptar o rechazar sustitución, eliminar | 2 iPhones + web |
| Sustituciones | Propuesta de reemplazo y respuesta del comprador | 2 iPhones + web |
| Pagos | Elegir método, confirmar, comprobante, bloqueo al preparar sin pagar | 2 iPhones + web |
| API | Endpoints, validaciones, permisos por rol, CORS, health | Postman + web |
| Red | Caída de conexión, reconexión, persistencia local | iPhone en modo avión |
| Persistencia | AsyncStorage, carrito local, cola de sincronización | 2 iPhones |

---

## 2. Catálogo (comprador)

| ID | Caso | Entrada | Resultado esperado | Estado | Evidencia |
|----|------|---------|-------------------|--------|-----------|
| CT-01 | Carga el catálogo | App abierta con sesión válida | Salen nombre, precio, unidad y categoría de cada producto | Pendiente | |
| CT-02 | El stock no se ve | Ver el catálogo | No aparece el stock ni ningún indicador de "agotado" | Verificado | |
| CT-03 | Filtrar por categoría | Elegir una categoría | Solo salen los productos de esa categoría | Pendiente | |
| CT-04 | Buscar producto | Escribir en el buscador | Se filtran los que coincidan | Pendiente | |
| CT-05 | Ficha del producto | Tocar un producto | Salen imagen, precio, unidad, descripción y productor | Pendiente | |
| CT-06 | Agregar al carrito | Tocar "Agregar al pedido" | El producto queda en el carrito con cantidad 1 | Pendiente | |
| CT-07 | "Ver pedido" oculto | Carrito vacío | El botón no aparece | Pendiente | |
| CT-08 | "Ver pedido" visible | Carrito con productos | El botón dice "Ver pedido (N)" | Pendiente | |
| CT-09 | Sin conexión | Quitar el Wi-Fi | El catálogo sale desde la copia local | Pendiente | |

---

## 3. Inventario (vendedor/admin)

| ID | Caso | Entrada | Resultado esperado | Estado | Evidencia |
|----|------|---------|-------------------|--------|-----------|
| IV-01 | Ver el inventario | Entrar como vendedor | Se listan los productos con su stock | Pendiente | |
| IV-02 | Crear producto | Formulario con la URL de la imagen | El producto sale en inventario y en catálogo | Pendiente | |
| IV-03 | Editar producto | Cambiar nombre, precio o cantidad | Los cambios se ven de una | Pendiente | |
| IV-04 | Stock escrito | Escribir la cantidad y guardar | El stock queda con el valor escrito | Pendiente | |
| IV-05 | Stock con +/− | Tocar − o + | El stock baja o sube en 1 | Pendiente | |
| IV-06 | Archivar producto | Tocar el botón de archivar | Deja de salir en el catálogo | Pendiente | |
| IV-07 | Restaurar producto | "Restaurar" en la sección Archivados | Vuelve al inventario activo | Pendiente | |
| IV-08 | Campos duplicados | Editar un producto que tenía `Activo` / `Disponibilidad` | La API los deja en `activo` / `disponibilidad` | Verificado | |
| IV-09 | Cantidad negativa | Escribir -5 en el stock | Error: "Cantidad inválida" | Pendiente | |

---

## 4. Pedidos

| ID | Caso | Entrada | Resultado esperado | Estado | Evidencia |
|----|------|---------|-------------------|--------|-----------|
| PD-01 | Crear pedido | Confirmar el carrito | El pedido queda en estado "pendiente" | Pendiente | |
| PD-02 | Stock insuficiente | Pedir más de lo que hay | Error: "inventario insuficiente (disponible N)" | Verificado | |
| PD-03 | El vendedor ve el ticket | Entrar como vendedor | El ticket sale en la sección Tickets con estado "Pendiente" | Pendiente | |
| PD-04 | Preparar | Tocar "Preparar" | Pasa a "En preparación" | Pendiente | |
| PD-05 | Listo | Tocar "Listo" | Pasa a "Listo" | Pendiente | |
| PD-06 | Entregado | Tocar "Entregado" | Pasa a "Entregado" | Pendiente | |
| PD-07 | El comprador ve los estados | Mis pedidos | Sale la línea Pendiente → En preparación → Listo → Entregado | Pendiente | |
| PD-08 | Eliminar pedido (vendedor) | "Eliminar" en el ticket | El pedido queda marcado como eliminado y desaparece para el vendedor | Pendiente | |
| PD-09 | Aviso de pedido eliminado | Entrar como comprador | Salida: "Este pedido fue eliminado por el vendedor" | Pendiente | |
| PD-10 | Cancelar (comprador) | Pedido en estado pendiente, tocar cancelar | Queda cancelado | Pendiente | |

---

## 5. Pagos

| ID | Caso | Entrada | Resultado esperado | Estado | Evidencia |
|----|------|---------|-------------------|--------|-----------|
| PG-01 | Botón Pagar | Mis pedidos con un pedido sin pagar | Dentro de la tarjeta sale la cajita "Pedido pendiente de pago" y el botón "Pagar" | Pendiente | |
| PG-02 | Abrir la pasarela | Tocar "Pagar" | Se abre la pantalla con Efectivo, Tarjeta débito/crédito y PSE | Pendiente | |
| PG-03 | Validar la selección | Tocar "Pagar" sin elegir método | Aviso: "Selecciona un método" | Pendiente | |
| PG-04 | Elegir método | Tocar una de las tres opciones | Queda marcada como "Seleccionado" y se habilita el botón "Pagar" | Pendiente | |
| PG-05 | Confirmar el pago | Tocar "Pagar" con método elegido | Se guarda `pagado: true` y sale la pantalla del comprobante | Verificado | |
| PG-06 | Comprobante | Después de pagar | Salen referencia, fecha, método, productos, cantidades y total | Pendiente | |
| PG-07 | El ticket muestra el pago | Vendedor en la sección Tickets | La cajita del ticket dice "Pagado" o "No pagado" | Pendiente | |
| PG-08 | No se prepara sin pago | Tocar "Preparar" en un pedido sin pagar | Botón deshabilitado y aviso "Esperando pago" | Pendiente | |
| PG-09 | El servidor tampoco lo deja | PATCH a `en_preparacion` sin pagar | 400: "El pedido debe estar pagado antes de preparar." | Verificado | |
| PG-10 | Solo paga el comprador | Vendedor o admin en `/api/pedidos/:id/pagar` | 403 por permisos | Verificado | |
| PG-11 | No se paga dos veces | Pagar el mismo pedido otra vez | 400: "El pedido ya fue pagado." | Verificado | |
| PG-12 | Nadie paga pedidos ajenos | Otro comprador en `/api/pedidos/:id/pagar` | 404 "Pedido no encontrado." | Verificado | |

---

## 6. Sustituciones

| ID | Caso | Entrada | Resultado esperado | Estado | Evidencia |
|----|------|---------|-------------------|--------|-----------|
| SU-01 | Proponer sustitución | "Reemplazar" en la línea de un producto | Se abre el selector de productos por nombre | Pendiente | |
| SU-02 | Buscar sustituto | Escribir el nombre en el selector | Se filtran los productos activos que coincidan | Pendiente | |
| SU-03 | Elegir sustituto | Tocar el producto alternativo | Salida la confirmación del reemplazo | Pendiente | |
| SU-04 | Confirmar propuesta | Tocar "Enviar propuesta" | El pedido pasa a "cambio_pendiente" con los itemsPropuestos | Pendiente | |
| SU-05 | El comprador ve la propuesta | Mis pedidos | Salida "El vendedor propone cambiar los productos" con Aceptar y Rechazar | Pendiente | |
| SU-06 | Aceptar | "Aceptar cambios" | El pedido vuelve a "pendiente" con los ítems nuevos y el total recalculado | Pendiente | |
| SU-07 | Rechazar | "Rechazar" | El pedido vuelve a "pendiente" con los ítems originales | Pendiente | |
| SU-08 | Sin IDs a mano | Todo el flujo | Nunca se pide escribir un ID de Firestore | Pendiente | |

---

## 7. API y permisos

| ID | Caso | Entrada | Resultado esperado | Estado | Evidencia |
|----|------|---------|-------------------|--------|-----------|
| AP-01 | Health | `GET /health` | Responde `{"ok":true}` | Verificado | |
| AP-02 | Inventario sin token | `GET /api/inventario` sin Authorization | 401 | Verificado | |
| AP-03 | Inventario como comprador | `GET /api/inventario` con token de comprador | 403 | Verificado | |
| AP-04 | Inventario como vendedor | `GET /api/inventario` con token de vendedor | 200 con el stock | Verificado | |
| AP-05 | Catálogo sin stock | `GET /api/catalogo` con token de comprador | 200 sin campos de stock | Verificado | |
| AP-06 | Detalle de pedido | `GET /api/pedidos/:id` con token del dueño | 200 con los datos del pedido | Verificado | |
| AP-07 | Detalle de pedido ajeno | El mismo endpoint con token de otro comprador | 404 "Pedido no encontrado." | Verificado | |
| AP-08 | CORS | Petición desde el navegador | Llega la cabecera `Access-Control-Allow-Origin` | Pendiente | |

---

## 8. Red y persistencia

| ID | Caso | Entrada | Resultado esperado | Estado | Evidencia |
|----|------|---------|-------------------|--------|-----------|
| RD-01 | Sin conexión al abrir | Modo avión al abrir la app | El catálogo sale desde la caché | Pendiente | |
| RD-02 | Pedido sin conexión | Confirmar un pedido sin Wi-Fi | Queda guardado como "pendiente por sincronizar" | Pendiente | |
| RD-03 | Reconexión | Volver a conectar el Wi-Fi | El pedido se manda solo a Firestore | Pendiente | |
| RD-04 | Carrito persistente | Cerrar y abrir la app | El carrito conserva lo que se agregó | Pendiente | |
| RD-05 | Precio inválido | Mandar precio negativo | 400 con mensaje que explica el error | Verificado | |
| RD-06 | URL de imagen inválida | Pegar una URL que no existe | Aviso de validación, sin romper la app | Pendiente | |

---

## 9. Dos dispositivos a la vez

| ID | Caso | Entrada | Resultado esperado | Estado | Evidencia |
|----|------|---------|-------------------|--------|-----------|
| MD-01 | Dos iPhones | iPhone 1 de comprador, iPhone 2 de vendedor | Los dos operan sin pisarse | Pendiente | |
| MD-02 | Cambio de stock | El vendedor cambia el stock | Al comprador le falla el pedido si ya no alcanza | Pendiente | |
| MD-03 | Sesiones aparte | Cada iPhone con su correo | Cada uno ve solo sus pedidos | Pendiente | |

---

## 10. Archivos de la entrega

| Documento | Ruta |
|---|---|
| Esta matriz | `docs/PRUEBAS_MATRIZ.md` |
| Registro de errores | `docs/REGISTRO_ERRORES.md` |
| Guía de ejecución | `docs/GUIA_EJECUCION.md` |
| Validación final | `docs/VALIDACION_FINAL.md` |

## 11. Lo que falta

1. Correr los casos pendientes en los dos iPhones y en web.
2. Llenar la columna de evidencia con capturas.
3. Si algo falla, anotarlo en `docs/REGISTRO_ERRORES.md`, corregirlo y volver a probar.
4. Cerrar `docs/VALIDACION_FINAL.md` con el resultado.
