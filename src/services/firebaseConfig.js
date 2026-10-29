// src/services/firebaseConfig.js
//
// Configuración de Firebase para MercaVerde.
// Reemplaza los valores de "firebaseConfig" con los de tu propio proyecto
// en https://console.firebase.google.com  (Configuración del proyecto > General > Tus apps)
//
// IMPORTANTE: no subas claves privadas reales a un repositorio público.
// Si el repo del curso es público, usa variables de entorno (app.config.js + .env)
// en lugar de dejar los valores escritos aquí directamente.

import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBJX6jb47lNTB2V3HX_Tgjm7FNpg7hExzc",
  authDomain: "mercaverde-2a8ad.firebaseapp.com",
  projectId: "mercaverde-2a8ad",
  storageBucket: "mercaverde-2a8ad.firebasestorage.app",
  messagingSenderId: "76032414976",
  appId: "1:76032414976:web:f03bf3e1ef56e2563c0fe5",
  measurementId: "G-Z5GV0S6TB3"
};

const app = initializeApp(firebaseConfig);

function crearAuth(appInstance) {
  if (Platform.OS === "web") {
    return getAuth(appInstance);
  }

  try {
    return initializeAuth(appInstance, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch {
    return getAuth(appInstance);
  }
}

export const auth = crearAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;