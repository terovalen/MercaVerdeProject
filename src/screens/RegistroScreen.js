// src/screens/RegistroScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { registrarUsuario } from "../services/authService";

export default function RegistroScreen({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [genero, setGenero] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarRegistro() {
    if (!nombre || !correo || !contrasena || !genero) {
      Alert.alert("Datos incompletos", "Completa todos los campos.");
      return;
    }
    if (contrasena.length < 6) {
      Alert.alert("Contraseña muy corta", "Debe tener al menos 6 caracteres.");
      return;
    }
    setCargando(true);
    try {
      await registrarUsuario({ nombre, correo, contrasena, genero });
      // AuthContext detecta la sesión y navega automáticamente
    } catch (error) {
      Alert.alert("No se pudo registrar", traducirError(error.code));
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Crear cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        placeholderTextColor="#AAA"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo institucional"
        placeholderTextColor="#AAA"
        autoCapitalize="none"
        keyboardType="default"
        value={correo}
        onChangeText={setCorreo}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mínimo 6 caracteres)"
        placeholderTextColor="#AAA"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
      />
      <Text style={{ color: "#5A6B57", marginBottom: 8 }}>Género (para analítica)</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        {[['mujer', 'Mujer'], ['hombre', 'Hombre'], ['otro', 'Otro'], ['prefiero_no_decirlo', 'Prefiero no decirlo']].map(([valor, etiqueta]) => (
          <TouchableOpacity key={valor} onPress={() => setGenero(valor)} style={{ flex: 1, padding: 8, borderRadius: 8, backgroundColor: genero === valor ? "#2E7D32" : "#fff", borderWidth: 1, borderColor: "#DDE3D8" }}>
            <Text style={{ color: genero === valor ? "#fff" : "#2B2F2B", textAlign: "center", fontSize: 12 }}>{etiqueta}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.boton} onPress={manejarRegistro} disabled={cargando}>
        {cargando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botonTexto}>Registrarme</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.enlace}>Ya tengo cuenta, iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function traducirError(codigo) {
  switch (codigo) {
    case "auth/email-already-in-use":
      return "Ese correo ya está registrado.";
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/weak-password":
      return "La contraseña es muy débil.";
    default:
      return "Ocurrió un error. Intenta de nuevo.";
  }
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F4F7F1" },
  titulo: { fontSize: 26, fontWeight: "700", color: "#2E5A2E", textAlign: "center", marginBottom: 24 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#DDE3D8",
  },
  boton: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  botonTexto: { color: "#fff", fontWeight: "600", fontSize: 16 },
  enlace: { textAlign: "center", marginTop: 18, color: "#2E7D32" },
});
