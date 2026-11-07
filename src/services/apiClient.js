import { auth } from "./firebaseConfig";

/**
 * Resuelve la dirección de la API sin tocar ningún archivo de configuración.
 *
 * En desarrollo con Expo Go, la app se conecta a Metro desde la IP de la PC.
 * La API vive en esa misma PC en el puerto 3001.
 *
 * Orden de decisión:
 * 1. En web: si hay una EXPO_PUBLIC_API_URL de producción (https), esa manda.
 *    Si no, el hostname del navegador (la PC que corre Metro).
 * 2. En móvil nativo: intentar leer expo-constants (Constants.expoConfig.hostUri).
 * 3. localhost (simulador o respaldo).
 */
const PUERTO_API = process.env.EXPO_PUBLIC_API_PORT || "3001";

function resolverBaseUrl() {
  // 1. Web (navegador). En desarrollo la app llega de Metro en la PC y la API
  //    vive en esa misma PC. En producción (despliegue) la dirección de la
  //    API viene en EXPO_PUBLIC_API_URL, que se fija en Vercel antes de compilar.
  if (typeof window !== "undefined" && window.location?.hostname) {
    const enLaNube = process.env.EXPO_PUBLIC_API_URL;
    if (enLaNube && enLaNube.startsWith("https://")) {
      return enLaNube.replace(/\/+$/, "");
    }
    const h = window.location.hostname;
    if (h && h !== "localhost" && h !== "127.0.0.1") {
      return `http://${h}:${PUERTO_API}`;
    }
    return `http://localhost:${PUERTO_API}`;
  }

  // 2. Móvil nativo: intentar usar expo-constants (solo disponible en móvil).
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expoConstants = require("expo-constants");
    const anfitrion = expoConstants.expoConfig?.hostUri;
    if (typeof anfitrion === "string" && anfitrion.length > 0) {
      let limpio = anfitrion.replace(/^[a-z]+:\/\//i, "");
      const ip = limpio.split(":")[0];
      if (ip && ip !== "exp" && ip !== "localhost" && ip.length > 0) {
        return `http://${ip}:${PUERTO_API}`;
      }
    }
  } catch {
    // expo-constants no disponible en este entorno
  }

  // 3. localhost (respaldo)
  return `http://localhost:${PUERTO_API}`;
}

const BASE_URL = resolverBaseUrl();

export async function apiRequest(path, { method = "GET", body, sinToken = false } = {}) {
  let token = null;
  if (!sinToken) {
    token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Inicia sesión para continuar.");
  }
  let response;
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    const error = new Error(
      "No se pudo conectar con el servidor de MercaVerde. Revisa que la API esté corriendo (cd api && npm start) y que el celular esté en el mismo Wi-Fi que la PC."
    );
    error.esDeRed = true;
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
  return data;
}

