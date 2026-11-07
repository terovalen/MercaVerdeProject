# Registro de errores — MercaVerde

Proyecto: MercaVerde
Fecha: 6 de noviembre de 2026
Estado: activo

Aquí queda anotado lo que se rompió, cómo se arregló y lo que falta comprobar. Cuando aparezca algo nuevo durante las pruebas, se copia el formato de la sección 3 y se agrega al final.

---

## 1. Errores que ya quedaron resueltos

| ID | Fecha | Módulo | Qué pasaba | Cómo se resolvió | Estado |
|----|-------|--------|------------|------------------|--------|
| ERR-001 | 04/11 | Expo Go iOS | "You're signed in to Expo CLI as terovalen21, but not signed in to Expo Go" | `npx expo login` en la PC con la misma cuenta que la de los iPhones | Resuelto |
| ERR-002 | 04/11 | Expo Go iOS | "The request timed out" en el segundo iPhone | Era red: revisar que los dos estuvieran en el mismo SSID y sin datos móviles | Resuelto |
| ERR-003 | 05/11 | Expo CLI Windows | `npx expo login` se caía al abrir la URL con `&` | Parche en `node_modules/@expo/cli/build/src/utils/open.js` (escapar `&` y `windowsVerbatimArguments`) | Resuelto |
| ERR-004 | 05/11 | API | Campos duplicados en Firestore (`Activo`, `Disponibilidad ` con espacio al final) | La API normaliza al escribir y se corrió un script de una vez para dejar los 9 productos limpios | Resuelto |
| ERR-005 | 05/11 | EAS projectId | El prompt "Log in / Proceed anonymously" se quedaba esperando y bloqueaba la carga | Quitar `extra.eas.projectId` de `app.json` | Resuelto |
| ERR-006 | 06/11 | Expo Go iOS | "You need to be signed in to Expo Go and Expo CLI" | Expo Go 57+ exige la misma cuenta en los dos lados | Resuelto |

## 2. Incidencias abiertas o por confirmar

| ID | Fecha | Módulo | Qué hay que mirar | Prioridad | Estado |
|----|-------|--------|------------------|-----------|--------|
| INC-001 | 06/11 | API | El borrado de pedidos es lógico (`eliminado: true`): falta ver que al comprador le sale el aviso | Alta | Pendiente de prueba |
| INC-002 | 06/11 | API | La transición `pendiente → en_preparacion` descuenta stock: falta confirmar que la transacción no deja el inventario a medias | Alta | Pendiente de prueba |
| INC-003 | 06/11 | UI | El botón "Preparar" no debe salir en estado `en_preparacion` | Media | Corregido (`puedePreparar` solo aplica a `pendiente`) |
| INC-004 | 06/11 | UI | Los colores de "Pendiente" y "En preparación" se confundían | Media | Corregido (`en_preparacion` = #1565C0) |
| INC-005 | 06/11 | Web | El `Alert` de React Native no se ve en la versión web | Alta | Corregido (se usa `usarDialogos`) |
| INC-006 | 06/11 | UI | El menú del comprador mostraba "Alertas de stock", que contradice la regla de no mostrar existencias al comprador | Media | Corregido (se quitó la opción y la pantalla) |

---

## 3. Formato para reportar un error nuevo

```
## INC-XXX
Fecha: DD/MM/AAAA
Módulo: Catálogo / Inventario / Pedidos / Sustituciones / Pagos / API / Red
Dispositivo: iPhone 1 / iPhone 2 / Web
Gravedad: Crítica / Alta / Media / Baja
Qué pasó: ...
Pasos para reproducir: 1. ... 2. ... 3. ...
Se esperaba: ...
Salió: ...
Evidencia: captura de pantalla o log
Estado: Abierto / En corrección / Resuelto / Verificado
```

---

## 4. Lo que tiene que estar activo antes de cerrar las pruebas

- [X] `app.json` sin `extra.eas.projectId`
- [X] CLI de Expo con sesión (`npx expo whoami`)
- [X] Los dos iPhones con Expo Go en la misma cuenta
- [X] API corriendo (`cd api && npm start`, puerto 3001)
- [X] Web entrando por `http://<IP>:8081` (tecla `w` en Metro)
- [X] `usarDialogos` en las pantallas que muestran avisos (Carrito, Registro, DetalleProducto, TarjetaTicket)
- [X] El botón "Ver pedido" escondido cuando el carrito está vacío
- [X] El borrado de pedidos es lógico y el comprador ve el aviso
- [X] El ticket muestra si el pedido está pagado y "Preparar" se bloquea si no

---

## 5. Cierre de la fase

Cuando no queden casos sin pasar ni incidencias abiertas:

1. Completar `docs/VALIDACION_FINAL.md`.
2. Commit y push: `git add -A && git commit -m "..." && git push`.
3. Grabar el video del entregable con el guion acordado.
