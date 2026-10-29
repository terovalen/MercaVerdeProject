/**
 * Búsqueda y filtros del catálogo.
 * El filtrado en sí está en el dominio; este componente solo captura el criterio.
 * No hay filtro de existencias: el stock es dato privado del inventario.
 */
import React from "react";
import { Text, TextInput, TouchableOpacity, ScrollView, View, StyleSheet } from "react-native";
import { rangoPrecioInvalido } from "../domain/filtrosCatalogo";

export default function FiltrosCatalogo({ valores, onChange, categorias, visibles, total }) {
  /**
   * Actualiza un solo campo del criterio sin perder los demás.
   */
  function cambiar(campo, valor) {
    onChange({ ...valores, [campo]: valor });
  }

  const rangoInvalido = rangoPrecioInvalido(valores.precioMin, valores.precioMax);

  return (
    <View style={styles.caja}>
      <TextInput
        style={styles.input}
        placeholder="Buscar por nombre"
        placeholderTextColor="#AAA"
        value={valores.texto}
        onChangeText={(texto) => cambiar("texto", texto)}
      />

      <Text style={styles.rotulo}>Categoría</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categorias.map((categoria) => (
          <TouchableOpacity
            key={categoria}
            style={[styles.chip, valores.categoria === categoria && styles.chipActivo]}
            onPress={() => cambiar("categoria", categoria)}
          >
            <Text style={[styles.chipTexto, valores.categoria === categoria && styles.chipTextoActivo]}>
              {categoria}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.rotulo}>Rango de precio</Text>
      <View style={styles.fila}>
        <TextInput
          style={[styles.input, styles.inputMitad]}
          placeholder="Mínimo"
          placeholderTextColor="#AAA"
          keyboardType="numeric"
          value={valores.precioMin}
          onChangeText={(precioMin) => cambiar("precioMin", precioMin)}
        />
        <TextInput
          style={[styles.input, styles.inputMitad]}
          placeholder="Máximo"
          placeholderTextColor="#AAA"
          keyboardType="numeric"
          value={valores.precioMax}
          onChangeText={(precioMax) => cambiar("precioMax", precioMax)}
        />
      </View>
      {rangoInvalido ? (
        <Text style={styles.error}>El precio mínimo no puede ser mayor que el máximo.</Text>
      ) : null}

      <Text style={styles.conteo}>
        {visibles} de {total} productos
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { marginBottom: 8 },
  rotulo: { color: "#5A6B57", fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDE3D8",
    marginBottom: 8,
  },
  inputMitad: { flex: 1, marginHorizontal: 4 },
  fila: { flexDirection: "row", alignItems: "center", marginHorizontal: -4 },
  chip: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DDE3D8",
  },
  chipActivo: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  chipTexto: { color: "#2E5A2E", fontSize: 13 },
  chipTextoActivo: { color: "#fff", fontWeight: "700" },
  error: { color: "#C62828", fontSize: 12, marginBottom: 4 },
  conteo: { color: "#7A867A", fontSize: 12, marginBottom: 4 },
});
