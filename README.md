# MercaVerde

App de pedidos para el mercado campesino y la cafetería del Tecnológico de Antioquia. El comprador arma su pedido del catálogo semanal, el vendedor organiza inventario y despacha, y el administrador mira cómo va el negocio. La app también sirve para trabajar sin señal: lo que ya se descargó queda disponible y lo que se hizo sin red se manda sola cuando vuelve la conexión.

## Con qué está hecha

| Capa | Tecnología |
|---|---|
| App móvil | React Native + Expo (SDK 58), React Navigation, AsyncStorage |
| Nube | Firebase (Authentication con correo y contraseña, Firestore) |
| Backend | Node.js + Express con Firebase Admin SDK (puerto **3001**) |
| Seguridad | Token de Firebase verificado en cada petición + permisos por rol |
| Métricas | Highcharts en web y resumen en texto en Expo Go |

## Cómo funciona

La app nunca escribe directo en Firestore. Todo pasa por la API, que es la que sabe quién es el usuario, qué rol tiene, cuántas existencias hay y en qué estado va cada pedido.

```
Expo Go (celular)          API Express (PC, :3001)         Firebase (nube)
├─ Catálogo sin stock  →   valida token y rol        →     Firestore
├─ Carrito local           /api/catalogo  (público)        usuarios
├─ Cola offline            /api/inventario (privado)       Productos
└─ Panel vendedor/admin    /api/pedidos, /api/productos…   pedidos
```

La API corre en la PC y el celular la alcanza por el Wi-Fi de la casa, así que **la PC tiene que estar encendida** mientras se usa la app.

## Qué hace cada rol

### Comprador

- Se registra con correo y contraseña, sin que nadie lo apruebe.
- Catálogo con búsqueda por nombre, filtro por categoría y rango de precio.
- **No ve el stock**: el catálogo devuelve solo lo público del producto (nombre, descripción, precio, unidad, categoría, productor e imagen). Tampoco hay indicadores de "agotado" ni filtro "con stock".
- Carrito que se queda entre sesiones (se guarda en el dispositivo).
- Ficha del producto con la opción de **Seguir disponibilidad** (FE-01), para tener a mano los productos que le importan.
- Al confirmar el pedido, el servidor revisa existencias en una transacción: si no alcanza, la compra se rechaza y se explica por qué.
- **Mis pedidos** con los estados y la cancelación, que solo se puede hacer mientras el pedido está en `pendiente`.
- **Pasarela de pagos**: dentro de la tarjeta de cada pedido hay una cajita con el estado del pago ("Pedido pendiente de pago" o "Pedido pagado") y, si falta pagar, el botón **Pagar**. Ese botón abre la pantalla con tres métodos (efectivo, tarjeta débito/crédito y PSE); se elige uno, queda marcado como "Seleccionado" y al confirmar sale el comprobante con referencia, fecha, método, productos, cantidades y total.

### Vendedor

- Panel de inventario con las existencias reales y dos maneras de ajustarlas: los botones **+** / **−** o escribiendo la cantidad exacta y Guardando.
- **Crear y editar productos con formulario** (nombre, descripción, precio, unidad, categoría, productor, disponibilidad). Nadie escribe IDs de Firestore: el id lo pone el servidor al crear y la app lo maneja por dentro.
- **Imagen del producto por URL**: en el formulario se pega el enlace de una foto (como el de los productos ya cargados) y queda en `imagenUrl`, que el catálogo muestra con `<Image>`. Así no dependemos de Storage ni del plan del proyecto. Igual quedó el endpoint `POST /api/productos/:id/imagen` por si más adelante el proyecto pasa a Blaze y se quiere subir la foto desde el teléfono.
- **Archivar productos** (borrado lógico): el producto sale del catálogo pero se conserva en Firestore, y desde la sección "Archivados" del panel se restaura con un toque.
- Avisos claros de éxito, de validación (nombre y precio obligatorios, cantidad entera mayor o igual a 0) y de error en cada acción.
- **Pedidos como tickets**: lista con filtros por estado (Activos, Esperando comprador, En preparación… con conteo), rango de fechas (hoy / 7 / 30 días) y búsqueda por id, comprador o producto. Al abrir el detalle se ve el comprador, los productos con cantidad y precio, el subtotal de cada línea, el total y la fecha.
- **Seguimiento del ticket**: la línea `pendiente → en_preparacion → listo → entregado`, una guía que dice en cada estado qué toca hacer, y los botones de cambio de estado, que los valida la API.
- **Sustituciones sin IDs**: se busca el producto de reemplazo por nombre, se elige la línea a reemplazar tocando "Reemplazar" y la propuesta se confirma antes de mandarse al comprador. Si hay un producto agotado, la línea se propone sola.
- Al pasar a preparación el servidor descuenta inventario de forma transaccional; si algo falta, la sustitución pasa por el comprador y el total se recalcula en el servidor.
- **Estado de pago en el ticket**: la cajita del ticket dice "Pagado" o "No pagado". El botón **Preparar** se queda deshabilitado mientras el pedido no esté pagado, y el servidor tampoco lo deja avanzar.

