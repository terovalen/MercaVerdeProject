/**
 * Caso de uso: confirmar un pedido.
 * Con red lo escribe en Firestore. Sin red (o si la red falla a mitad)
 * lo guarda en el dispositivo y lo deja en la cola de sincronización.
 */

import {
  encolarAccion,
  upsertPedidoLocal,
} from "../data/repositorioLocal";
import {
  crearPedidoRemoto,
  nuevoIdPedido,
  validarDisponibilidad,
} from "../services/pedidoService";
import { esErrorDeRed } from "../utils/erroresRed";
import { conTiempoLimite } from "../utils/conTiempoLimite";

/**
 * Arma el objeto de pedido que comparten la caché y la interfaz.
 */
function construirPedido({ id, usuarioId, items, total, syncEstado, origen, syncMensaje, syncTipo }) {
  return {
    id,
    usuarioId,
    items,
    total,
    estado: "recibido",
    creadoEn: Date.now(),
    origen,
    syncEstado,
    syncTipo: syncTipo || "",
    syncMensaje: syncMensaje || "",
  };
}

/**
 * Copia los ítems del carrito para que un cambio posterior del carrito
 * no altere el pedido ya guardado.
 */
function congelarItems(items) {
  return items.map((item) => ({
    productoId: item.productoId,
    nombre: item.nombre,
    precio: Number(item.precio) || 0,
    cantidad: Number(item.cantidad) || 0,
    unidad: item.unidad,
  }));
}

/**
 * Confirma el pedido del usuario.
 * Devuelve { ok, pedido, mensaje, pendiente }.
 * `pendiente` verdadero significa que quedó marcado para sincronizar.
 */
export async function confirmarPedidoUsuario({ usuarioId, generoComprador, items, enLinea }) {
  if (!items?.length) {
    return {
      ok: false,
      pedido: null,
      pendiente: false,
      mensaje: "Agrega al menos un producto antes de confirmar.",
    };
  }

  const snapshot = congelarItems(items);
  const total = snapshot.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const id = nuevoIdPedido();

  if (enLinea === true) {
    try {
      const errores = await conTiempoLimite(validarDisponibilidad(snapshot), 8000);
      if (errores.length > 0) {
        return { ok: false, pedido: null, pendiente: false, mensaje: errores.join(" ") };
      }

      const remoto = await crearPedidoRemoto({ id, usuarioId, items: snapshot, total, generoComprador });
      const itemsConfirmados = remoto.items || snapshot;
      const pedido = construirPedido({
        id,
        usuarioId,
        items: itemsConfirmados,
        total: remoto.total ?? total,
        syncEstado: "sincronizado",
        origen: "remoto",
        syncTipo: "",
      });
      await upsertPedidoLocal(usuarioId, pedido);
      return { ok: true, pedido, pendiente: false, mensaje: "Pedido registrado." };
    } catch (error) {
      if (!esErrorDeRed(error)) {
        return {
          ok: false,
          pedido: null,
          pendiente: false,
          mensaje: error.message || "No se pudo confirmar el pedido.",
        };
      }
    }
  }

  const pedido = construirPedido({
    id,
    usuarioId,
    items: snapshot,
    total,
    syncEstado: "pendiente",
    origen: "local",
    syncTipo: "confirmar_pedido",
    syncMensaje: "Pendiente por sincronizar",
  });
  await upsertPedidoLocal(usuarioId, pedido);
  await encolarAccion(usuarioId, { tipo: "confirmar_pedido", pedidoId: id });

  return {
    ok: true,
    pedido,
    pendiente: true,
    mensaje: "Pedido guardado en este dispositivo. Quedó pendiente por sincronizar.",
  };
}
