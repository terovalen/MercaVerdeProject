// src/services/catalogoService.js
// Consultas al catálogo de productos a través de la API.
//
// Los datos de inventario son privados: la API pública (/api/catalogo)
// entrega nombre, precio, unidad, categoría, productor e imagen, pero
// ninguna existencias. El stock lo consulta el personal por /api/inventario
// y el servidor valida existencias al procesar cada pedido.
//
// Estructura del documento en la colección "Productos":
// {
//   nombre: string,
//   descripcion: string,
//   precio: number,
//   unidad: string,          // ej: "libra", "unidad", "bulto"
//   disponibilidad: number,  // privado: solo /api/inventario y /api/pedidos
//   categoria: string,
//   productor: string,
//   imagenUrl: string,
//   activo: boolean
// }
// src/services/catalogoService.js

import { conTiempoLimite } from "../utils/conTiempoLimite";
import { apiRequest } from "./apiClient";

/** Nombre real de la colección en el proyecto de Firebase ya cargado. */
const COLECCION_PRODUCTOS = "Productos";

/**
 * Lee el primer campo que exista. En Firestore hay documentos con
 * "nombre" y otros cargados a mano con "Nombre" o "Descripción".
 */
function leerCampo(data, claves) {
  for (const clave of claves) {
    const valor = data?.[clave];
    if (valor != null && valor !== "") return valor;
  }
  return undefined;
}

/**
 * Deja cualquier documento de Productos en la forma que usa la app.
 * Venga en minúscula (pastel de queso) o con mayúscula (el resto).
 * La API pública ya no envía existencias: si "disponibilidad" no viene,
 * queda undefined y el dominio la trata como "sin dato" de inventario,
 * nunca como agotado.
 */
export function normalizarProducto(id, data = {}) {
  const disponibilidad = leerCampo(data, ["disponibilidad", "Disponibilidad"]);
  return {
    id,
    nombre: leerCampo(data, ["nombre", "Nombre"]) || "Sin nombre",
    descripcion: leerCampo(data, ["descripcion", "Descripcion", "Descripción"]) || "",
    precio: Number(leerCampo(data, ["precio", "Precio"])) || 0,
    unidad: leerCampo(data, ["unidad", "Unidad"]) || "unidad",
    disponibilidad: disponibilidad == null || disponibilidad === "" ? undefined : Number(disponibilidad),
    categoria: leerCampo(data, ["categoria", "Categoria", "Categoría"]) || "Sin categoría",
    productor: leerCampo(data, ["productor", "Productor"]) || "",
    imagenUrl: leerCampo(data, ["imagenUrl", "ImagenUrl", "imagenURL"]) || "",
    activo: leerCampo(data, ["activo", "Activo"]) !== false,
  };
}

/**
 * Trae todos los productos de la colección, sin filtrar por "activo".
 * Ese filtro solo devolvía el pastel de queso, el único con el campo en minúscula.
 */
export async function obtenerCatalogo() {
  const productos = await conTiempoLimite(apiRequest("/api/catalogo"));
  return productos.map(({ id, ...data }) => normalizarProducto(id, data));
}


/**
 * Trae el detalle de un producto por su id.
 * Falla con un mensaje claro si el documento ya no existe.
 */
export async function obtenerProducto(productoId) {

  const productos = await obtenerCatalogo();
  const producto = productos.find((p) => p.id === productoId);
  if (!producto) throw new Error("El producto ya no existe en el catálogo.");
  return producto;
}
