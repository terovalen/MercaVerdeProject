/**
 * Caso de uso FE-01: seguir o dejar de seguir un producto
 * y armar las alertas de stock con el catálogo que haya (red o caché).
 */

import { construirAlertas } from "../domain/alertasStock";
import { guardarSeguidosLocal, leerSeguidosLocal } from "../data/repositorioLocal";

/**
 * Devuelve los ids que este usuario decidió vigilar.
 */
export async function obtenerSeguidos(usuarioId) {
  return leerSeguidosLocal(usuarioId);
}

/**
 * Alterna el seguimiento de un producto y devuelve la lista resultante.
 * Es una escritura local: funciona sin conexión.
 */
export async function alternarSeguimiento(usuarioId, productoId) {
  const actuales = await leerSeguidosLocal(usuarioId);
  const siguientes = actuales.includes(productoId)
    ? actuales.filter((id) => id !== productoId)
    : [...actuales, productoId];
  await guardarSeguidosLocal(usuarioId, siguientes);
  return siguientes;
}

/**
 * Construye las fichas de alerta cruzando seguidos y catálogo.
 */
export async function cargarAlertas(usuarioId, catalogo) {
  const ids = await leerSeguidosLocal(usuarioId);
  return construirAlertas(ids, catalogo);
}
