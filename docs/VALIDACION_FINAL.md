# Validación de la versión final — MercaVerde

Fecha: 6 de noviembre de 2026
Estado: se completa después de las pruebas en los dispositivos

---

## 1. Lo que tiene que estar funcionando

Las tres columnas de equipos se marcan con una X cuando el caso se probó en ese equipo.

| # | Funcionalidad | Quién la usa | iPhone 1 | iPhone 2 | Web | Estado |
|---|---------------|--------------|:---:|:---:|:---:|--------|
| F1 | Catálogo sin stock a la vista | Comprador | | | | |
| F2 | Agregar al carrito y ver el pedido | Comprador | | | | |
| F3 | "Ver pedido" escondido con el carrito vacío | Comprador | | | | |
| F4 | Crear producto con la URL de la imagen | Vendedor | | | | |
| F5 | Editar producto y guardar el stock | Vendedor | | | | |
| F6 | Archivar y restaurar producto | Vendedor/Admin | | | | |
| F7 | Ticket en estado "Pendiente" | Vendedor | | | | |
| F8 | Preparar → Listo → Entregado | Vendedor | | | | |
| F9 | Proponer sustitución sin IDs | Vendedor | | | | |
| F10 | Aceptar o rechazar la sustitución | Comprador | | | | |
| F11 | Eliminar pedido | Vendedor | | | | |
| F12 | Aviso de pedido eliminado | Comprador | | | | |
| F13 | Refresco automático sin recargar | Los dos | | | | |
| F14 | Menú por secciones (Inventario / Tickets / Analítica) | Admin | | | | |
| F15 | Entrar por web sin cuenta de Expo | Cualquiera | | | | |
| F16 | Pagar: elegir método y confirmar | Comprador | | | | |
| F17 | Comprobante con referencia, método y total | Comprador | | | | |
| F18 | El ticket dice "Pagado" o "No pagado" | Vendedor | | | | |
| F19 | "Preparar" bloqueado si el pedido no está pagado | Vendedor | | | | |

## 2. Permisos y seguridad

Las que dice **Verificado** se probaron directo contra la API con tokens de cada rol.

| # | Prueba | Se espera | Verificado | Estado |
|---|--------|-----------|:---:|--------|
| S1 | `GET /api/inventario` sin token → 401 | Error de autenticación | X | |
| S2 | `GET /api/inventario` como comprador → 403 | Sin permisos | X | |
| S3 | `GET /api/inventario` como vendedor → 200 | Stock a la vista | X | |
| S4 | `POST /api/pedidos` sin stock → 400 | "inventario insuficiente" | X | |
| S5 | El catálogo no manda existencias | Los campos de stock no aparecen | X | |
| S6 | `PATCH /api/pedidos/:id/pagar` como vendedor → 403 | Sin permisos | X | |
| S7 | `PATCH /api/pedidos/:id` a `en_preparacion` sin pagar → 400 | "El pedido debe estar pagado antes de preparar." | X | |
| S8 | `PATCH /api/pedidos/:id/pagar` de otro comprador → 404 | Pedido no encontrado | X | |

## 3. Errores que quedaron pendientes

| ID | Qué pasa | Gravedad | Fecha | Estado | Arreglado en |
|----|----------|----------|-------|--------|--------------|
| | | | | | |
| | | | | | |
| | | | | | |

## 4. Guion del video

Lo que hay que grabar, en este orden:

1. **Catálogo del comprador**: se recorre el catálogo y se ve que no hay stock ni "Agotado".
2. **403 en el inventario**: se intenta entrar como comprador y sale el error de permisos.
3. **Inventario insuficiente**: se pide más de lo que hay y el servidor lo rechaza.
4. **Panel del vendedor**: los botones +/−, el formulario de producto, archivar y restaurar.
5. **Tickets**: la lista con filtros por estado y por fecha.
6. **Sustitución por búsqueda**: se propone un reemplazo sin escribir IDs.
7. **Pedido esperando al comprador**: el ticket en `cambio_pendiente`.
8. **Pago**: el comprador paga, sale el comprobante y en el ticket queda "Pagado".
9. **Eliminar pedido**: el vendedor lo elimina y el comprador ve el aviso.
10. **Web**: se abre en el navegador sin Expo Go ni cuenta de Expo.

## 5. Firmas

| Rol | Nombre | Fecha | Firma |
|-----|--------|-------|-------|
| Desarrollador | | | |
| Probador | | | |
| Cliente | | | |

## 6. Resultado

- [ ] **APROBADO**: pasan los casos críticos y se puede entregar
- [ ] **APROBADO CON OBSERVACIONES**: quedan detalles menores que no bloquean la entrega
- [ ] **RECHAZADO**: hay errores críticos sin resolver

Comentarios: ________________________________________________________

fecha de validación: ________________
