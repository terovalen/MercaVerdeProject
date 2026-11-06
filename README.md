# MercaVerde

Aplicación móvil de pedidos para el mercado campesino y la cafetería del Tecnológico de Antioquia. Permite a los compradores armar pedidos del catálogo semanal, al vendedor gestionar inventario y pedidos, y al administrador consultar métricas del negocio. Funciona con conexión de red y también sin ella.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| App móvil | React Native + Expo (SDK 58), React Navigation, AsyncStorage |
| Servicios en la nube | Firebase (Authentication correo/contraseña, Firestore) |
| Backend | Node.js + Express con Firebase Admin SDK (puerto **3001**) |
| Seguridad | Verificación de token de Firebase en cada petición + permisos por rol |
| Métricas | Highcharts (versión web) y resumen en texto (Expo Go) |

## Arquitectura

La app móvil **nunca escribe directamente en Firestore**: todas las operaciones pasan por la API, que valida identidad, rol, stock y estados del pedido.

```
Expo Go (celular)          API Express (PC, :3001)         Firebase (nube)
├─ Catálogo sin stock  →   valida token y rol        →     Firestore
├─ Carrito local           /api/catalogo  (público)        usuarios
├─ Cola offline            /api/inventario (privado)       Productos
└─ Panel vendedor/admin    /api/pedidos, /api/productos…   pedidos
```

La API corre en la PC (`node index.js`) y el celular la consume por la red Wi-Fi local, por lo que **la PC debe estar encendida** para usar la app.

## Estado del proyecto

- **Entregable 1:** registro e inicio de sesión, catálogo desde Firestore, detalle de producto y creación de pedidos.
- **Entregable 2:** seguimiento del pedido con estados, búsqueda y filtros del catálogo, modo offline con cola de sincronización, y la funcionalidad emergente **FE-01** (alertas de stock).
- **Entregable actual:** separación de datos públicos/privados del inventario, permisos por rol en la API, validación de existencias en el servidor, sustituciones de productos, actualización del total y persistencia garantizada en Firestore.

## Funcionalidades por rol

### Comprador
- Registro público e inicio de sesión con correo y contraseña.
- Catálogo con búsqueda por nombre, filtro por categoría y rango de precio.
- **No ve el stock ni indicadores de agotado**: el catálogo es la vista pública del producto (nombre, descripción, precio, unidad, categoría, productor e imagen).
- Carrito persistente por usuario (sobrevive al cierre de la app).
- Detalle de producto, seguimiento de disponibilidad (FE-01) y alertas de stock.
- Confirmación de pedido: el servidor valida existencias en una transacción y rechaza la compra si no alcanza el inventario.
- Mis pedidos con estados y cancelación solo mientras el pedido esté `recibido`.

### Vendedor
- Panel de inventario con las existencias reales y **dos formas de ajustar el stock**: pasos rápidos ( **+** / **−** ) o **escribiendo la cantidad exacta** y presionando "Guardar".
- **Crear y editar productos con formulario** (nombre, descripción, precio, unidad, categoría, productor, disponibilidad): nadie escribe IDs de Firestore; el id lo asigna el servidor al crear y la app lo maneja internamente.
- **Imagen del producto por URL**: en el formulario se pega el enlace de una foto (como el de los productos ya cargados) y se guarda en `imagenUrl`; el catálogo la muestra con `<Image>`. No depende de Storage ni del plan del proyecto. La API también incluye `POST /api/productos/:id/imagen` por si el proyecto pasa a plan Blaze y se quiere subir fotos del teléfono a Storage.
- **Archivado de productos** (borrado lógico): sale del catálogo público pero se conserva en Firestore; la sección "Archivados" del panel permite restaurarlos con un toque.
- **Mensajes** claros de éxito, validaciones (nombre y precio obligatorios, cantidad entera mayor o igual a 0) y errores en cada acción.
- **Gestión de pedidos como tickets**: lista con filtros por estado (Activos, Esperando comprador, En preparación… con conteo), rango de fechas (hoy / 7 / 30 días) y búsqueda por id, comprador o producto. El detalle de cada ticket muestra comprador, productos con cantidades y precios, subtotal por línea, total y fecha.
- **Seguimiento del ticket**: línea de estados `recibido → en preparación → listo → entregado`, guía de acción por estado (cuándo puede prepararse, cuándo espera la respuesta del comprador a una propuesta) y botones de transición validados por la API.
- **Sustituciones sin IDs**: selector con búsqueda por nombre para elegir el producto de reemplazo; el ítem a reemplazar se elige tocando "Reemplazar" en la línea del producto (o automático si hay uno agotado) y la propuesta se confirma antes de enviarla al comprador.
- Al pasar a preparación, el servidor descuenta inventario de forma transaccional; si falta, la propuesta de reemplazo pasa por el comprador (el total se recalcula en el servidor).

