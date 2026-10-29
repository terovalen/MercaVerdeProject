/**
 * Sincronización de la cola local hacia Firestore.
 * Se procesa en orden (FIFO). Un fallo de red detiene la cola
 * para reintentar completa cuando vuelva la conexión.
 * Un fallo de regla de negocio marca el pedido y no se reintenta.
 */

import {
  actualizarPedidoLocal,
  eliminarPedidoLocal,
  encolarAccion,
  guardarColaLocal,
  leerColaLocal,
  leerPedidosLocal,
} from "../data/repositorioLocal";
import {
  cancelarPedidoRemoto,
  crearPedidoRemoto,
  validarDisponibilidad,
} from "../services/pedidoService";
import { esErrorDeRed } from "../utils/erroresRed";

let procesoActivo = null;

/**
 * Evita dos sincronizaciones paralelas del mismo arreglo de acciones.
 * Si ya hay una en curso, quien llama espera esa misma promesa.
 */
export function procesarCola(usuarioId) {
  if (!usuarioId) return Promise.resolve({ pendientes: 0 });
  if (procesoActivo) return procesoActivo;
  procesoActivo = ejecutarCola(usuarioId).finally(() => {
    procesoActivo = null;
  });
  return procesoActivo;
}

/**
 * Recorre la cola. Las acciones que no se pudieron enviar por red
 * se vuelven a guardar, en el mismo orden.
 */
async function ejecutarCola(usuarioId) {
  const cola = await leerColaLocal(usuarioId);
  const restantes = [];
  let frenarPorRed = false;

  for (const accion of cola) {
    if (frenarPorRed) {
      restantes.push(accion);
      continue;
    }

    try {
      if (accion.tipo === "confirmar_pedido") {
        await sincronizarConfirmacion(usuarioId, accion);
      } else if (accion.tipo === "cancelar_pedido") {
        await sincronizarCancelacion(usuarioId, accion);
      }
    } catch (error) {
      if (esErrorDeRed(error)) {
        frenarPorRed = true;
        restantes.push(accion);
      } else {
        await marcarError(usuarioId, accion, error.message);
      }
    }
  }

  await guardarColaLocal(usuarioId, restantes);
  return { pendientes: restantes.length };
}

/**
 * Envía un pedido que se armó sin red.
 * Si la persona lo canceló antes, no se crea en Firestore.
 */
async function sincronizarConfirmacion(usuarioId, accion) {
  const pedidos = await leerPedidosLocal(usuarioId);
  const local = pedidos.find((pedido) => pedido.id === accion.pedidoId);
  if (!local || local.estado === "cancelado") return;

  const errores = await validarDisponibilidad(local.items);
  if (errores.length > 0) {
    throw new Error(errores.join(" "));
  }

  const remoto = await crearPedidoRemoto({
    id: local.id,
    usuarioId,
    items: local.items,
    total: local.total,
  });

  await actualizarPedidoLocal(usuarioId, local.id, {
    items: remoto.items || local.items,
    total: remoto.total ?? local.total,
    syncEstado: "sincronizado",
    origen: "remoto",
    syncTipo: "",
    syncMensaje: "",
  });
}

/**
 * Aplica en Firestore una cancelación hecha sin red.
 * Si el mercado ya pasó el pedido a listo o entregado, se revierte el estado local
 * al que tiene el servidor y se informa con un error visible.
 */
async function sincronizarCancelacion(usuarioId, accion) {
  try {
    await cancelarPedidoRemoto({ pedidoId: accion.pedidoId, usuarioId });
    await eliminarPedidoLocal(usuarioId, accion.pedidoId);
  } catch (error) {
    if (error?.esReglaDeNegocio) {
      await actualizarPedidoLocal(usuarioId, accion.pedidoId, {
        estado: error.estadoServidor,
        syncEstado: "error",
        syncTipo: "",
        syncMensaje: error.message,
      });
      return;
    }
    if (String(error?.message || "").includes("no existe")) {
      await eliminarPedidoLocal(usuarioId, accion.pedidoId);
      return;
    }
    throw error;
  }
}

/**
 * Vuelve a encolar la misma acción que falló.
 * Usa syncTipo guardado en el pedido para no convertir una cancelación
 * en una creación nueva.
 */
export async function reintentarSincronizacion(usuarioId, pedido) {
  if (!pedido?.syncTipo) return;
  await actualizarPedidoLocal(usuarioId, pedido.id, {
    syncEstado: "pendiente",
    syncMensaje: "Pendiente por sincronizar",
  });
  await encolarAccion(usuarioId, { tipo: pedido.syncTipo, pedidoId: pedido.id });
}

/**
 * Deja el pedido visible con el motivo, y no vuelve a encolar la acción.
 */
async function marcarError(usuarioId, accion, mensaje) {
  await actualizarPedidoLocal(usuarioId, accion.pedidoId, {
    syncEstado: "error",
    syncMensaje: mensaje || "No se pudo sincronizar.",
  });
}
