// src/services/productosService.js
// Gestión del inventario mediante la API autenticada (solo vendedor/admin).
//
// Nadie escribe IDs de Firestore a mano: crear devuelve el id generado por
// el servidor y las demás operaciones van sobre un producto ya existente.

import { apiRequest } from "./apiClient";

/** Crea un producto y devuelve la respuesta (incluye el id asignado). */
export function crearProducto(datos) {
  return apiRequest("/api/productos", { method: "POST", body: datos });
}

/** Actualiza cualquier campo de un producto (nombre, precio, stock, imagenUrl…). */
export function actualizarProducto(id, datos) {
  return apiRequest(`/api/productos/${encodeURIComponent(id)}`, { method: "PATCH", body: datos });
}

/** Archivado lógico: sale del catálogo público pero se conserva en Firestore. */
export function archivarProducto(id) {
  return apiRequest(`/api/productos/${encodeURIComponent(id)}`, { method: "DELETE", body: {} });
}
