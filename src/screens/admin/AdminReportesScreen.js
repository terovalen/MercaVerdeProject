/**
 * Pantalla Reportes y analíticas del administrador.
 * Métricas de pedidos, productos, usuarios y distribución de campos.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../../services/apiClient";
import usarDialogos from "../../components/usarDialogos";

const verde = "#2E7D32";

export default function AdminReportesScreen() {
  const { caja: dialogos, avisar } = usarDialogos();
  const [analitica, setAnalitica] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const data = await apiRequest("/api/analitica");
      setAnalitica(data);
    } catch (e) {
      avisar("No se pudo cargar reportes", e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={verde} />
      </View>
    );
  }

  const pedidosPorEstado = analitica?.pedidosPorEstado || {};
  const pedidosPorGenero = analitica?.pedidosPorGenero || {};
  const productosPopulares = analitica?.productosPopulares || [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F4F7F1" }} contentContainerStyle={styles.contenido}>
      {dialogos}
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Reportes y analíticas</Text>
        <Text style={styles.subtitulo}>Distribución de pedidos, productos y usuarios</Text>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Pedidos por estado</Text>
        {Object.entries(pedidosPorEstado).map(([estado, cantidad]) => (
          <View key={estado} style={styles.filaReporte}>
            <Text style={styles.reporteEtiqueta}>{estado.replace("_", " ")}</Text>
            <Text style={styles.reporteValor}>{cantidad}</Text>
          </View>
        ))}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Pedidos por género</Text>
        {Object.entries(pedidosPorGenero).map(([genero, cantidad]) => (
          <View key={genero} style={styles.filaReporte}>
            <Text style={styles.reporteEtiqueta}>{genero}</Text>
            <Text style={styles.reporteValor}>{cantidad}</Text>
          </View>
        ))}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Productos más comprados</Text>
        {productosPopulares.length > 0 ? (
          productosPopulares.map((p, i) => (
            <View key={`${p.producto}-${p.genero}`} style={styles.filaPopular}>
              <Text style={styles.numero}>{i + 1}.</Text>
              <Text style={styles.productoNombre}>{p.producto}</Text>
              <Text style={styles.productoGenero}>{p.genero}</Text>
              <Text style={styles.productoCantidad}>{p.cantidad}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.vacio}>No hay datos de productos populares.</Text>
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Distribución de campos</Text>
        <Text style={styles.nota}>
          Los campos de precio, existencias y otros se muestran por valor registrado.
          Al ampliar los formularios, la API añade sus nuevos campos a este resumen.
        </Text>
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
  seccion: { paddingHorizontal: 16, marginBottom: 16 },
  tituloSeccion: { fontSize: 18, fontWeight: "700", color: "#2E5A2E", marginBottom: 10 },
  filaReporte: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reporteEtiqueta: { color: "#2B2F2B", fontSize: 14 },
  reporteValor: { fontWeight: "700", color: verde, fontSize: 16 },
  filaPopular: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  numero: { fontWeight: "700", color: "#7A867A" },
  productoNombre: { fontWeight: "600", color: "#2B2F2B", flex: 1, marginHorizontal: 10 },
  productoGenero: { color: "#5A6B57", fontSize: 12 },
  productoCantidad: { fontWeight: "700", color: verde },
  vacio: { textAlign: "center", color: "#7A867A", marginTop: 20 },
  nota: { color: "#5A6B57", fontSize: 12, marginTop: 8, lineHeight: 20 },
});
