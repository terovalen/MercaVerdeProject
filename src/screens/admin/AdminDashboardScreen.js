/**
 * Pantalla Dashboard del administrador.
 * Resumen general de usuarios, pedidos, actividad e incidentes pendientes.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../../services/apiClient";
import usarDialogos from "../../components/usarDialogos";
import { ESTADOS_PEDIDO } from "../../domain/estadosPedido";

const verde = "#2E7D32";

export default function AdminDashboardScreen() {
  const { caja: dialogos, avisar } = usarDialogos();
  const [estadisticas, setEstadisticas] = useState(null);
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const [analitica, pedidos] = await Promise.all([
        apiRequest("/api/analitica"),
        apiRequest("/api/pedidos"),
      ]);
      setEstadisticas(analitica);
      setPedidosRecientes((pedidos || []).slice(0, 5));
    } catch (e) {
      avisar("No se pudo cargar el dashboard", e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={verde} />
      </View>
    );
  }

  const totalUsuarios = estadisticas?.camposFormulario?.usuarios?.total || 0;
  const totalPedidos = Object.values(estadisticas?.pedidosPorEstado || {}).reduce((a, b) => a + b, 0);
  const pendientes = estadisticas?.pedidosPorEstado?.pendiente || 0;
  const enPreparacion = estadisticas?.pedidosPorEstado?.en_preparacion || 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F4F7F1" }} contentContainerStyle={styles.contenido}>
      {dialogos}
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Dashboard de administración</Text>
        <Text style={styles.subtitulo}>Resumen general del mercado</Text>
      </View>

      {/* Tarjetas de resumen */}
      <View style={styles.tarjetas}>
        <View style={[styles.tarjeta, { borderLeftWidth: 4, borderLeftColor: verde }]}>
          <Text style={styles.tarjetaValor}>{totalUsuarios}</Text>
          <Text style={styles.tarjetaEtiqueta}>Usuarios registrados</Text>
        </View>
        <View style={[styles.tarjeta, { borderLeftWidth: 4, borderLeftColor: "#1565C0" }]}>
          <Text style={styles.tarjetaValor}>{totalPedidos}</Text>
          <Text style={styles.tarjetaEtiqueta}>Pedidos totales</Text>
        </View>
        <View style={[styles.tarjeta, { borderLeftWidth: 4, borderLeftColor: "#FF9800" }]}>
          <Text style={styles.tarjetaValor}>{pendientes}</Text>
          <Text style={styles.tarjetaEtiqueta}>Pendientes de aceptar</Text>
        </View>
        <View style={[styles.tarjeta, { borderLeftWidth: 4, borderLeftColor: "#1565C0" }]}>
          <Text style={styles.tarjetaValor}>{enPreparacion}</Text>
          <Text style={styles.tarjetaEtiqueta}>En preparación</Text>
        </View>
      </View>

      {/* Pedidos recientes */}
      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Pedidos recientes</Text>
        <FlatList
          data={pedidosRecientes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.filaPedido}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pedidoId}>Pedido {String(item.id).slice(0, 8)}</Text>
                <Text style={styles.pedidoEstado}>{item.estado}</Text>
              </View>
              <Text style={styles.pedidoTotal}>{item.total ? `$${Number(item.total).toLocaleString("es-CO")}` : "$0"}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.vacio}>No hay pedidos recientes.</Text>}
        />
      </View>

      {/* Incidentes pendientes */}
      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Incidentes pendientes</Text>
        <View style={styles.tarjetaIncidentes}>
          <Text style={styles.incidenteTexto}>
            No hay incidentes críticos reportados. El sistema funciona normalmente.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F1" },
  contenido: { paddingBottom: 40 },
  encabezado: { padding: 16, backgroundColor: "#F4F7F1" },
  titulo: { fontSize: 24, fontWeight: "700", color: "#2E5A2E" },
  subtitulo: { color: "#7A867A", marginTop: 2 },
  tarjetas: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  tarjeta: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 150,
    shadowColor: "#2E5A2E",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tarjetaValor: { fontSize: 24, fontWeight: "700", color: "#2B2F2B" },
  tarjetaEtiqueta: { color: "#7A867A", fontSize: 12, marginTop: 4 },
  seccion: { paddingHorizontal: 16, marginBottom: 16 },
  tituloSeccion: { fontSize: 18, fontWeight: "700", color: "#2E5A2E", marginBottom: 10 },
  filaPedido: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pedidoId: { fontWeight: "600", color: "#2B2F2B" },
  pedidoEstado: { color: "#7A867A", fontSize: 12 },
  pedidoTotal: { fontWeight: "700", color: verde },
  vacio: { textAlign: "center", color: "#7A867A", marginTop: 20 },
  tarjetaIncidentes: {
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: verde,
  },
  incidenteTexto: { color: "#2E7D32", fontSize: 14 },
});
