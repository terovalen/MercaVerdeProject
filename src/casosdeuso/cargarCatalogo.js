/**
 * Caso de uso: catálogo con caché.
 * Primero entrega lo guardado en el dispositivo y, si hay red,
 * lo reemplaza con Firestore.
 */

import { guardarCatalogoLocal, leerCatalogoLocal } from "../data/repositorioLocal";
import { normalizarProducto, obtenerCatalogo } from "../services/catalogoService";
import { esErrorDeRed } from "../utils/erroresRed";

/**
 * Carga el catálogo del usuario.
 * `alTenerCache` se llama en cuanto hay copia local, para pintar
 * la lista sin esperar a la red.
 * `enLinea` debe ser true para intentar Firestore. null o false no bloquean.
 */
export async function cargarCatalogoDelUsuario(usuarioId, enLinea, alTenerCache) {
  const cache = await leerCatalogoLocal(usuarioId);
  const productosCache = (cache?.productos || []).map((producto) =>
    normalizarProducto(producto.id, producto)
  );

  if (productosCache.length > 0) {
    alTenerCache?.({
      productos: productosCache,
      actualizadoEn: cache.actualizadoEn,
      desdeCache: true,
    });
  }

  if (enLinea !== true) {
    return {
      productos: productosCache,
      actualizadoEn: cache?.actualizadoEn || null,
      desdeCache: true,
      aviso:
        enLinea === false && productosCache.length === 0
          ? "Sin conexión y todavía no hay un catálogo guardado en este dispositivo."
          : null,
    };
  }

  try {
    const remotos = await obtenerCatalogo();
    await guardarCatalogoLocal(usuarioId, remotos);
    return {
      productos: remotos,
      actualizadoEn: Date.now(),
      desdeCache: false,
      aviso: null,
    };
  } catch (error) {
    return {
      productos: productosCache,
      actualizadoEn: cache?.actualizadoEn || null,
      desdeCache: true,
      aviso: esErrorDeRed(error)
        ? "No se pudo actualizar el catálogo. Sigues viendo la última copia guardada."
        : error.message || "No se pudo leer el catálogo.",
    };
  }
}
