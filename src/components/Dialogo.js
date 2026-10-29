/**
 * Aviso modal visible también en el navegador.
 * Alert de React Native no siempre se muestra en la versión web.
 */
import React from "react";
import { Modal, Text, TouchableOpacity, View, StyleSheet } from "react-native";

export default function Dialogo({
  visible,
  titulo,
  mensaje,
  textoConfirmar = "Aceptar",
  textoCancelar,
  onConfirmar,
  onCancelar,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar || onConfirmar}>
      <View style={styles.fondo}>
        <View style={styles.caja}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensaje}>{mensaje}</Text>
          <View style={styles.acciones}>
            {textoCancelar ? (
              <TouchableOpacity style={styles.secundario} onPress={onCancelar}>
                <Text style={styles.secundarioTexto}>{textoCancelar}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.principal} onPress={onConfirmar}>
              <Text style={styles.principalTexto}>{textoConfirmar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "rgba(43, 47, 43, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  caja: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  titulo: { fontSize: 18, fontWeight: "700", color: "#2E5A2E", marginBottom: 8 },
  mensaje: { color: "#4A554A", lineHeight: 20, marginBottom: 18 },
  acciones: { flexDirection: "row", justifyContent: "flex-end" },
  secundario: { paddingVertical: 12, paddingHorizontal: 14, marginRight: 8 },
  secundarioTexto: { color: "#5A6B57", fontWeight: "700" },
  principal: { backgroundColor: "#2E7D32", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  principalTexto: { color: "#fff", fontWeight: "700" },
});
