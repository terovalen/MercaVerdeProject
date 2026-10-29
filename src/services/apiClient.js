import { auth } from "./firebaseConfig";

// Set EXPO_PUBLIC_API_URL to the deployed API origin. Local devices need the
// computer's LAN address, not localhost.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

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