### Administrador
- Todo lo del vendedor: ve y edita el inventario con + / − (sección al inicio de su panel).
- Dashboard de métricas (`/api/analitica`): pedidos por estado, pedidos por género, top 10 de productos más comprados y distribución de campos de los formularios.

## Datos públicos y privados del inventario

Este es el diseño central del módulo de seguridad del inventario:

- **`GET /api/catalogo`** responde la vista pública del producto mediante una lista blanca de campos (`vistaPublica`): nombre, descripción, precio, unidad, categoría, productor e imagen. El stock (`disponibilidad`) **nunca sale** del servidor hacia un comprador, ni siquiera como indicador de "agotado" o filtro "con stock".
- **`GET /api/inventario`** es el endpoint privado con existencias: protegido con `permitir("vendedor", "administrador")`. Un comprador o un visitante sin token recibe **403 / 401**.
- **`PATCH /api/productos/:id`** actualiza el stock de un producto; la API también reescribe el campo canónico y limpia variantes duplicadas (p. ej. `Disponibilidad ` con espacio) para que la consola, el panel y las validaciones vean siempre el mismo número.
- **Validación en el servidor:** al crear el pedido (`POST /api/pedidos`) y al separarlo (`en_preparacion`), la API verifica el stock dentro de una transacción de Firestore y lo descuenta de forma atómica. Los errores ("inventario insuficiente…") salen de la API, no de la app.

> El video de demostración de este módulo debe mostrar: catálogo del comprador sin stock, el **403** al pedir el inventario con un comprador, el inventario completo con edición desde el panel de vendedor/administrador, y el rechazo del servidor al confirmar más existencias de las que hay.

## Roles y permisos

La app separa el acceso en `comprador`, `vendedor` y `administrador` (los perfiles antiguos con rol `cliente` se interpretan como compradores).

| Operación | Sin sesión | Comprador | Vendedor | Administrador |
|---|:---:|:---:|:---:|:---:|
| Ver catálogo (`/api/catalogo`) | ❌ 401 | ✅ | ✅ | ✅ |
| Ver inventario (`/api/inventario`) | ❌ 401 | ❌ 403 | ✅ | ✅ |
| Crear / archivar productos (`POST`/`DELETE /api/productos`) | ❌ 401 | ❌ 403 | ✅ | ✅ |
| Editar stock (`PATCH /api/productos/:id`) | ❌ 401 | ❌ 403 | ✅ | ✅ |
| Crear / cancelar pedidos | ❌ 401 | ✅ | ❌ | ❌ |
| Gestionar pedidos y sustituciones | ❌ 401 | ❌ 403 | ✅ | ✅ |
| Métricas (`/api/analitica`) | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |

La creación de un comprador es pública mediante el registro de la app; el rol viene del **token de Firebase** verificado en el servidor, así que la app no puede mentir sobre quién es. Para convertir una cuenta en vendedor o administrador hay que editar `usuarios/{uid}.rol` en Firestore desde un entorno confiable.

## Estructura del proyecto

```
App.js                        # punto de entrada de Expo
src/
  domain/                     # reglas de negocio compartidas (filtros, estados, alertas)
  data/                       # caché local (AsyncStorage) y cola de acciones offline
  services/                   # acceso a la API y a Firebase; normalización de datos
  screens/                    # interfaces por rol (catálogo, carrito, operación…)
  context/                    # sesiones, carrito y estado de conexión
  components/                 # componentes reutilizables (etiquetas, filtros, gráficos)
  navigation/                 # cabecera y navegación por rol
  casosdeuso/                 # orquestación: confirmar pedido, cargar catálogo, seguimiento
api/
  index.js                    # API REST Express: catálogo, inventario, pedidos, productos
  .env / .env.example         # variables de entorno del backend
  service.account.json        # clave de servicio de Firebase (no compartir ni subir a Git)
firestore.rules               # reglas de seguridad de Firestore
```

## Endpoints de la API

Todas las rutas (excepto `/health`) exigen el encabezado `Authorization: Bearer <token-id-de-Firebase>`. Los permisos se validan contra el rol del perfil en Firestore.

