/**
 * Capa de dominio: estados del pedido y regla de cancelación.
 * No conoce Firebase ni la interfaz. Las pantallas solo muestran
 * lo que estas funciones deciden.
 */

export const ESTADOS_PEDIDO = {
  PENDIENTE: "pendiente",
  EN_PREPARACION: "en_preparacion",
  LISTO: "listo",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
  CAMBIO_PENDIENTE: "cambio_pendiente",
};

/**
 * Metadatos visuales únicos. Todas las pantallas usan esta tabla
 * para que el mismo estado se vea igual en la lista y en el detalle.
 */
const META_ESTADO = {
  pendiente: { etiqueta: "Pendiente", color: "#FF9800", fondo: "#FFF8E1" },
  en_preparacion: { etiqueta: "En preparación", color: "#1565C0", fondo: "#E3F2FD" },
  listo: { etiqueta: "Listo", color: "#2E7D32", fondo: "#E8F5E9" },
  entregado: { etiqueta: "Entregado", color: "#546E7A", fondo: "#ECEFF1" },
  cancelado: { etiqueta: "Cancelado", color: "#C62828", fondo: "#FFEBEE" },
  cambio_pendiente: { etiqueta: "Cambio pendiente", color: "#8D5B00", fondo: "#FFF8E1" },
};

/**
 * Devuelve etiqueta y colores de un estado.
 * Si el servidor manda un valor desconocido, no rompe la pantalla.
 */
export function metaEstado(estado) {
  return (
    META_ESTADO[estado] || {
      etiqueta: estado || "Sin estado",
      color: "#546E7A",
      fondo: "#ECEFF1",
    }
  );
}

/**
 * Regla de negocio del equipo para cancelar.
 * Sí se puede: pendiente y en_preparacion (el mercado aún no terminó de armarlo).
 * No se puede: listo, entregado ni cancelado.
 */
export function puedeCancelar(estado) {
  return estado === ESTADOS_PEDIDO.PENDIENTE || estado === ESTADOS_PEDIDO.EN_PREPARACION;
}

/**
 * Texto que ve el usuario cuando la regla impide cancelar.
 */
export function mensajeNoCancelable(estado) {
  const etiqueta = metaEstado(estado).etiqueta;
  if (estado === ESTADOS_PEDIDO.LISTO) {
    return `No se puede cancelar: el pedido ya está ${etiqueta.toLowerCase()} para recoger.`;
  }
  if (estado === ESTADOS_PEDIDO.ENTREGADO) {
    return "No se puede cancelar un pedido que ya fue entregado.";
  }
  if (estado === ESTADOS_PEDIDO.CANCELADO) {
    return "Este pedido ya está cancelado.";
  }
  return `No se puede cancelar un pedido en estado ${etiqueta}.`;
}