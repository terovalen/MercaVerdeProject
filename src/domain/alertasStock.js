/**
 * FE-01 — Alertas de disponibilidad.
 * Hallazgo H-01: la gente hace fila o mira la cartelera para saber qué queda.
 * Esta regla convierte el catálogo (en vivo o en caché) en una alerta accionable.
 */

/** A partir de esta cantidad el producto se marca "Queda poco". */
export const UMBRAL_STOCK_BAJO = 5;

const META_NIVEL = {
  agotado: { etiqueta: "Agotado", color: "#C62828", fondo: "#FFEBEE", orden: 0 },
  queda_poco: { etiqueta: "Queda poco", color: "#EF6C00", fondo: "#FFF3E0", orden: 1 },
  sin_dato: { etiqueta: "Sin dato local", color: "#546E7A", fondo: "#ECEFF1", orden: 2 },
  disponible: { etiqueta: "Disponible", color: "#2E7D32", fondo: "#E8F5E9", orden: 3 },
};

/**
 * Clasifica un producto según su disponibilidad numérica.
 * Sin producto o sin número, el nivel es "sin_dato" (no se inventa stock).
 */
export function evaluarDisponibilidad(producto) {
  if (!producto || producto.disponibilidad == null || producto.disponibilidad === "") {
    return "sin_dato";
  }
  const cantidad = Number(producto.disponibilidad);
  if (Number.isNaN(cantidad)) return "sin_dato";
  if (cantidad <= 0) return "agotado";
  if (cantidad <= UMBRAL_STOCK_BAJO) return "queda_poco";
  return "disponible";
}

/**
 * Cruza los productos que la persona sigue con el catálogo actual
 * y devuelve fichas listas para pintar, las urgentes primero.
 */
export function construirAlertas(idsSeguidos, catalogo) {
  const porId = new Map((catalogo || []).map((producto) => [producto.id, producto]));

  const fichas = (idsSeguidos || []).map((productoId) => {
    const producto = porId.get(productoId) || null;
    const nivel = evaluarDisponibilidad(producto);
    return {
      productoId,
      producto,
      nivel,
      ...META_NIVEL[nivel],
    };
  });

  return fichas.sort((a, b) => a.orden - b.orden);
}

/**
 * Cuenta alertas que merecen verse en el acceso del catálogo
 * (agotado o queda poco). Lo disponible no suma.
 */
export function contarAlertasUrgentes(fichas) {
  return (fichas || []).filter(
    (ficha) => ficha.nivel === "agotado" || ficha.nivel === "queda_poco"
  ).length;
}
