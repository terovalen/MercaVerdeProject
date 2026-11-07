/**
 * Menú lateral del administrador.
 * Cada sección abre su propia pantalla: dashboard, usuarios, soporte,
 * productos, reportes y configuración.
 */
import React, { useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View, StyleSheet } from "react-native";

export default function MenuAdministrador({ onSalir, onNavegar }) {
  const [abierto, setAbierto] = useState(false);

  function elegir(accion) {
    setAbierto(false);
    accion?.();
  }

  const SECCIONES = [
    { id: "dashboard", texto: "Dashboard", icono: "📊" },
    { id: "usuarios", texto: "Gestión de usuarios", icono: "👥" },
    { id: "soporte", texto: "Centro de soporte", icono: "🎧" },
    { id: "productos", texto: "Gestión de productos", icono: "📦" },
    { id: "reportes", texto: "Reportes y analíticas", icono: "📈" },
    { id: "configuracion", texto: "Configuración", icono: "⚙️" },
  ];

  return (
    <>
      <TouchableOpacity
        style={styles.boton}
        onPress={() => setAbierto(true)}
        accessibilityLabel="Abrir menú de administración"
      >
        <View style={styles.linea} />
        <View style={styles.linea} />
        <View style={styles.linea} />
      </TouchableOpacity>

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <View style={styles.fondo}>
          <View style={styles.panel}>
            <Text style={styles.marca}>MercaVerde</Text>
            <Text style={styles.subtitulo}>Perfil: Administrador</Text>

            {SECCIONES.map((seccion) => (
              <TouchableOpacity
                key={seccion.id}
                style={styles.opcion}
                onPress={() => elegir(() => onNavegar(seccion.id))}
              >
                <Text style={styles.opcionIcono}>{seccion.icono}</Text>
                <Text style={styles.opcionTexto}>{seccion.texto}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.opcion, styles.peligro]} onPress={() => elegir(onSalir)}>
              <Text style={styles.opcionTextoPeligro}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
          <Pressable style={styles.cerrarZona} onPress={() => setAbierto(false)} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#DDE3D8",
  },
  linea: { width: 18, height: 2, backgroundColor: "#2E5A2E", marginVertical: 2, borderRadius: 2 },
  fondo: { flex: 1, flexDirection: "row", backgroundColor: "rgba(43, 47, 43, 0.4)" },
  panel: {
    width: 280,
    backgroundColor: "#F4F7F1",
    paddingTop: 28,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cerrarZona: { flex: 1 },
  marca: { fontSize: 22, fontWeight: "700", color: "#2E5A2E" },
  subtitulo: { color: "#7A867A", marginBottom: 18, marginTop: 4 },
  opcion: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  opcionIcono: { fontSize: 18, marginRight: 10, width: 28 },
  opcionTexto: { color: "#2B2F2B", fontWeight: "700", fontSize: 15, flex: 1 },
  opcionTextoPeligro: { color: "#C62828", fontWeight: "700", fontSize: 15, flex: 1 },
  peligro: { borderColor: "#FFEBEE" },
});
