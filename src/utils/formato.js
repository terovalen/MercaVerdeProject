/**
 * Presentación compartida de precios y fechas para que catálogo,
 * carrito y pedidos se vean iguales.
 */

/**
 * Formatea un valor numérico como precio en pesos colombianos.
 */
export function formatearPrecio(valor) {
  const numero = Number(valor) || 0;
  return `$${numero.toLocaleString("es-CO")}`;
}

/**
 * Formatea milisegundos a una fecha corta legible en español.
 * Acepta también un Timestamp de Firestore por si algún documento
 * aún no fue normalizado.
 */
export function formatearFecha(valor) {
  const millis = aMillis(valor);
  if (!millis) return "sin fecha";

  try {
    return new Date(millis).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "sin fecha";
  }
}

/**
 * Convierte un Timestamp de Firestore, un número o un objeto {seconds}
 * a milisegundos. AsyncStorage solo puede guardar JSON plano.
 */
export function aMillis(valor) {
  if (!valor) return null;
  if (typeof valor === "number") return valor;
  if (typeof valor.toMillis === "function") return valor.toMillis();
  if (typeof valor.seconds === "number") return valor.seconds * 1000;
  return null;
}