### Administrador

- Todo lo del vendedor, más el dashboard de métricas (`/api/analitica`): pedidos por estado, pedidos por género, los 10 productos más comprados y cómo están repartidos los campos de los formularios.

## El inventario: qué se ve y qué no

Esta parte fue el punto de más cuidado del módulo.

- **`GET /api/catalogo`** arma el producto con una lista blanca (`vistaPublica`): nombre, descripción, precio, unidad, categoría, productor e imagen. El campo `disponibilidad` no sale nunca hacia un comprador.
- **`GET /api/inventario`** es el endpoint privado con existencias, con `permitir("vendedor", "administrador")`. Un comprador o alguien sin token recibe 403 o 401.
- **`PATCH /api/productos/:id`** actualiza el stock y deja el campo canónico. También borra las variantes que quedaron de antes (por ejemplo `Disponibilidad ` con espacio final), para que la consola, el panel y las validaciones lean siempre el mismo número.
- **La validación vive en el servidor**: al crear el pedido y al separarlo, la API mira el stock dentro de una transacción de Firestore y lo descuenta de forma atómica. El mensaje "inventario insuficiente…" lo arma la API, no la app.

Para el video de este módulo conviene mostrar: el catálogo del comprador sin stock, el 403 al pedir el inventario con sesión de comprador, el inventario completo desde el panel y el rechazo del servidor cuando se piden más unidades de las que hay.

## Roles y permisos

Hay tres roles: `comprador`, `vendedor` y `administrador`. Los perfiles viejos con rol `cliente` se leen como compradores.

| Operación | Sin sesión | Comprador | Vendedor | Administrador |
|---|:---:|:---:|:---:|:---:|
| Ver catálogo (`/api/catalogo`) | ❌ 401 | ✅ | ✅ | ✅ |
| Ver inventario (`/api/inventario`) | ❌ 401 | ❌ 403 | ✅ | ✅ |
| Crear / archivar productos | ❌ 401 | ❌ 403 | ✅ | ✅ |
| Editar stock (`PATCH /api/productos/:id`) | ❌ 401 | ❌ 403 | ✅ | ✅ |
| Crear / cancelar pedidos | ❌ 401 | ✅ | ❌ | ❌ |
| Gestionar pedidos y sustituciones | ❌ 401 | ❌ 403 | ✅ | ✅ |
| Métricas (`/api/analitica`) | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |

El rol sale del token de Firebase que verifica el servidor, así que la app no puede inventar quién es. El registro público siempre deja como comprador; para pasar una cuenta a vendedor o administrador hay que editar `usuarios/{uid}.rol` en Firestore desde un entorno confiable.

## Estructura del proyecto

```
App.js                        # punto de entrada de Expo
src/
  domain/                     # reglas de negocio compartidas (filtros, estados de pedido)
  data/                       # caché local (AsyncStorage) y cola de acciones offline
  services/                   # acceso a la API y a Firebase; normalización de datos
  screens/                    # interfaces por rol (catálogo, carrito, operación…)
  context/                    # sesión, carrito y estado de conexión
  components/                 # componentes reutilizables (etiquetas, filtros, gráficos)
  navigation/                 # navegación por rol
  casosdeuso/                 # orquestación: confirmar pedido, cargar catálogo, seguimiento
api/
  index.js                    # API REST Express: catálogo, inventario, pedidos, productos
  .env / .env.example         # variables de entorno del backend
  service.account.json        # clave de servicio de Firebase (no compartir ni subir a Git)
firestore.rules               # reglas de seguridad de Firestore
docs/                         # matriz de pruebas, guía de ejecución, registro de errores
```

## Endpoints de la API

Todas las rutas menos `/health` piden el encabezado `Authorization: Bearer <token-id-de-Firebase>`. El permiso se revisa contra el rol que está en Firestore.

