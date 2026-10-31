import { auth } from "./firebaseConfig";
import Constants from "expo-constants";

function obtenerUrlApiLocal() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;
  const host = hostUri?.split(":")[0];
  return host ? `http://${host}:3001` : "http://localhost:3001";
}

// EXPO_PUBLIC_API_URL tiene prioridad para una API desplegada. En Expo Go,
// hostUri permite usar automáticamente la IP del computador que sirve el QR.
const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || obtenerUrlApiLocal()
).replace(/\/+$/, "");

export async function apiRequest(path, { method = "GET", body } = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Inicia sesión para continuar.");
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
  return data;
}