| Método y ruta | Permiso | Descripción |
|---|---|---|
| `GET /health` | público | Verificación de que la API está viva |
| `GET /api/catalogo` | cualquier autenticado | Vista pública del catálogo **sin stock** |
| `GET /api/inventario` | vendedor, administrador | Vista normalizada con existencias y estado `activo` |
| `POST /api/productos` | vendedor, administrador | Crea un producto (el ID lo asigna Firestore, no se escribe a mano) |
| `PATCH /api/productos/:id` | vendedor, administrador | Actualiza campos (nombre, precio, stock escrito, activo…) |
| `DELETE /api/productos/:id` | vendedor, administrador | **Archiva** el producto (borrado lógico: sale del catálogo público) |
| `POST /api/productos/:id/imagen` | vendedor, administrador | Sube una foto del teléfono a Firebase Storage y deja la URL pública en `imagenUrl` |
| `POST /api/pedidos` | comprador | Crea el pedido validando y descontando stock (transacción) |
| `GET /api/pedidos` | todos autenticados | Comprador: solo los suyos. Personal: todos |
| `PATCH /api/pedidos/:id` | vendedor, administrador | Estados `en_preparacion`, `listo`, `entregado` |
| `PATCH /api/pedidos/:id/cancelar` | comprador | Solo si el pedido está `recibido` |
| `PATCH /api/pedidos/:id/propuesta` | vendedor, administrador | Propone sustituciones cuando falta inventario |
| `PATCH /api/pedidos/:id/respuesta-cambio` | comprador | Acepta o rechaza la propuesta; recalcula el total |
| `GET /api/analitica` | administrador | Métricas agregadas de pedidos, productos y usuarios |

## Colecciones de Firestore

| Colección | Uso | Campos principales |
|---|---|---|
| `usuarios` | Perfil creado al registrarse | nombre, correo, rol, género |
| `Productos` | Catálogo semanal | nombre, descripcion, precio, unidad, **disponibilidad** (privado), categoria, productor, imagenUrl, activo, creadoEn, actualizadoEn, archivadoEn (solo archivados) |
| `pedidos` | Pedidos confirmados | usuarioId, generoComprador, items[{productoId, nombre, precio, cantidad, unidad}], total, estado, creadoEn |

Estados de un pedido: `recibido` → `en_preparacion` → `listo` → `entregado` (y `cancelado` solo desde `recibido`; `cambio_pendiente` mientras hay sustitución en regla).

## Instalación y ejecución

> El proyecto ya tiene Firebase configurado (`mercaverde-2a8ad`), Authentication y Firestore con datos cargados. Con las credenciales incluidas no hace falta volverlo a configurar; al final queda la guía por si se crea un proyecto nuevo.

### Requisitos

- Node.js 18 o superior
- Expo Go instalado en el celular (misma versión del SDK que el proyecto, **58**) — o solo un navegador, con el **modo web** (ver abajo)
- PC y celular conectados a la **misma red Wi-Fi**

### Pasos

1. **Instalar dependencias** (raíz y API):

   ```bash
   npm install
   cd api && npm install
   ```

2. **Variables de entorno** (ya están creadas y casi no se tocan):

   - La app **deduce sola la IP de la PC** desde la conexión de Expo (`expo-constants`): cualquier PC y cualquier red funcionan sin editar archivos (`src/services/apiClient.js`).
   - `.env` (raíz): solo respaldo para la versión web o builds de producción (`localhost` por defecto).
   - `api/.env`: `PORT=3001`, `FIREBASE_PROJECT_ID`, `CORS_ORIGIN` y `GOOGLE_APPLICATION_CREDENTIALS=./service.account.json`.

3. **Iniciar la API** (terminal 1):

   ```bash
   cd api
   npm start
   ```

   Verificación: abre `http://localhost:3001/health` → debe responder `{"ok":true}`. Desde el celular, usa la misma IP de la PC que aparece en la terminal de Expo (`exp://192.168.x.x:8081`).

4. **Iniciar la app** (terminal 2, desde la raíz):

   ```bash
   npm start
   ```

   Escanea el **QR** con Expo Go. Si la app muestra datos viejos, arranca con caché limpia: `npm start -- --clear`.

5. **Crear usuario de pruebas:**

   - Regístrate desde la app (eso crea un **comprador**).
   - Para una cuenta de vendedor o administrador: en Firebase Console → Authentication, copia el **UID** del usuario, y en Firestore edita `usuarios/{uid}` con `rol: "vendedor"` o `"administrador"`.

### Cuentas de Expo (importante en iPhone físico)

Desde **Expo Go 57+** (política de Expo, sep 2026), al abrir un proyecto de desarrollo en un **iPhone físico**, Expo CLI (PC) y Expo Go (celular) deben estar logueados **con la misma cuenta de Expo**. Recomendado para el equipo:

