// src/screens/PagoScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { apiRequest } from "../services/apiClient";

export default function PagoScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { pedidoId } = route.params;

  const [metodo, setMetodo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [pedido, setPedido] = useState(null);
  const [comprobante, setComprobante] = useState(null);

  const metodos = [
    { id: "efectivo", label: "Efectivo", detalle: "Pagas en efectivo al recibir el pedido" },
    { id: "tarjeta", label: "Tarjeta débito/crédito", detalle: "Pagas con tu tarjeta" },
    { id: "pse", label: "PSE", detalle: "Pagas desde tu banco con PSE" },
  ];

  useEffect(() => {
    cargarPedido();
  }, [pedidoId]);

  async function cargarPedido() {
    try {
      const data = await apiRequest(`/api/pedidos/${encodeURIComponent(pedidoId)}`);
      setPedido(data);
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar el pedido");
      navigation.goBack();
    }
  }

  async function pagar() {
    if (!metodo) return Alert.alert("Selecciona un método", "Elige cómo vas a pagar");
    setCargando(true);
    try {
      await apiRequest(`/api/pedidos/${encodeURIComponent(pedidoId)}/pagar`, { method: "PATCH" });
      const ref = `MP-${Date.now().toString(36).toUpperCase()}`;
      setComprobante({
        ref,
        metodo,
        fecha: new Date().toLocaleString("es-CO"),
        total: pedido?.total || 0,
        items: pedido?.items || [],
      });
    } catch (e) {
      Alert.alert("Error", e.message || "No se pudo procesar el pago");
    } finally {
      setCargando(false);
    }
  }

  if (cargando && !pedido) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Cargando...</Text>
      </View>
    );
  }

  if (pedido?.pagado) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#2E7D32" }}>Este pedido ya está pagado</Text>
        <TouchableOpacity style={[styles.btnFinalizar, { width: "60%" }]} onPress={() => navigation.navigate("MisPedidos")}>
          <Text style={styles.btnFinalizarText}>Ver mis pedidos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (comprobante) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.comprobante}>
          <Text style={styles.compTitulo}>Pago confirmado</Text>
          <Text style={styles.compRef}>Comprobante: {comprobante.ref}</Text>
          <Text style={styles.compFecha}>{comprobante.fecha}</Text>
          <View style={styles.compLinea} />
          <Text style={styles.compMetodo}>Método: {metodos.find(m => m.id === comprobante.metodo)?.label || comprobante.metodo}</Text>
          <View style={styles.compLinea} />
          {comprobante.items.map((it, i) => (
            <Text key={i} style={styles.compItem}>
              {it.cantidad} × {it.nombre} — ${Number(it.precio || 0).toLocaleString("es-CO")}
            </Text>
          ))}
          <View style={styles.compLinea} />
          <Text style={styles.compTotal}>Total: ${Number(comprobante.total).toLocaleString("es-CO")}</Text>
          <TouchableOpacity style={styles.btnFinalizar} onPress={() => navigation.navigate("MisPedidos")}>
            <Text style={styles.btnFinalizarText}>Ver mis pedidos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnFinalizar, styles.btnSecundario]} onPress={() => navigation.navigate("Catalogo")}>
            <Text style={[styles.btnFinalizarText, styles.btnSecundarioText]}>Volver al catálogo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Pasarela de pagos</Text>
        <Text style={styles.subtitulo}>Pedido #{pedidoId?.slice(-6).toUpperCase()} — Total: ${Number(pedido?.total || 0).toLocaleString("es-CO")}</Text>
      </View>

      <Text style={styles.seccionTitulo}>Selecciona método de pago</Text>
      {metodos.map(m => (
        <TouchableOpacity
          key={m.id}
          style={[
            styles.opcion,
            metodo === m.id && styles.opcionSeleccionada,
          ]}
          onPress={() => setMetodo(m.id)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.opcionLabel}>{m.label}</Text>
            <Text style={styles.opcionDetalle}>{m.detalle}</Text>
          </View>
          {metodo === m.id ? <Text style={styles.check}>Seleccionado</Text> : null}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.btnPagar, !metodo && styles.btnDisabled]}
        onPress={pagar}
        disabled={!metodo || cargando}
      >
        {cargando ? <ActivityIndicator color="white" /> : <Text style={styles.btnPagarText}>Pagar ${Number(pedido?.total || 0).toLocaleString("es-CO")}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#2E7D32", padding: 20, borderRadius: 12, marginBottom: 16 },
  titulo: { color: "white", fontSize: 20, fontWeight: "700" },
  subtitulo: { color: "rgba(255,255,255,0.9)", marginTop: 4 },
  seccionTitulo: { fontSize: 16, fontWeight: "700", marginBottom: 12, color: "#2E7D32" },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    justifyContent: "space-between",
  },
  opcionSeleccionada: { borderColor: "#2E7D32", backgroundColor: "#E8F5E9" },
  opcionLabel: { fontSize: 16, color: "#212121" },
  opcionDetalle: { color: "#6B7A6B", fontSize: 12, marginTop: 2 },
  check: {
    color: "#2E7D32",
    fontWeight: "700",
    fontSize: 12,
    backgroundColor: "#C8E6C9",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  btnPagar: {
    marginTop: 24,
    backgroundColor: "#2E7D32",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  btnDisabled: { backgroundColor: "#A5D6A7" },
  btnPagarText: { color: "white", fontSize: 18, fontWeight: "700" },
  comprobante: { backgroundColor: "white", padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#E0E0E0" },
  compTitulo: { fontSize: 22, fontWeight: "700", color: "#2E7D32", textAlign: "center", marginBottom: 8 },
  compRef: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 4 },
  compFecha: { fontSize: 13, color: "#999", textAlign: "center", marginBottom: 12 },
  compLinea: { height: 1, backgroundColor: "#E0E0E0", marginVertical: 10 },
  compMetodo: { fontSize: 14, color: "#333", marginBottom: 10 },
  compItem: { fontSize: 14, color: "#333", marginBottom: 6 },
  compTotal: { fontSize: 18, fontWeight: "700", color: "#2E7D32", textAlign: "right", marginTop: 8 },
  btnFinalizar: { marginTop: 20, backgroundColor: "#2E7D32", padding: 14, borderRadius: 8, alignItems: "center" },
  btnFinalizarText: { color: "white", fontSize: 16, fontWeight: "600" },
  btnSecundario: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#2E7D32", marginTop: 10 },
  btnSecundarioText: { color: "#2E7D32" },
});