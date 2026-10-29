/**
 * Capa de dominio: une la lista remota con la copia local.
 *
 * El servidor es la fuente de verdad cuando el pedido ya existe allá.
 * Excepción: si en el teléfono hay una cancelación aún no enviada,
 * se conserva para que un refresco no la borre antes de sincronizar.
 */

/**
 * Fusiona pedidos remotos y locales del mismo usuario, del más reciente al más viejo.
 */
export function fusionarPedidos(remotos, locales) {
  const porId = new Map();

  for (const pedido of locales || []) {
    porId.set(pedido.id, pedido);
  }

  for (const pedido of remotos || []) {
    const local = porId.get(pedido.id);
    const cancelacionPendiente =
      local?.syncEstado === "pendiente" && local?.estado === "cancelado";

    if (cancelacionPendiente) continue;
    porId.set(pedido.id, pedido);
  }

  return Array.from(porId.values()).sort(
    (a, b) => (b.creadoEn || 0) - (a.creadoEn || 0)
  );
}
