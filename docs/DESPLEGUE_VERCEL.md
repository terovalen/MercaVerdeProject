# Despliegue en Vercel

En Vercel van dos proyectos que salen del mismo repo de GitHub:

- **API** (carpeta `api/`): queda como una función serverless. Funciona igual que la API de la PC, solo que no escucha en un puerto: Vercel le pasa cada petición y la función contesta.
- **App web** (raíz del repo): la versión web de la app, armada con `npx expo export --platform web`, queda como página estática. Se abre en el navegador sin Metro ni PC encendida.

La app de los celulares no se despliega: Expo Go sigue conectando contra la PC igual que siempre. Lo que cambia es que la versión web ya no depende de la PC.

---

## Paso a paso

### 1. Verificar que el código ya está en GitHub

Deben estar en el repo para que Vercel los tome:

- `api/vercel.json`, que dice que `index.js` es la función serverless.
- `api/index.js` con la credencial por variable de entorno (`FIREBASE_SERVICE_ACCOUNT`).
- `src/services/apiClient.js` apuntando a `EXPO_PUBLIC_API_URL` cuando es web de producción.

Con el commit y el push queda.

### 2. Subir la API a Vercel

1. Entra a <https://vercel.com> con tu cuenta (se puede entrar con GitHub).
2. **Add New... > Project** e importa el repositorio.
3. Antes de dar **Deploy**, abre **Root Directory - Edit** y elige la carpeta `api`. Ahí Vercel lee el `vercel.json` de esa carpeta. Nombre sugerido del proyecto: `merca-verde-api`.
4. Abre **Environment Variables** y agrega:

   | Nombre | Valor |
   |---|---|
   | `FIREBASE_PROJECT_ID` | `mercaverde-2a8ad` |
   | `FIREBASE_SERVICE_ACCOUNT` | todo el contenido de `api/service.account.json` |
   | `CORS_ORIGIN` | `*` mientras se prueba; después lo cambias por la URL del proyecto web (paso 3) y haces Redeploy |

   En `FIREBASE_SERVICE_ACCOUNT` pega el JSON completo, desde la primera llave hasta la última, tal como está en el archivo. No hay que acomodar nada: Vercel lo guarda como esté y el código lo lee con `JSON.parse`.

   Ojo: esa clave es la identidad de administrador del proyecto de Firebase. Solo vive en las variables de este proyecto de Vercel, nunca subida al repo.

5. **Deploy**. Al terminar, la URL del proyecto (algo como `merca-verde-api.vercel.app`) debe responder:

   ```
   https://<tu-proyecto-api>.vercel.app/health   devuelve   {"ok":true}
   ```

   Si responde eso, la API está viva y conectada a Firestore. La prueba de fondo es abrir la app y ver que el catálogo carga.

### 3. Subir la app web a Vercel

1. **Add New... > Project** otra vez con el mismo repositorio. Esta vez el Root Directory queda vacío, en la raíz.
2. Configuración de build:

   | Campo | Valor |
   |---|---|
   | Framework Preset | Expo |
   | Build Command | `npx expo export --platform web` (lo llena el preset) |
   | Output Directory | `dist` |
   | Install Command | `npm install` (el que sugiera) |

   Ponle otro nombre al proyecto para que no choque con el de la API, por ejemplo `merca-verde`.
3. En **Environment Variables** agrega:

   | Nombre | Valor |
   |---|---|
   | `EXPO_PUBLIC_API_URL` | `https://<tu-proyecto-api>.vercel.app` |

   `EXPO_PUBLIC_API_URL` le dice a la app web dónde está la API, y como se lee al momento de compilar, hay que dejarla antes de dar Deploy. Si falta, la app carga pero no conecta con nada.

   Después, en el proyecto de la API cambia `CORS_ORIGIN` por la URL de este proyecto web (por ejemplo `https://merca-verde.vercel.app`), para que el navegador no bloquee las peticiones entre dominios, y haz **Redeploy** de la API.

4. **Deploy**. Al terminar abre la URL del proyecto (por ejemplo `https://merca-verde.vercel.app`): debe cargar el catálogo y el inicio de sesión de Firebase igual que en la PC. Ahí se prueba el flujo completo: carrito, pedido, pago, tickets.

### 4. Qué entender del despliegue

- La API en Vercel arranca fría en la primera petición de cada rato (2 a 4 segundos) y luego responde rápido. Es lo normal.
- Los cambios se suben solos: cada `git push` a `main` re-despliega los dos proyectos.
- La API local del puerto 3001 sigue sirviendo para la app de los celulares; nada de eso cambia.
- Para el video, la versión web desplegada es la más cómoda: se comparte el enlace y cada quien entra con su correo, sin encender la PC.

### 5. Si algo falla

| Síntoma | Causa probable | Arreglo |
|---|---|---|
| `/health` responde 500 o error de credenciales | `FIREBASE_SERVICE_ACCOUNT` mal pegada (cortada o de otro proyecto) | Revisar la variable, guardarla de nuevo y Redeploy |
| La app web carga pero no conecta | Falta `EXPO_PUBLIC_API_URL` o quedó con otra URL | Agregarla y hacer Deploy de nuevo |
| El navegador bloquea las peticiones (CORS) | `CORS_ORIGIN` de la API no apunta al dominio web | Poner la URL completa del proyecto web y Redeploy de la API |
| 403 en `/api/inventario` | No es error: la sesión es de comprador | Probar con cuenta de vendedor |
