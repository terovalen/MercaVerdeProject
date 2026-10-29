// src/services/authService.js
// Funciones de autenticación con Firebase Authentication.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

/**
 * Registra un nuevo usuario y crea su documento en la colección "usuarios".
 */
export async function registrarUsuario({ nombre, correo, contrasena, genero = "prefiero_no_decirlo" }) {
  const credenciales = await createUserWithEmailAndPassword(auth, correo, contrasena);
  const usuario = credenciales.user;

  await updateProfile(usuario, { displayName: nombre });

  await setDoc(doc(db, "usuarios", usuario.uid), {
    nombre,
    correo,
    rol: "comprador",
    genero,
    creadoEn: serverTimestamp(),
  });

  return usuario;
}

export async function obtenerPerfil(uid) {
  const { getDoc, doc } = await import("firebase/firestore");
  const perfil = await getDoc(doc(db, "usuarios", uid));
  const data = perfil.exists() ? perfil.data() : { rol: "comprador" };
  return { ...data, rol: data.rol === "cliente" ? "comprador" : (data.rol || "comprador") };
}

/**
 * Inicia sesión con correo y contraseña.
 */
export async function iniciarSesion({ correo, contrasena }) {
  const credenciales = await signInWithEmailAndPassword(auth, correo, contrasena);
  return credenciales.user;
}

/**
 * Cierra la sesión del usuario actual.
 */
export async function cerrarSesion() {
  await signOut(auth);
}
