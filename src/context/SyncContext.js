// src/context/SyncContext.js
// Expone cuántas acciones siguen pendientes y dispara la cola
// cuando la conexión vuelve.

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { leerColaLocal } from "../data/repositorioLocal";
import { procesarCola } from "../services/sincronizacionService";
import { useConexion } from "./ConexionContext";

const SyncContext = createContext({
  pendientes: 0,
  sincronizando: false,
  ultimaSync: 0,
  sincronizar: async () => {},
  refrescar: async () => {},
});

export function SyncProvider({ usuarioId, children }) {
  const { enLinea } = useConexion();
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaSync, setUltimaSync] = useState(0);

  /**
   * Vuelve a contar la cola en disco para el indicador.
   */
  const refrescar = useCallback(async () => {
    const cola = await leerColaLocal(usuarioId);
    setPendientes(cola.length);
    return cola.length;
  }, [usuarioId]);

  /**
   * Envía la cola a Firestore y actualiza el contador.
   * Si no hay red, no intenta: las acciones siguen marcadas como pendientes.
   */
  const sincronizar = useCallback(async () => {
    if (!usuarioId) return { pendientes: 0 };
    setSincronizando(true);
    try {
      const resultado = await procesarCola(usuarioId);
      await refrescar();
      setUltimaSync(Date.now());
      return resultado;
    } finally {
      setSincronizando(false);
    }
  }, [usuarioId, refrescar]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  useEffect(() => {
    if (enLinea === true) {
      sincronizar();
    }
  }, [enLinea, sincronizar]);

  return (
    <SyncContext.Provider
      value={{ pendientes, sincronizando, ultimaSync, sincronizar, refrescar }}
    >
      {children}
    </SyncContext.Provider>
  );
}

/**
 * Hook de la cola. Fuera del provider el contador queda en cero
 * (pantallas de login, donde no hay acciones del usuario).
 */
export function useSync() {
  return useContext(SyncContext);
}
