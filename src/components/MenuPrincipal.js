/**
 * Menú lateral con secciones: comprador (catálogo y mis pedidos) y
 * vendedor/admin (inventario, tickets de pedidos, y analítica del admin).
 * Cada sección navega a Operacion con el parámetro `seccion`.
 */
import React, { useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View, StyleSheet } from "react-native";

export default function MenuPrincipal({
  rol = "comprador",
  onInicio,
  onPedidos,
  onInventario,
  onTickets,
  onAnalitica,
  onSalir,
}) {
  const [abierto, setAbierto] = useState(false);

  /**
   * Cierra el panel y luego ejecuta la acción, para que la navegación
   * no quede tapada por el modal.
   */
  function elegir(accion) {
    setAbierto(false);
    accion?.();
  }

  return (
    <>
      <TouchableOpacity
        style={styles.boton}
        onPress={() => setAbierto(true)}
        accessibilityLabel="Abrir menú"
      >
        <View style={styles.linea} />
        <View style={styles.linea} />
        <View style={styles.linea} />
      </TouchableOpacity>

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <View style={styles.fondo}>
          <View style={styles.panel}>
            <Text style={styles.marca}>MercaVerde</Text>
            <Text style={styles.subtitulo}>Perfil: {rol}</Text>

            {rol === "comprador" ? <>
              <Opcion texto="Catálogo" onPress={() => elegir(onInicio)} />
              <Opcion texto="Mis pedidos" onPress={() => elegir(onPedidos)} />
            </> : <>
              <Opcion texto="Inventario" onPress={() => elegir(onInventario)} />
              <Opcion texto="Tickets de pedidos" onPress={() => elegir(onTickets)} />
              {rol === "administrador" ? (
                <Opcion texto="Analítica y métricas" onPress={() => elegir(onAnalitica)} />
              ) : null}
            </>}
            <Opcion texto="Cerrar sesión" peligro onPress={() => elegir(onSalir)} />
          </View>
          <Pressable style={styles.cerrarZona} onPress={() => setAbierto(false)} />
        </View>
      </Modal>
    </>
  );
}

/**
 * Una fila del menú.
 */
function Opcion({ texto, onPress, peligro }) {
  return (
    <TouchableOpacity style={styles.opcion} onPress={onPress}>
      <Text style={[styles.opcionTexto, peligro && styles.peligro]}>{texto}</Text>
    </TouchableOpacity>
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
    width: 260,
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
  },
  opcionTexto: { color: "#2B2F2B", fontWeight: "700", fontSize: 16 },
  peligro: { color: "#C62828" },
});
