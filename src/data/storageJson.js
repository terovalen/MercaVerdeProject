/**
 * Capa de datos: AsyncStorage con JSON.
 * Una marca de época evita que una escritura lenta vuelva a guardar
 * datos después de cerrar sesión.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

let epocaEscritura = 0;

/**
 * Invalida escrituras que ya estaban en curso.
 * Se llama al cerrar sesión, antes de borrar las claves del usuario.
 */
export function invalidarEscriturasLocales() {
  epocaEscritura += 1;
}

/**
 * Lee JSON. Si la clave no existe o el contenido está dañado, devuelve el valor por defecto.
 */
export async function leerJson(clave, valorPorDefecto) {
  try {
    const crudo = await AsyncStorage.getItem(clave);
    if (crudo == null) return valorPorDefecto;
    return JSON.parse(crudo);
  } catch {
    return valorPorDefecto;
  }
}

/**
 * Guarda JSON. Si la sesión se cerró mientras se serializaba, no restaura la clave.
 */
export async function guardarJson(clave, valor) {
  const epoca = epocaEscritura;
  const serializado = JSON.stringify(valor);
  if (epoca !== epocaEscritura) return;
  await AsyncStorage.setItem(clave, serializado);
  if (epoca !== epocaEscritura) {
    await AsyncStorage.removeItem(clave);
  }
}

/**
 * Borra varias claves de una vez.
 */
export async function borrarClaves(claves) {
  if (!claves?.length) return;
  await AsyncStorage.multiRemove(claves);
}
