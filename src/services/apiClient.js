import Constants from "expo-constants";
import { auth } from "./firebaseConfig";

/**
 * Resuelve la dirección de la API sin tocar ningún archivo de configuración.
 *
 * En desarrollo con Expo Go, la app se conecta a Metro desde la IP de la PC
 * (Constants.expoConfig.hostUri, p. ej. "192.168.10.18:8081"). La API vive
 * en esa misma PC en el puerto 3001, así que se deduce: cualquier PC y
 * cualquier red funcionan sin editar .env.
 *
 * Orden de decisión:
 * 1. IP deducida de la conexión de Expo (ideal en desarrollo).
 * 2. IP deducida del navegador (versión web: quien abre la página la recibió
 *    de la PC que corre Metro, la misma que corre la API).
 * 3. EXPO_PUBLIC_API_URL del .env (builds de producción, donde ya no hay
 *    conexión de Metro que deducir).
 * 4. localhost (simulador o respaldo).
 */
const PUERTO_API = process.env.EXPO_PUBLIC_API_PORT || "3001";

function resolverBaseUrl() {
  const anfitrion = Constants.expoConfig?.hostUri; // ej: "192.168.10.18:8081"
  const ip = typeof anfitrion === "string" ? anfitrion.split(":")[0] : undefined;
  if (ip) return `http://${ip}:${PUERTO_API}`;
  // Web (navegador): el navegador recibió la app de la PC que corre Metro,
  // que es la misma que corre la API. Cualquier PC y red funcionan igual.
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:${PUERTO_API}`;
  }
  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
}

const BASE_URL = resolverBaseUrl();

export async function apiRequest(path, { method = "GET", body } = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Inicia sesión para continuar.");
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    // fetch solo lanza cuando la petición no salió: API apagada,
    // IP que cambió o el celular en otra red. Se avisa para que
    // quien ejecuta revise eso y no lo confunda con un error de la app.
    const error = new Error(
      "No hay conexión con el servidor de MercaVerde. Revisa que la API esté corriendo (cd api && npm start) y que el celular esté en el mismo Wi-Fi que la PC."
    );
    error.esDeRed = true;
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
  return data;
}
