/**
 * Capa de dominio: tickets de pedidos del panel vendedor/administrador.
 * Decide qué filtrar y qué puede hacerse en cada estado. No conoce
 * Firebase ni redes; las pantallas solo muestran lo que esto determina.
 * Reutiliza las reglas de estadosPedido.js (mismo negocio, misma tabla).
 */

import { ESTADOS_PEDIDO } from "./estadosPedido";

/** Estados que aún requieren trabajo del vendedor (para el filtro "Activos"). */
export const ESTADOS_ACTIVOS = [
  ESTADOS_PEDIDO.RECIBIDO,
  ESTADOS_PEDIDO.EN_PREPARACION,
  ESTADOS_PEDIDO.LISTO,
  "cambio_pendiente",
];

/** Ruta normal de seguimiento (el comprador la ve igual). */
export const RUTA_SEGUIMIENTO = [
  ESTADOS_PEDIDO.RECIBIDO,
  ESTADOS_PEDIDO.EN_PREPARACION,
  ESTADOS_PEDIDO.LISTO,
  ESTADOS_PEDIDO.ENTREGADO,
];

/**
 * Guía del vendedor según el estado: cuándo puede prepararse el pedido
 * y cuándo se espera la respuesta del comprador a una propuesta.
 */
export function accionSegunEstado(estado) {
  switch (estado) {
    case ESTADOS_PEDIDO.RECIBIDO:
      return { puedePreparar: true, texto: "Puede prepararse: revisa existencias y toca Preparar." };
    case "cambio_pendiente":
      return { puedePreparar: false, texto: "El pedido espera la respuesta del comprador a la propuesta de cambio." };
    case ESTADOS_PEDIDO.EN_PREPARACION:
      return { puedePreparar: false, texto: "Separando el pedido: avisa con Listo cuando esté." };
    case ESTADOS_PEDIDO.LISTO:
      return { puedePreparar: false, texto: "Listo para recoger: toca Entregado." };
    case ESTADOS_PEDIDO.ENTREGADO:
      return { puedePreparar: false, texto: "Pedido cerrado: ya fue entregado." };
    case ESTADOS_PEDIDO.CANCELADO:
      return { puedePreparar: false, texto: "Pedido cerrado: fue cancelado por el comprador." };
    default:
      return { puedePreparar: false, texto: `Estado desconocido: ${estado || "sin estado"}.` };
  }
}

export function esperaRespuestaComprador(estado) {
  return estado === "cambio_pendiente";
}

export function puedePreparar(estado) {
  return estado === ESTADOS_PEDIDO.RECIBIDO;
}

/**
 * Texto corto del chip "Activos"/estado respecto al punto de vista del
 * vendedor (la palabra "cambio_pendiente" cambia de sentido aquí).
 */
export function etiquetaVendedor(estado) {
  if (estado === ESTADOS_PEDIDO.CAMBIO_PENDIENTE) {
    return "Esperando comprador";
  }
  return null;
}

export const OPCIONES_FECHA = [
  { id: "todas", etiqueta: "Todas las fechas", dias: null },
  { id: "hoy", etiqueta: "Hoy", dias: 1 },
  { id: "semana", etiqueta: "Últimos 7 días", dias: 7 },
  { id: "mes", etiqueta: "Últimos 30 días", dias: 30 },
];

/**
 * Filtra los tickets por estado, texto (id, comprador o producto) y rango
 * de fechas. Combina los criterios activos; vacío = sin filtro.
 * criterios = {
 *   estado: "activos" | "todos" | <estado>,
 *   texto: string,
 *   rango: id de OPCIONES_FECHA
 * }
 */
export function filtrarTickets(pedidos, criterios = {}) {
  const estado = criterios.estado || "todos";
  const texto = String(criterios.texto || "").trim().toLowerCase();
  const opcion = OPCIONES_FECHA.find(o => o.id === (criterios.rango || "todas")) || OPCIONES_FECHA[0];
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  const corte = opcion.dias === 1 ? inicioHoy : opcion.dias == null ? null : inicioHoy - (opcion.dias - 1) * 86400000;

  return (pedidos || []).filter(pedido => {
    if (estado === "activos" && !ESTADOS_ACTIVOS.includes(pedido.estado)) return false;
    if (estado !== "activos" && estado !== "todos" && pedido.estado !== estado) return false;

    if (corte != null) {
      const creado = pedido.creadoEn;
      if (typeof creado !== "number" || creado < corte) return false;
    }

    if (texto) {
      const buscados = [
        pedido.id,
        pedido.usuarioId,
        ...(pedido.items || []).map(i => i.nombre),
      ].join(" ").toLowerCase();
      if (!buscados.includes(texto)) return false;
    }

    return true;
  });
}

/**
 * Subtotal por línea y total del ticket, calculados del lado de esta vista
 * para mostrarlos aunque el documento venga sin total (pedidos viejos).
 */
export function totalDeTicket(pedido) {
  const suma = (pedido.items || []).reduce((n, item) => n + Number(item.precio) * Number(item.cantidad), 0);
  return Number(pedido.total) || suma || 0;
}
