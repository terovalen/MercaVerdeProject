/**
 * Caso de uso: pedidos del usuario autenticado.
 * La copia local se muestra de inmediato. Con red se fusiona con Firestore.
 */

import { fusionarPedidos } from "../domain/fusionarPedidos";
import { guardarPedidosLocal, leerPedidosLocal } from "../data/repositorioLocal";
import { listarPedidosDeUsuario } from "../services/pedidoService";
import { esErrorDeRed } from "../utils/erroresRed";

/**
 * Deja solo pedidos cuyo usuarioId coincide.
 * Defensa extra por si la caché de otra sesión quedara mezclada.
 */
function soloDeEsteUsuario(pedidos, usuarioId) {
  return pedidos.filter((pedido) => pedido.usuarioId === usuarioId);
}

/**
 * Carga los pedidos del usuario.
 * `alTenerCache` pinta la lista local antes de que responda Firestore.
 */
export async function cargarPedidosDelUsuario(usuarioId, enLinea, alTenerCache) {
  const locales = soloDeEsteUsuario(await leerPedidosLocal(usuarioId), usuarioId);

  alTenerCache?.({ pedidos: locales, desdeCache: true });

  if (enLinea !== true) {
    return {
      pedidos: locales,
      desdeCache: true,
      aviso: null,
    };
  }

  try {
    const remotos = soloDeEsteUsuario(await listarPedidosDeUsuario(usuarioId), usuarioId);
    const fusionados = fusionarPedidos(remotos, locales);
    await guardarPedidosLocal(usuarioId, fusionados);
    return { pedidos: fusionados, desdeCache: false, aviso: null };
  } catch (error) {
    return {
      pedidos: locales,
      desdeCache: true,
      aviso: esErrorDeRed(error)
        ? "Sin conexión con el servidor. Mostrando los pedidos guardados en el dispositivo."
        : error.message,
    };
  }
}