1. En la PC: `npx expo login` con la cuenta del equipo.
2. En **cada** iPhone: Expo Go → ícono de cuenta → Log in con la **misma** cuenta.
3. `npm start -- --clear` y escanear el QR.

La cuenta de Expo Go es solo el "cargador" del proyecto: **no tiene nada que ver con las cuentas de MercaVerde**. Cada teléfono entra a la app con su propio correo de Firebase (uno como comprador, otro como vendedor, etc.). En **Android** y en el **modo web** no se exige ninguna cuenta de Expo.

### Modo web: acceso sin cuenta (navegador)

La app también corre como **web**: cualquier persona la abre en el navegador con solo la URL, sin Expo Go y sin cuenta de Expo (funciona igual en iPhone/Android/PC):

1. Con `npm start` corriendo, presiona **`w`** (Metro también sirve la versión web).
2. Comparte la URL: `http://<IP de la PC>:8081` (la IP que muestra la terminal de Expo).
3. Cada quien inicia sesión en MercaVerde con el correo de Firebase que tenga; mismo catálogo, carrito, tickets y panel.

La IP de la API se deduce del navegador solo (`src/services/apiClient.js`), así que funciona en cualquier PC y red sin editar archivos. El puerto 8081 también debe permitirlo el firewall de Windows en redes nuevas (misma regla que el 3001, del paso anterior).

### Limpiar procesos y puertos ( WINDOWS )

Si el puerto 3001 u 8081 quedan ocupados por una ejecución anterior:

```powershell
taskkill /F /IM node.exe
```

### Firewall de Windows (solo la primera vez en una PC nueva)

La primera vez que la API arranca, Windows pregunta "¿Permitir acceso a…?": hay que aceptar marcando **tanto redes privadas como públicas**, o el celular no podrá llegar al puerto 3001 aunque la API esté corriendo. Si ya se rechazó, se agrega la regla a mano (PowerShell como administrador):

```powershell
netsh advfirewall firewall add rule name="MercaVerde API 3001" dir=in action=allow protocol=TCP localport=3001
```

## Cómo probar

### Flujo comprador (sin ver stock)

1. Entra con la cuenta de comprador: el catálogo muestra nombre, precio, unidad y categoría — **sin stock ni "Agotado"**.
2. Solicita `http://<IP de la PC>:3001/api/inventario` con el token de un comprador: la API responde **403**.
3. Agrega productos al carrito y confirma una cantidad mayor al stock real: el servidor rechaza con *"inventario insuficiente (disponible N)"*.
4. Confirma un pedido válido: aparece en **Mis pedidos** como `recibido` y se puede cancelar.

### Flujo vendedor / administrador

1. Entra con la cuenta con ese rol: el panel muestra el inventario con existencias y botones **+ / −**.
2. Cambia el stock de un producto: se guarda en Firestore (documento `Productos`) y se consolida en el campo único `disponibilidad`.
3. Gestiona un pedido: al dar **Preparar**, el descuento de inventario es transaccional; si falta, usa **Proponer reemplazo por stock** y espera la respuesta del comprador.

### Modo avión (offline)

1. Con internet, abre el catálogo (descarga la copia local) y arma un carrito; mata y vuelve a abrir la app: el carrito persiste.
2. Activa modo avión: catálogo, pedidos y alertas siguen visibles con el indicador "Sin conexión". No se queda cargando.
3. Confirma un pedido sin red: queda **"Pendiente por sincronizar"**; al volver la red, la cola se envía a Firestore automáticamente (reintento con el mismo id: no se duplica).
4. Cierra sesión: se borra el carrito y los datos locales de ese usuario.

## Seguridad

- La clave de servicio (`api/service.account.json`) es la identidad de administrador del proyecto: **no compartirla, no subirla a Git**.
- `firestore.rules` bloquea la escritura de `Productos` desde clientes: solo la API (Admin SDK) puede modificar el catálogo.
- El stock, la validación de pedidos y los permisos viven en el servidor; la app móvil solo consume resultados, así que ningún dato privado ni lógica crítica depende del teléfono.
- Soporte en producción: desplegar la API en un servicio HTTPS, configurar el CORS a dominios conocidos y cambiar `EXPO_PUBLIC_API_URL` por la URL pública.

## Créditos

- Investigación de campo y hallazgos de origen: `docs/investigacion/matriz-trazabilidad.md`.
- Módulo de seguridad del inventario y permisos por rol: implementación sobre la API de autores previos.
