// src/services/pedidoService.js
// Acceso remoto a pedidos mediante la API autenticada.
//
// Estructura del documento:
// {
//   usuarioId: string,
//   items: [{ productoId, nombre, precio, cantidad, unidad }],
//   total: number,
//   estado: "recibido" | "en_preparacion" | "listo" | "entregado" | "cancelado",
//   creadoEn: timestamp,
//   idCliente: string   // mismo id del documento; reintentar no duplica el pedido
// }
//
// Las reglas de stock y estado viven en la API, no en la interfaz móvil.

import { obtenerProducto } from "./catalogoService";
import { puedeCancelar, mensajeNoCancelable } from "../domain/estadosPedido";
import { aMillis } from "../utils/formato";
import { conTiempoLimite } from "../utils/conTiempoLimite";
import { apiRequest } from "./apiClient";

/**
 * Genera el id del documento antes de enviarlo.
 * Usar siempre el mismo id hace que un reintento de sincronización
 * no cree un segundo pedido.
 */
export function nuevoIdPedido() {
  return `ped_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Revisión previa de disponibilidad contra el catálogo vigente.
 * La vista pública del catálogo ya no trae existencias: esta revisión solo
 * aplica cuando el dispositivo tiene una copia con stock (caché antigua).
 * La comprobación definitiva de inventario y el descuento de stock los hace
 * el servidor dentro de la transacción al crear el pedido.
 * Las lecturas van en paralelo para no alargar la espera sin red.
 * Devuelve mensajes listos para mostrar; no escribe nada.
 */
export async function validarDisponibilidad(items) {
  const revisiones = await Promise.all(
    items.map(async (item) => {
      const productoActual = await obtenerProducto(item.productoId);
      const disponible = productoActual?.disponibilidad;
      if (disponible == null) return null; // sin dato público: valida el servidor
      if (Number(disponible) < item.cantidad) {
        return `"${productoActual.nombre}" solo tiene ${disponible} ${productoActual.unidad} disponibles.`;
      }
      return null;
    })
  );

  return revisiones.filter(Boolean);
}

/**
 * Crea el pedido en Firestore con un id ya definido.
 * No valida stock: eso lo hace quien llama, para poder encolar si no hay red.
 */
export async function crearPedidoRemoto({ id, usuarioId, items, total, generoComprador }) {
  return conTiempoLimite(apiRequest("/api/pedidos", { method: "POST", body: { id, items } }));
}

/**
 * Trae solo los pedidos del usuario autenticado y los deja en JSON plano.
 */
export async function listarPedidosDeUsuario(usuarioId) {
  const pedidos = await conTiempoLimite(apiRequest("/api/pedidos"));
  return pedidos.map((p) => ({ ...p, creadoEn: aMillis(p.creadoEn) || Date.now(), origen: "remoto", syncEstado: "sincronizado", syncMensaje: "" }));
}

/**
 * Convierte un documento de Firestore al modelo que usa la app y la caché.
 */
export function normalizarPedidoRemoto(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    usuarioId: data.usuarioId,
    items: data.items || [],
    total: data.total || 0,
    estado: data.estado || "recibido",
    creadoEn: aMillis(data.creadoEn) || Date.now(),
    origen: "remoto",
    syncEstado: "sincronizado",
    syncMensaje: "",
  };
}

/**
 * Cancela el pedido borrándolo de Firestore, si la regla lo permite
 * y el documento pertenece a este usuario.
 */
export async function cancelarPedidoRemoto({ pedidoId, usuarioId }) {
  return conTiempoLimite(apiRequest(`/api/pedidos/${encodeURIComponent(pedidoId)}/cancelar`, { method: "PATCH" }));
}
