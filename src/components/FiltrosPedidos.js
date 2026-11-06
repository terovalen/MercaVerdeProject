/**
 * Filtros de la lista de tickets de pedidos: estados (con conteo),
 * rango de fechas y búsqueda por id, comprador o producto.
 * Las reglas de filtrado viven en el dominio (ticketsPedidos.js).
 */
import React from "react";
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from "react-native";

const VERDE = "#2E7D32";

const FILTROS_ESTADO = [
  { id: "activos", etiqueta: "Activos" },
  { id: "todos", etiqueta: "Todos" },
  { id: "recibido", etiqueta: "Recibidos" },
  { id: "cambio_pendiente", etiqueta: "Esperando comprador" },
  { id: "en_preparacion", etiqueta: "En preparación" },
  { id: "listo", etiqueta: "Listos" },
  { id: "entregado", etiqueta: "Entregados" },
  { id: "cancelado", etiqueta: "Cancelados" },
];

const FILTROS_FECHA = [
  { id: "todas", etiqueta: "Todas" },
  { id: "hoy", etiqueta: "Hoy" },
  { id: "semana", etiqueta: "7 días" },
  { id: "mes", etiqueta: "30 días" },
];

export default function FiltrosPedidos({ valores, onChange, pedidos }) {
  function cambiar(campo, valor) {
    onChange({ ...valores, [campo]: valor });
  }

  // Conteo por filtro para mostrar cuántos tickets caen en cada caso.
  const conteos = {
    todos: pedidos.length,
    activos: pedidos.filter(p => ["recibido", "en_preparacion", "listo", "cambio_pendiente"].includes(p.estado)).length,
  };
  for (const f of FILTROS_ESTADO) {
    conteos[f.id] = conteos[f.id] ?? pedidos.filter(p => p.estado === f.id).length;
  }

  function Chip({ activo, etiqueta, conteo, onPress }) {
    return (
      <TouchableOpacity style={[styles.chip, activo && styles.chipActivo]} onPress={onPress}>
        <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
          {etiqueta}{conteo != null ? ` (${conteo})` : ""}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.caja}>
      <TextInput
        style={styles.input}
        placeholder="Buscar por id, comprador o producto…"
        placeholderTextColor="#AAA"
        value={valores.texto}
        onChangeText={v => cambiar("texto", v)}
      />

      <Text style={styles.rotulo}>Estado</Text>
      <View style={styles.fila}>
        {FILTROS_ESTADO.map(f => (
          <Chip
            key={f.id}
            activo={valores.estado === f.id}
            etiqueta={f.etiqueta}
            conteo={conteos[f.id]}
            onPress={() => cambiar("estado", f.id)}
          />
        ))}
      </View>

      <Text style={styles.rotulo}>Fecha</Text>
      <View style={styles.fila}>
        {FILTROS_FECHA.map(f => (
          <Chip
            key={f.id}
            activo={valores.rango === f.id}
            etiqueta={f.etiqueta}
            conteo={null}
            onPress={() => cambiar("rango", f.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { marginTop: 6 },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D5DDD3",
    borderRadius: 8,
    padding: 9,
  },
  rotulo: { fontWeight: "700", color: "#2B2F2B", marginTop: 10, marginBottom: 4 },
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D5DDD3",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipActivo: { backgroundColor: VERDE, borderColor: VERDE },
  chipTexto: { color: "#2B2F2B", fontSize: 12 },
  chipTextoActivo: { color: "white", fontWeight: "600" },
});
