/**
 * Caso de uso: cancelar un pedido con la regla del equipo.
 * Si el pedido todavía no salió del teléfono, se cancela en local y se
 * retira de la cola. Si ya está en Firestore, se encola la cancelación.
 */

import { mensajeNoCancelable, puedeCancelar } from "../domain/estadosPedido";
import {
  actualizarPedidoLocal,
  eliminarPedidoLocal,
  encolarAccion,
  leerColaLocal,
  leerPedidosLocal,
  retirarAccionesDelPedido,
} from "../data/repositorioLocal";
import { cancelarPedidoRemoto } from "../services/pedidoService";
import { esErrorDeRed } from "../utils/erroresRed";

/**
 * Cancela el pedido.
 * `sincronizar` es la función del contexto que vacía la cola si hay red.
 * Devuelve { ok, mensaje, pendiente }.
 */
export async function cancelarPedidoUsuario({ usuarioId, pedido, enLinea, sincronizar }) {
  if (!puedeCancelar(pedido?.estado)) {
    return { ok: false, pendiente: false, mensaje: mensajeNoCancelable(pedido?.estado) };
  }

  const cola = await leerColaLocal(usuarioId);
  const aunNoSeHaEnviado = cola.some(
    (accion) => accion.tipo === "confirmar_pedido" && accion.pedidoId === pedido.id
  );

  if (aunNoSeHaEnviado) {
    await retirarAccionesDelPedido(usuarioId, pedido.id);
    await eliminarPedidoLocal(usuarioId, pedido.id);
    return {
      ok: true,
      pendiente: false,
      irAlInicio: true,
      mensaje: "Pedido cancelado correctamente.",
    };
  }

  if (enLinea === true) {
    try {
      await cancelarPedidoRemoto({ pedidoId: pedido.id, usuarioId });
      await eliminarPedidoLocal(usuarioId, pedido.id);
      await retirarAccionesDelPedido(usuarioId, pedido.id);
      return {
        ok: true,
        pendiente: false,
        irAlInicio: true,
        mensaje: "Pedido cancelado correctamente.",
      };
    } catch (error) {
      if (error?.code === "permission-denied") {
        return {
          ok: false,
          pendiente: false,
          irAlInicio: false,
          mensaje: "No se pudo eliminar el pedido. En las reglas de Firestore agrega allow delete para pedidos.",
        };
      }
      if (!esErrorDeRed(error)) {
        return { ok: false, pendiente: false, irAlInicio: false, mensaje: error.message };
      }
    }
  }

  await actualizarPedidoLocal(usuarioId, pedido.id, {
    estado: "cancelado",
    syncEstado: "pendiente",
    syncTipo: "cancelar_pedido",
    syncMensaje: "Pendiente por sincronizar",
  });
  await encolarAccion(usuarioId, { tipo: "cancelar_pedido", pedidoId: pedido.id });

  if (enLinea === true && typeof sincronizar === "function") {
    try {
      await sincronizar();
    } catch (error) {
      if (!esErrorDeRed(error)) {
        return { ok: false, pendiente: true, irAlInicio: false, mensaje: error.message };
      }
    }

    const pedidos = await leerPedidosLocal(usuarioId);
    const actual = pedidos.find((item) => item.id === pedido.id);
    if (actual?.syncEstado === "error") {
      return { ok: false, pendiente: false, irAlInicio: false, mensaje: actual.syncMensaje };
    }
    if (!actual || actual.syncEstado === "sincronizado") {
      return {
        ok: true,
        pendiente: false,
        irAlInicio: true,
        mensaje: "Pedido cancelado correctamente.",
      };
    }
  }

  return {
    ok: true,
    pendiente: true,
    mensaje: "Sin conexión. La cancelación quedó pendiente por sincronizar.",
  };
}
