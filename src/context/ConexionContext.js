// src/context/ConexionContext.js
// Estado de red para toda la app. El indicador y los casos de uso
// leen `enLinea` en lugar de preguntarle a Firebase si "parece" colgado.

import React, { createContext, useContext, useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

const ConexionContext = createContext({ enLinea: null });

/**
 * Traduce el estado de NetInfo a tres valores:
 * true (hay red), false (modo avión o sin internet) o null (aún no se sabe).
 * isInternetReachable en null no se trata como caída: en iOS a veces
 * tarda en resolverse aunque el wifi ya esté conectado.
 */
export function derivarEnLinea(estado) {
  if (!estado || estado.isConnected == null) return null;
  if (!estado.isConnected) return false;
  if (estado.isInternetReachable === false) return false;
  return true;
}

export function ConexionProvider({ children }) {
  const [enLinea, setEnLinea] = useState(null);

  useEffect(() => {
    let activo = true;

    function aplicar(estado) {
      if (activo) setEnLinea(derivarEnLinea(estado));
    }

    NetInfo.fetch().then(aplicar);
    const suscripcion = NetInfo.addEventListener(aplicar);

    // Si NetInfo no responde, se asume sin red para no dejar el catálogo cargando.
    const respaldo = setTimeout(() => {
      if (activo) {
        setEnLinea((actual) => (actual == null ? false : actual));
      }
    }, 3000);

    return () => {
      activo = false;
      clearTimeout(respaldo);
      suscripcion();
    };
  }, []);

  return (
    <ConexionContext.Provider value={{ enLinea }}>
      {children}
    </ConexionContext.Provider>
  );
}

/**
 * Hook de lectura. Fuera del provider devuelve enLinea null.
 */
export function useConexion() {
  return useContext(ConexionContext);
}