| Método y ruta | Permiso | Qué hace |
|---|---|---|
| `GET /health` | público | Dice si la API está viva |
| `GET /api/catalogo` | cualquiera con sesión | Catálogo sin stock |
| `GET /api/inventario` | vendedor, administrador | Inventario normalizado, con existencias y `activo` |
| `POST /api/productos` | vendedor, administrador | Crea un producto (el id lo pone Firestore) |
| `PATCH /api/productos/:id` | vendedor, administrador | Actualiza campos (nombre, precio, stock, activo…) |
| `DELETE /api/productos/:id` | vendedor, administrador | Archiva el producto (borrado lógico) |
| `POST /api/productos/:id/imagen` | vendedor, administrador | Sube la foto a Storage y deja la URL en `imagenUrl` |
| `POST /api/pedidos` | comprador | Crea el pedido validando y descontando stock |
| `GET /api/pedidos` | cualquiera con sesión | El comprador ve los suyos; el personal ve todos |
| `GET /api/pedidos/:id` | dueño, vendedor, administrador | Detalle de un pedido (lo carga la pasarela de pagos) |
| `PATCH /api/pedidos/:id/pagar` | comprador (dueño) | Marca el pedido como pagado |
| `PATCH /api/pedidos/:id` | vendedor, administrador | Cambia el estado del pedido (preparar exige pago) |
| `PATCH /api/pedidos/:id/cancelar` | comprador | Solo mientras el pedido está en `pendiente` |
| `PATCH /api/pedidos/:id/propuesta` | vendedor, administrador | Propone sustituciones cuando falta inventario |
| `PATCH /api/pedidos/:id/respuesta-cambio` | comprador | Acepta o rechaza la propuesta y recalcula el total |
| `GET /api/analitica` | administrador | Métricas de pedidos, productos y usuarios |

## Colecciones de Firestore

| Colección | Para qué | Campos |
|---|---|---|
| `usuarios` | Perfil que se crea al registrarse | nombre, correo, rol, género |
| `Productos` | Catálogo semanal | nombre, descripcion, precio, unidad, **disponibilidad** (privada), categoria, productor, imagenUrl, activo, creadoEn, actualizadoEn, archivadoEn |
| `pedidos` | Pedidos confirmados | usuarioId, generoComprador, items[{productoId, nombre, precio, cantidad, unidad}], total, estado, **pagado**, creadoEn |

Los estados de un pedido son `pendiente → en_preparacion → listo → entregado`; `cancelado` solo se puede pedir desde `pendiente`, y `cambio_pendiente` aparece mientras hay una sustitución en regla.

## Cómo correrlo

El proyecto ya tiene Firebase configurado (`mercaverde-2a8ad`), con Authentication y Firestore y datos cargados. Con las credenciales que ya están no hay que configurar nada; al final queda la guía por si algún día se crea un proyecto nuevo.

### Lo que se necesita

- Node.js 18 o superior
- Expo Go en el celular (versión 58, la del SDK del proyecto) o solo un navegador, usando el modo web que aparece más abajo
- PC y celular en la misma red Wi-Fi

### Pasos

1. **Instalar dependencias** (raíz y API):

   ```bash
   npm install
   cd api && npm install
   ```

2. **Variables de entorno** (ya están, y casi no se tocan):

   - La app **saca sola la IP de la PC** de la conexión de Expo (`expo-constants`). Así funciona en cualquier PC y en cualquier red sin editar archivos (`src/services/apiClient.js`).
   - `.env` (raíz): solo de respaldo para web o builds de producción; por defecto `localhost`.
   - `api/.env`: `PORT=3001`, `FIREBASE_PROJECT_ID`, `CORS_ORIGIN` y `GOOGLE_APPLICATION_CREDENTIALS=./service.account.json`.

3. **Levantar la API** (terminal 1):

   ```bash
   cd api
   npm start
   ```

   Para verificar: `http://localhost:3001/health` tiene que responder `{"ok":true}`. Desde el celular se usa la IP de la PC que sale en la terminal de Expo (`exp://192.168.x.x:8081`).

4. **Levantar la app** (terminal 2, desde la raíz):

   ```bash
   npm start
   ```

   Se escanea el QR con Expo Go. Si salen datos viejos, arranca con `npm start -- --clear`.

5. **Crear las cuentas de prueba**:

   - Regístrate desde la app: eso deja una cuenta de **comprador**.
   - Para una de vendedor o administrador: en Firebase Console → Authentication copia el **UID** del usuario, y en Firestore editas `usuarios/{uid}` con `rol: "vendedor"` o `"administrador"`.

### Cuentas de Expo en iPhone físico

Desde **Expo Go 57+** (política de Expo, septiembre 2026), al abrir un proyecto de desarrollo en un **iPhone físico**, Expo CLI (en la PC) y Expo Go (en el celular) tienen que estar logueados **con la misma cuenta de Expo**. Lo que usamos:

1. En la PC: `npx expo login` con la cuenta del equipo.
2. En **cada** iPhone: Expo Go → ícono de cuenta → Log in con la **misma** cuenta.
3. `npm start -- --clear` y escanear el QR.

