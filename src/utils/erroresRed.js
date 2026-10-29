/**
 * Clasifica errores para decidir si la acción se reintenta (red)
 * o se detiene (regla de negocio: sin stock, pedido ya listo, etc.).
 */

/**
 * Verdadero cuando el fallo parece de conectividad y no de una regla del mercado.
 */
export function esErrorDeRed(error) {
  const codigo = String(error?.code || "");
  const mensaje = String(error?.message || "").toLowerCase();

  return (
    codigo === "unavailable" ||
    codigo === "deadline-exceeded" ||
    codigo.includes("network") ||
    mensaje.includes("tiempo de espera") ||
    mensaje.includes("network") ||
    mensaje.includes("offline") ||
    mensaje.includes("failed to get document") ||
    mensaje.includes("failed to fetch") ||
    mensaje.includes("network request failed") ||
    mensaje.includes("request timed out") ||
    mensaje.includes("internet")
  );
}
