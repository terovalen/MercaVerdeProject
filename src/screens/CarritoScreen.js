// src/screens/CarritoScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useConexion } from "../context/ConexionContext";
import { useSync } from "../context/SyncContext";
import { confirmarPedidoUsuario } from "../casosdeuso/confirmarPedido";
import { formatearPrecio } from "../utils/formato";

export default function CarritoScreen({ navigation }) {
  const { items, total, actualizarCantidad, quitarProducto, vaciarCarrito } = useCart();
  const { usuario } = useAuth();
  const { enLinea } = useConexion();
  const { sincronizar, refrescar } = useSync();
  const [confirmando, setConfirmando] = useState(false);

  /**
   * Confirma en Firestore si hay red. Si no hay, guarda el pedido en el
   * dispositivo y lo deja pendiente por sincronizar.
   */
  async function manejarConfirmar() {
    setConfirmando(true);
    try {
      const resultado = await confirmarPedidoUsuario({
        usuarioId: usuario.uid,
        generoComprador: usuario.genero,
        items,
        enLinea,
      });

      if (!resultado.ok) {
        Alert.alert("No se pudo confirmar el pedido", resultado.mensaje);
        return;
      }

      vaciarCarrito();
      if (resultado.pendiente && enLinea === true) {
        await sincronizar();
      }
      await refrescar();

      Alert.alert(
        resultado.pendiente ? "Pedido pendiente" : "Pedido confirmado",
        `${resultado.mensaje} Total ${formatearPrecio(resultado.pedido.total)}.`
      );
      navigation.navigate("MisPedidos");
    } catch (error) {
      Alert.alert("No se pudo confirmar el pedido", error.message);
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.volver}>Volver</Text>
      </TouchableOpacity>
      <Text style={styles.titulo}>Tu pedido</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.productoId}
        ListEmptyComponent={<Text style={styles.vacio}>Aún no has agregado productos.</Text>}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.precioUnidad}>
                {formatearPrecio(item.precio)} / {item.unidad}
              </Text>
            </View>

            <View style={styles.selectorCantidad}>
              <TouchableOpacity
                style={styles.botonCantidad}
                onPress={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
              >
                <Text style={styles.botonCantidadTexto}>−</Text>
              </TouchableOpacity>
              <Text style={styles.cantidad}>{item.cantidad}</Text>
              <TouchableOpacity
                style={styles.botonCantidad}
                onPress={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
              >
                <Text style={styles.botonCantidadTexto}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => quitarProducto(item.productoId)}>
              <Text style={styles.quitar}>Quitar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.resumen}>
        <Text style={styles.totalTexto}>Total</Text>
        <Text style={styles.totalValor}>{formatearPrecio(total)}</Text>
      </View>

      <TouchableOpacity style={styles.boton} onPress={manejarConfirmar} disabled={confirmando}>
        {confirmando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botonTexto}>
            {enLinea === false ? "Guardar pedido sin conexión" : "Confirmar pedido"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#F4F7F1", paddingTop: 12, paddingHorizontal: 16 },
  volver: { color: "#2E7D32", fontWeight: "600", marginBottom: 8 },
  titulo: { fontSize: 22, fontWeight: "700", color: "#2E5A2E", marginBottom: 12 },
  vacio: { textAlign: "center", marginTop: 40, color: "#7A867A" },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  nombre: { fontWeight: "600", color: "#2B2F2B" },
  precioUnidad: { color: "#7A867A", fontSize: 12, marginTop: 2 },
  selectorCantidad: { flexDirection: "row", alignItems: "center", marginHorizontal: 10 },
  botonCantidad: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#DDE3D8",
    justifyContent: "center",
    alignItems: "center",
  },
  botonCantidadTexto: { fontWeight: "700", color: "#2E5A2E" },
  cantidad: { marginHorizontal: 10, fontWeight: "600" },
  quitar: { color: "#C62828", fontSize: 12, fontWeight: "600" },
  resumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#DDE3D8",
    paddingTop: 12,
    marginTop: 8,
  },
  totalTexto: { fontSize: 16, fontWeight: "600", color: "#2B2F2B" },
  totalValor: { fontSize: 20, fontWeight: "700", color: "#2E7D32" },
  boton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 16,
  },
  botonTexto: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
