/**
 * Selector de producto para sustituciones: busca por nombre y se elige
 * tocando. Nada de copiar IDs de Firestore a mano. Muestra precio, unidad
 * y existencias (dadas por /api/inventario, privado de inventario).
 */
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { formatearPrecio } from "../utils/formato";

const VERDE = "#2E7D32";

export default function SelectorProducto({ visible, productos, cerrar, onElegir, subtitulo }) {
  const [texto, setTexto] = useState("");

  // Solo productos activos y con la búsqueda escrita aplicada.
  const disponibles = useMemo(() => {
    const q = String(texto).trim().toLowerCase();
    return (productos || []).filter(p => !q || String(p.nombre || "").toLowerCase().includes(q));
  }, [productos, texto]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <View style={styles.cuerpo}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.titulo}>Elegir producto de reemplazo</Text>
          <TouchableOpacity onPress={cerrar} style={{ marginLeft: "auto" }}>
            <Text style={{ color: "#7A867A", fontWeight: "600" }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Buscar producto por nombre…"
          placeholderTextColor="#AAA"
          value={texto}
          onChangeText={setTexto}
        />

        <FlatList
          data={disponibles}
          keyExtractor={p => p.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.vacio}>Ningún producto coincide con «{texto}».</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.fila} onPress={() => onElegir(item)}>
              {item.imagenUrl ? (
                <Image source={{ uri: item.imagenUrl }} style={styles.imagen} />
              ) : (
                <View style={[styles.imagen, styles.imagenVacia]}><Text style={{ color: "#9AA79A", fontSize: 11 }}>Sin img</Text></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600" }}>{item.nombre}</Text>
                <Text style={styles.meta}>
                  {formatearPrecio(item.precio)} / {item.unidad} · stock {item.disponibilidad ?? 0}
                </Text>
              </View>
              <Text style={styles.elegir}>Elegir</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cuerpo: { flex: 1, backgroundColor: "#F4F7F1", padding: 16, paddingTop: 50 },
  titulo: { fontSize: 20, fontWeight: "700", color: VERDE, flex: 1 },
  subtitulo: { color: "#5A6B57", marginTop: 4, marginBottom: 8 },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D5DDD3",
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  vacio: { textAlign: "center", marginTop: 20, color: "#7A867A" },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  imagen: { width: 48, height: 48, borderRadius: 8, marginRight: 10 },
  imagenVacia: { backgroundColor: "#E9EEE6", justifyContent: "center", alignItems: "center" },
  meta: { color: "#7A867A", fontSize: 12, marginTop: 2 },
  elegir: { color: VERDE, fontWeight: "700", marginLeft: 8 },
});
