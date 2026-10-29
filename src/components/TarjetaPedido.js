/**
 * Tarjeta de un pedido: estado, ítems, total y acciones.
 * La regla de cancelación se decide en el dominio; aquí solo se refleja.
 */
import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import Etiqueta from "./Etiqueta";
import { mensajeNoCancelable, metaEstado, puedeCancelar } from "../domain/estadosPedido";
import { formatearFecha, formatearPrecio } from "../utils/formato";

export default function TarjetaPedido({ pedido, onCancelar, onReintentar }) {
  const estado = metaEstado(pedido.estado);
  const cancelable = puedeCancelar(pedido.estado);
  const pendiente = pedido.syncEstado === "pendiente";
  const conError = pedido.syncEstado === "error";

  return (
    <View style={styles.tarjeta}>
      <View style={styles.fila}>
        <Text style={styles.titulo}>Pedido {String(pedido.id).slice(0, 10)}</Text>
        <Text style={styles.fecha}>{formatearFecha(pedido.creadoEn)}</Text>
      </View>

      <View style={styles.etiquetas}>
        <Etiqueta texto={estado.etiqueta} color={estado.color} fondo={estado.fondo} />
        {pendiente ? (
          <Etiqueta texto="Pendiente por sincronizar" color="#E65100" fondo="#FFF8E1" />
        ) : null}
        {conError ? <Etiqueta texto="No se pudo sincronizar" color="#C62828" fondo="#FFEBEE" /> : null}
      </View>

      {(pedido.items || []).map((item) => (
        <Text key={item.productoId} style={styles.item}>
          {item.cantidad} × {item.nombre}
        </Text>
      ))}

      <Text style={styles.total}>{formatearPrecio(pedido.total)}</Text>

      {conError && pedido.syncMensaje ? <Text style={styles.error}>{pedido.syncMensaje}</Text> : null}

      {cancelable ? (
        <TouchableOpacity style={styles.boton} onPress={() => onCancelar(pedido)}>
          <Text style={styles.botonTexto}>Cancelar pedido</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.bloqueado}>{mensajeNoCancelable(pedido.estado)}</Text>
      )}

      {conError && pedido.syncTipo ? (
        <TouchableOpacity style={styles.botonSecundario} onPress={() => onReintentar(pedido)}>
          <Text style={styles.botonSecundarioTexto}>Reintentar sincronización</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titulo: { fontWeight: "700", color: "#2B2F2B", flex: 1 },
  fecha: { color: "#7A867A", fontSize: 12, marginLeft: 8 },
  etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 8 },
  item: { color: "#4A554A", marginBottom: 2 },
  total: { marginTop: 8, fontWeight: "700", color: "#2E7D32", fontSize: 16 },
  error: { color: "#C62828", marginTop: 6, fontSize: 12 },
  bloqueado: { color: "#7A867A", marginTop: 8, fontSize: 12 },
  boton: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C62828",
    padding: 10,
    alignItems: "center",
  },
  botonTexto: { color: "#C62828", fontWeight: "700" },
  botonSecundario: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#2E7D32",
    padding: 10,
    alignItems: "center",
  },
  botonSecundarioTexto: { color: "#fff", fontWeight: "700" },
});
