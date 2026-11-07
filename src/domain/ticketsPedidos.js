/**
 * Reglas de los tickets del panel de vendedor y administrador:
 * qué se filtra y qué se puede hacer en cada estado.
 * No sabe nada de Firebase ni de la red, solo mira el estado del pedido.
 */

import { ESTADOS_PEDIDO } from "./estadosPedido";

/** Estados en los que todavía hay trabajo del vendedor. */
export const ESTADOS_ACTIVOS = [
  ESTADOS_PEDIDO.PENDIENTE,
  ESTADOS_PEDIDO.EN_PREPARACION,
  ESTADOS_PEDIDO.LISTO,
  "cambio_pendiente",
];

/** La ruta normal de un pedido, de principio a fin. */
export const RUTA_SEGUIMIENTO = [
  ESTADOS_PEDIDO.PENDIENTE,
  ESTADOS_PEDIDO.EN_PREPARACION,
  ESTADOS_PEDIDO.LISTO,
  ESTADOS_PEDIDO.ENTREGADO,
];

/**
 * Qué toca hacer en cada estado, desde el punto de vista del vendedor.
 */
export function accionSegunEstado(estado) {
  switch (estado) {
    case ESTADOS_PEDIDO.PENDIENTE:
      return { puedePreparar: false, texto: "Pedido nuevo: revisa el pago y toca Recibir para aceptarlo." };
    case ESTADOS_PEDIDO.EN_PREPARACION:
      return { puedePreparar: false, texto: "Separando el pedido: avisa con Listo cuando esté." };
    case ESTADOS_PEDIDO.LISTO:
      return { puedePreparar: false, texto: "Listo para recoger: toca Entregado." };
    case ESTADOS_PEDIDO.ENTREGADO:
      return { puedePreparar: false, texto: "Pedido cerrado: ya fue entregado." };
    case ESTADOS_PEDIDO.CANCELADO:
      return { puedePreparar: false, texto: "Pedido cerrado: fue cancelado por el comprador." };
    case "cambio_pendiente":
      return { puedePreparar: false, texto: "El pedido espera la respuesta del comprador a la propuesta de cambio." };
    default:
      return { puedePreparar: false, texto: `Estado desconocido: ${estado || "sin estado"}.` };
  }
}

export function esperaRespuestaComprador(estado) {
  return estado === "cambio_pendiente";
}

export function puedePreparar(estado) {
  return estado === ESTADOS_PEDIDO.PENDIENTE;
}

/**
 * Texto corto del chip "Activos"/estado respecto al punto de vista del
 * vendedor.
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
 * de fechas. Los criterios se combinan; si no hay ninguno, sale todo.
 * criterios = { estado: "activos" | "todos" | <estado>, texto, rango }
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
 * Total del ticket. Si el documento no trae total (pedidos viejos), sale
 * de la suma de las líneas.
 */
export function totalDeTicket(pedido) {
  const suma = (pedido.items || []).reduce((n, item) => n + Number(item.precio) * Number(item.cantidad), 0);
  return Number(pedido.total) || suma || 0;
}