La cuenta de Expo Go es solo el "cargador" del proyecto y no tiene nada que ver con las cuentas de MercaVerde. Cada teléfono entra a la app con su propio correo de Firebase (uno de comprador, otro de vendedor, etc.). En **Android** y en **modo web** no hace falta cuenta de Expo.

### Modo web (sin cuenta de Expo)

La app también corre en el navegador. Cualquiera la abre con la URL, sin Expo Go y sin cuenta de Expo, y funciona igual en iPhone, Android o PC:

1. Con `npm start` corriendo, presiona **`w`** (Metro también sirve la versión web).
2. Comparte `http://<IP de la PC>:8081`, que es la IP que muestra la terminal de Expo.
3. Cada quien entra con el correo de Firebase que tenga: mismo catálogo, mismo carrito, mismos tickets y mismo panel.

La IP de la API se deduce del navegador (`src/services/apiClient.js`), así que funciona en cualquier PC sin editar nada. Ojo con el firewall: el puerto 8081 también tiene que estar abierto, igual que el 3001.

### Si los puertos quedan ocupados (Windows)

```powershell
taskkill /F /IM node.exe
```

### Firewall de Windows (solo la primera vez en cada PC)

La primera vez que la API arranca, Windows pregunta si deja entrar. Hay que aceptar marcando **redes privadas y públicas**, o el celular no alcanza el puerto 3001 aunque la API esté corriendo. Si ya se respondió que no, la regla se agrega a mano (PowerShell como administrador):

```powershell
netsh advfirewall firewall add rule name="MercaVerde API 3001" dir=in action=allow protocol=TCP localport=3001
```

## Cómo probarlo

### Comprador (sin ver stock)

1. Entra con una cuenta de comprador: el catálogo muestra nombre, precio, unidad y categoría, **sin stock ni "Agotado"**.
2. Pide `http://<IP de la PC>:3001/api/inventario` con el token de un comprador: la API responde 403.
3. Arma un pedido con más unidades de las que hay: el servidor responde *"inventario insuficiente (disponible N)"*.
4. Confirma un pedido que sí alcanza: sale en **Mis pedidos** y se puede cancelar.

### Vendedor o administrador

1. Entra con una cuenta de ese rol: el panel muestra el inventario con existencias y los botones **+ / −**.
2. Cambia el stock de un producto: se guarda en Firestore (documento `Productos`) y queda en el campo único `disponibilidad`.
3. Toma un pedido: al dar **Preparar** el descuento de inventario es transaccional; si falta algo, proposes el reemplazo y esperas la respuesta del comprador.

### Pagos

1. Confirma un pedido: dentro de la tarjeta del pedido aparece la cajita "Pedido pendiente de pago" con el botón **Pagar**.
2. Toca **Pagar**: se abre la pasarela con Efectivo, Tarjeta débito/crédito y PSE. Si no eliges método, el botón avisa "Selecciona un método".
3. Eliges uno: queda marcado como "Seleccionado" y se habilita el botón **Pagar**. Al confirmar aparece el comprobante (referencia, fecha, método, productos, cantidades y total).
4. Como vendedor, en **Tickets** la cajita del ticket dice "Pagado" y el botón **Preparar** se habilita. Si el pedido no está pagado, el botón está deshabilitado y el servidor responde *"El pedido debe estar pagado antes de preparar."*.

### Modo avión (offline)

1. Con internet, abre el catálogo y arma un carrito; cierra la app y vuelve a abrirla: el carrito sigue ahí.
2. Activa modo avión: catálogo y pedidos se siguen viendo con el indicador "Sin conexión". No se queda cargando.
3. Confirma un pedido sin red: queda **"Pendiente por sincronizar"** y, cuando vuelve la señal, la cola se manda sola a Firestore (con el mismo id, para que no se duplique).
4. Cierra sesión: se borra el carrito y los datos locales de ese usuario.

## Seguridad

- La clave de servicio (`api/service.account.json`) es la identidad de administrador del proyecto: no se comparte y no se sube a Git.
- `firestore.rules` no deja escribir en `Productos` desde el celular: solo la API (Admin SDK) puede cambiar el catálogo.
- El stock, la validación de los pedidos y los permisos están en el servidor. La app solo consume resultados, así que ningún dato privado depende del teléfono.
- Para producción: la API en un servicio HTTPS, `CORS_ORIGIN` apuntando a los dominios de uno y `EXPO_PUBLIC_API_URL` con la URL pública.

## Créditos

Proyecto del curso de merchandising y transformación digital. Firebase, Expo y React Native son herramientas de sus respectivos dueños.
