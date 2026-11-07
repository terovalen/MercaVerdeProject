/**
 * Caso de uso FE-01: seguir o dejar de seguir un producto.
 * La lista queda solo en el dispositivo, así que funciona sin conexión.
 */

import { guardarSeguidosLocal, leerSeguidosLocal } from "../data/repositorioLocal";

/**
 * Devuelve los ids que este usuario decidió vigilar.
 */
export async function obtenerSeguidos(usuarioId) {
  return leerSeguidosLocal(usuarioId);
}

/**
 * Alterna el seguimiento de un producto y devuelve la lista resultante.
 */
export async function alternarSeguimiento(usuarioId, productoId) {
  const actuales = await leerSeguidosLocal(usuarioId);
  const siguientes = actuales.includes(productoId)
    ? actuales.filter((id) => id !== productoId)
    : [...actuales, productoId];
  await guardarSeguidosLocal(usuarioId, siguientes);
  return siguientes;
}
