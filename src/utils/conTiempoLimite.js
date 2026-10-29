/**
 * Utilidad de infraestructura.
 * Evita que una llamada de red (Firestore) deje la pantalla cargando
 * para siempre cuando el dispositivo está en modo avión.
 */

/**
 * Rechaza la promesa si no termina antes de `ms` milisegundos.
 * La petición original puede seguir en segundo plano; quien llama
 * debe tratar el rechazo como fallo de red y mostrar la copia local.
 */
export function conTiempoLimite(promesa, ms = 8000) {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(() => {
      reject(new Error("Tiempo de espera agotado sin conexión."));
    }, ms);

    promesa.then(
      (valor) => {
        clearTimeout(temporizador);
        resolve(valor);
      },
      (error) => {
        clearTimeout(temporizador);
        reject(error);
      }
    );
  });
}
