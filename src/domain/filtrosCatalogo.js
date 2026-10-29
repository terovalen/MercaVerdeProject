/**
 * Capa de dominio: búsqueda y filtros del catálogo.
 * Opera sobre el arreglo ya cargado (red o caché), así que funciona
 * igual con y sin conexión.
 */

/**
 * Interpreta el texto de un campo de precio.
 * Vacío significa "sin límite". Una coma decimal se acepta.
 */
export function aPrecio(texto) {
  if (texto == null || String(texto).trim() === "") return null;
  const numero = Number(String(texto).replace(",", "."));
  return Number.isNaN(numero) ? null : numero;
}

/**
 * Indica si el rango escrito no se puede aplicar (mínimo mayor que máximo).
 */
export function rangoPrecioInvalido(precioMin, precioMax) {
  const min = aPrecio(precioMin);
  const max = aPrecio(precioMax);
  return min != null && max != null && min > max;
}

/**
 * Filtra productos por nombre, categoría y rango de precio.
 * Los criterios se combinan: un producto debe cumplir todos los que estén activos.
 * No filtra por existencias: el stock es dato privado del inventario y la
 * vista pública del catálogo no lo incluye.
 *
 * criterios = {
 *   texto: string,
 *   categoria: string ("Todas" desactiva el filtro),
 *   precioMin: string,
 *   precioMax: string
 * }
 */
export function filtrarProductos(productos, criterios = {}) {
  const texto = String(criterios.texto || "").trim().toLowerCase();
  const categoria = criterios.categoria || "Todas";
  const min = aPrecio(criterios.precioMin);
  const max = aPrecio(criterios.precioMax);
  const rangoRoto = rangoPrecioInvalido(criterios.precioMin, criterios.precioMax);

  return (productos || []).filter((producto) => {
    const nombre = String(producto.nombre || "").toLowerCase();
    if (texto && !nombre.includes(texto)) return false;
    if (categoria !== "Todas" && producto.categoria !== categoria) return false;

    if (!rangoRoto) {
      const precio = Number(producto.precio) || 0;
      if (min != null && precio < min) return false;
      if (max != null && precio > max) return false;
    }

    return true;
  });
}

/**
 * Arma la lista de categorías presentes en el catálogo cargado,
 * para que los chips también funcionen offline.
 */
export function categoriasDe(productos) {
  const unicas = new Set(
    (productos || []).map((producto) => producto.categoria).filter(Boolean)
  );
  return ["Todas", ...Array.from(unicas).sort((a, b) => a.localeCompare(b, "es"))];
}
