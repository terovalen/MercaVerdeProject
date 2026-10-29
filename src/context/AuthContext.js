// src/context/AuthContext.js
// Mantiene el usuario autenticado y, al salir, borra los datos locales de esa cuenta.

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { cerrarSesion, obtenerPerfil } from "../services/authService";
import { limpiarDatosLocales } from "../data/repositorioLocal";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let resuelto = false;

    // Si Firebase Auth no responde (arranque sin red y sin caché de sesión),
    // no dejar el spinner eterno: a los 4 s se muestra el login.
    const temporizador = setTimeout(() => {
      if (!resuelto) setCargando(false);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, async (usuarioFirebase) => {
      resuelto = true;
      clearTimeout(temporizador);
      if (usuarioFirebase) {
        try {
          const perfil = await obtenerPerfil(usuarioFirebase.uid);
          setUsuario({ ...usuarioFirebase, ...perfil, uid: usuarioFirebase.uid });
        } catch {
          setUsuario({ ...usuarioFirebase, rol: "comprador" });
        }
      } else setUsuario(null);
      setCargando(false);
    });

    return () => {
      clearTimeout(temporizador);
      unsubscribe();
    };
  }, []);

  /**
   * Cierra sesión y elimina catálogo, carrito, pedidos, cola y seguidos
   * asociados a este uid. La limpieza va antes del signOut para conocer el id.
   */
  async function salir() {
    const uid = usuario?.uid || auth.currentUser?.uid;
    try {
      if (uid) await limpiarDatosLocales(uid);
    } finally {
      await cerrarSesion();
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, salir }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook del usuario actual. Incluye `salir` para que las pantallas
 * no llamen a Firebase sin borrar antes la copia local.
 */
export function useAuth() {
  return useContext(AuthContext);
}
