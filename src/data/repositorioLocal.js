/**
 * Capa de datos local, separada por usuario.
 * Cada clave lleva el uid para que la sesión de una persona
 * no vea el carrito ni los pedidos de otra.
 */

import { borrarClaves, guardarJson, invalidarEscriturasLocales, leerJson } from "./storageJson";

/**
 * Construye la clave AsyncStorage de un agregado del usuario.
 */
function clave(usuarioId, nombre) {
  return `mv:${usuarioId}:${nombre}`;
}

function claveCatalogo(usuarioId) {
  return clave(usuarioId, "catalogo");
}
function clavePedidos(usuarioId) {
  return clave(usuarioId, "pedidos");
}
function claveCarrito(usuarioId) {
  return clave(usuarioId, "carrito");
}
function claveCola(usuarioId) {
  return clave(usuarioId, "cola");
}
function claveSeguidos(usuarioId) {
  return clave(usuarioId, "seguidos");
}

/**
 * Lee la última copia del catálogo descargada por este usuario.
 * Forma: { productos, actualizadoEn } o null si nunca se descargó.
 */
export async function leerCatalogoLocal(usuarioId) {
  if (!usuarioId) return null;
  return leerJson(claveCatalogo(usuarioId), null);
}

/**
 * Reemplaza la caché del catálogo y anota cuándo se guardó.
 */
export async function guardarCatalogoLocal(usuarioId, productos) {
  if (!usuarioId) return;
  await guardarJson(claveCatalogo(usuarioId), {
    productos,
    actualizadoEn: Date.now(),
  });
}

/**
 * Lee los pedidos guardados en el dispositivo para este usuario.
 */
export async function leerPedidosLocal(usuarioId) {
  if (!usuarioId) return [];
  const pedidos = await leerJson(clavePedidos(usuarioId), []);
  return Array.isArray(pedidos) ? pedidos : [];
}

/**
 * Sustituye la lista local de pedidos.
 */
export async function guardarPedidosLocal(usuarioId, pedidos) {
  if (!usuarioId) return;
  await guardarJson(clavePedidos(usuarioId), pedidos);
}

/**
 * Inserta o reemplaza un pedido dentro de la lista local.
 */
export async function upsertPedidoLocal(usuarioId, pedido) {
  const pedidos = await leerPedidosLocal(usuarioId);
  const indice = pedidos.findIndex((item) => item.id === pedido.id);
  const siguientes =
    indice >= 0
      ? pedidos.map((item) => (item.id === pedido.id ? pedido : item))
      : [pedido, ...pedidos];
  await guardarPedidosLocal(usuarioId, siguientes);
  return siguientes;
}

/**
 * Quita un pedido de la copia local. Se usa cuando la cancelación
 * también lo borra de Firestore.
 */
export async function eliminarPedidoLocal(usuarioId, pedidoId) {
  const pedidos = await leerPedidosLocal(usuarioId);
  const siguientes = pedidos.filter((pedido) => pedido.id !== pedidoId);
  await guardarPedidosLocal(usuarioId, siguientes);
  return siguientes;
}

/**
 * Aplica un cambio parcial a un pedido local. No hace nada si el id no está.
 */
export async function actualizarPedidoLocal(usuarioId, pedidoId, cambios) {
  const pedidos = await leerPedidosLocal(usuarioId);
  const siguientes = pedidos.map((pedido) =>
    pedido.id === pedidoId ? { ...pedido, ...cambios } : pedido
  );
  await guardarPedidosLocal(usuarioId, siguientes);
  return siguientes;
}

/**
 * Lee el carrito persistido. Sobrevive al cierre de la app y al reinicio.
 */
export async function leerCarritoLocal(usuarioId) {
  if (!usuarioId) return [];
  const items = await leerJson(claveCarrito(usuarioId), []);
  return Array.isArray(items) ? items : [];
}

/**
 * Guarda el carrito completo del usuario.
 */
export async function guardarCarritoLocal(usuarioId, items) {
  if (!usuarioId) return;
  await guardarJson(claveCarrito(usuarioId), items);
}

/**
 * Lee la cola FIFO de acciones que todavía no llegaron a Firestore.
 * Cada acción: { id, tipo, pedidoId, creadoEn }.
 */
export async function leerColaLocal(usuarioId) {
  if (!usuarioId) return [];
  const cola = await leerJson(claveCola(usuarioId), []);
  return Array.isArray(cola) ? cola : [];
}

/**
 * Sustituye la cola completa.
 */
export async function guardarColaLocal(usuarioId, cola) {
  if (!usuarioId) return;
  await guardarJson(claveCola(usuarioId), cola);
}

/**
 * Agrega una acción al final de la cola si esa misma acción no está ya.
 */
export async function encolarAccion(usuarioId, accion) {
  const cola = await leerColaLocal(usuarioId);
  const repetida = cola.some(
    (item) => item.tipo === accion.tipo && item.pedidoId === accion.pedidoId
  );
  if (repetida) return cola;

  const siguiente = [
    ...cola,
    {
      id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      creadoEn: Date.now(),
      ...accion,
    },
  ];
  await guardarColaLocal(usuarioId, siguiente);
  return siguiente;
}

/**
 * Quita de la cola todas las acciones asociadas a un pedido
 * (por ejemplo, al cancelar un pedido que aún no se había enviado).
 */
export async function retirarAccionesDelPedido(usuarioId, pedidoId) {
  const cola = await leerColaLocal(usuarioId);
  const siguiente = cola.filter((item) => item.pedidoId !== pedidoId);
  await guardarColaLocal(usuarioId, siguiente);
  return siguiente;
}

/**
 * Lee los ids de productos que el usuario sigue para la FE-01.
 */
export async function leerSeguidosLocal(usuarioId) {
  if (!usuarioId) return [];
  const ids = await leerJson(claveSeguidos(usuarioId), []);
  return Array.isArray(ids) ? ids : [];
}

/**
 * Guarda la lista de productos seguidos.
 */
export async function guardarSeguidosLocal(usuarioId, ids) {
  if (!usuarioId) return;
  await guardarJson(claveSeguidos(usuarioId), ids);
}

/**
 * Borra catálogo, pedidos, carrito, cola y seguidos de un usuario.
 * Se ejecuta al cerrar sesión.
 */
export async function limpiarDatosLocales(usuarioId) {
  invalidarEscriturasLocales();
  if (!usuarioId) return;
  await borrarClaves([
    claveCatalogo(usuarioId),
    clavePedidos(usuarioId),
    claveCarrito(usuarioId),
    claveCola(usuarioId),
    claveSeguidos(usuarioId),
  ]);
}
