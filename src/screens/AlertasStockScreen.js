// src/screens/AlertasStockScreen.js
// FE-01. Pantalla operativa: no es un texto informativo.
// Cruza los productos seguidos con el catálogo (red o caché) y dice
// si están agotados, queda poco o todavía hay.

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { cargarCatalogoDelUsuario } from "../casosdeuso/cargarCatalogo";
import { alternarSeguimiento, cargarAlertas } from "../casosdeuso/seguimientoStock";
import { UMBRAL_STOCK_BAJO } from "../domain/alertasStock";
import { useAuth } from "../context/AuthContext";
import { useConexion } from "../context/ConexionContext";
import Etiqueta from "../components/Etiqueta";

export default function AlertasStockScreen({ navigation }) {
  const { usuario } = useAuth();
  const { enLinea } = useConexion();
  const [fichas, setFichas] = useState([]);
  const [cargando, setCargando] = useState(true);

  /**
   * Carga catálogo (caché primero) y arma las alertas de lo que la persona sigue.
   */
  const cargar = useCallback(async () => {
    const catalogo = await cargarCatalogoDelUsuario(usuario.uid, enLinea);
    const alertas = await cargarAlertas(usuario.uid, catalogo.productos);
    setFichas(alertas);
    setCargando(false);
  }, [usuario?.uid, enLinea]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  /**
   * Quita el producto de la lista seguida y refresca las fichas.
   */
  async function dejarDeSeguir(productoId) {
    await alternarSeguimiento(usuario.uid, productoId);
    await cargar();
  }

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.ayuda}>
        Sigues estos productos para no enterarte en la fila de que ya se acabaron. Queda poco
        significa {UMBRAL_STOCK_BAJO} unidades o menos.
      </Text>

      <FlatList
        data={fichas}
        keyExtractor={(item) => item.productoId}
        ListEmptyComponent={
          <View>
            <Text style={styles.vacio}>
              Todavía no sigues ningún producto. Ábrelo en el catálogo y toca “Seguir
              disponibilidad”.
            </Text>
            <TouchableOpacity style={styles.boton} onPress={() => navigation.navigate("Catalogo")}>
              <Text style={styles.botonTexto}>Ir al catálogo</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const producto = item.producto;
          return (
            <View style={styles.tarjeta}>
              <View style={styles.fila}>
                <Text style={styles.nombre}>{producto?.nombre || "Sin copia en el catálogo"}</Text>
                <Etiqueta texto={item.etiqueta} color={item.color} fondo={item.fondo} />
              </View>
              <Text style={styles.detalle}>
                {producto
                  ? `${producto.disponibilidad == null ? "Sin dato de inventario (stock privado)" : `${producto.disponibilidad} ${producto.unidad || ""}`} · ${producto.categoria || "Sin categoría"}`
                  : "Conéctate una vez para descargar este producto."}
              </Text>
              {producto ? (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("DetalleProducto", {
                      productoId: item.productoId,
                      producto,
                    })
                  }
                >
                  <Text style={styles.enlace}>Ver producto</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => dejarDeSeguir(item.productoId)}>
                <Text style={styles.quitar}>Dejar de seguir</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#F4F7F1", padding: 16 },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F1" },
  ayuda: { color: "#5A6B57", marginBottom: 12, lineHeight: 18 },
  vacio: { textAlign: "center", marginTop: 24, color: "#7A867A" },
  tarjeta: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10 },
  fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  nombre: { fontWeight: "700", color: "#2B2F2B", flex: 1 },
  detalle: { color: "#5A6B57", marginTop: 6 },
  enlace: { color: "#2E7D32", fontWeight: "700", marginTop: 8 },
  quitar: { color: "#C62828", marginTop: 8, fontWeight: "600" },
  boton: {
    marginTop: 16,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  botonTexto: { color: "#fff", fontWeight: "700" },
});
