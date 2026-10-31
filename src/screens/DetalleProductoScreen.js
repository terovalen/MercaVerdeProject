// src/screens/DetalleProductoScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { fuenteImagenProducto, obtenerProducto } from "../services/catalogoService";
import { leerCatalogoLocal } from "../data/repositorioLocal";
import { alternarSeguimiento, obtenerSeguidos } from "../casosdeuso/seguimientoStock";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useConexion } from "../context/ConexionContext";
import { formatearPrecio } from "../utils/formato";

export default function DetalleProductoScreen({ route, navigation }) {
  const { productoId, producto: productoInicial } = route.params;
  const { usuario } = useAuth();
  const { enLinea } = useConexion();
  const { agregarProducto } = useCart();
  const [producto, setProducto] = useState(productoInicial || null);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(!productoInicial);
  const [siguiendo, setSiguiendo] = useState(false);

  useEffect(() => {
    let vivo = true;

    /**
     * Muestra en este orden: lo que trajo la navegación, la caché local
     * y, solo si hay red, el documento fresco de Firestore.
     */
    async function cargar() {
      try {
        if (productoInicial?.id === productoId) {
          setProducto(productoInicial);
          setCargando(false);
        } else if (!productoInicial) {
          const cache = await leerCatalogoLocal(usuario.uid);
          const local = cache?.productos?.find((item) => item.id === productoId) || null;
          if (vivo && local) {
            setProducto(local);
            setCargando(false);
          }
        }

        const ids = await obtenerSeguidos(usuario.uid);
        if (vivo) setSiguiendo(ids.includes(productoId));

        if (enLinea !== true) {
          if (vivo) setCargando(false);
          return;
        }

        const fresco = await obtenerProducto(productoId);
        if (vivo) setProducto(fresco);
      } catch {
        // Si la red falla y no hay copia local, el estado vacío lo explica.
        // No se hace goBack: una pantalla en blanco o un spinner eterno
        // anula el criterio de modo offline.
      } finally {
        if (vivo) setCargando(false);
      }
    }

    cargar();
    return () => {
      vivo = false;
    };
  }, [productoId, enLinea, usuario?.uid]);

  /**
   * Agrega la cantidad elegida al carrito persistido.
   * El catálogo público ya no trae existencias: solo se respeta el límite si
   * el dispositivo tiene una copia con stock (caché antigua); la verificación
   * definitiva de inventario la hace el servidor al procesar el pedido.
   */
  function manejarAgregar() {
    if (!producto) return;
    const mostrada = producto.disponibilidad == null ? null : Number(producto.disponibilidad);
    if (mostrada != null && mostrada <= 0) {
      Alert.alert("Sin existencias", "Este producto está agotado por ahora.");
      return;
    }
    if (mostrada != null && cantidad > mostrada) {
      Alert.alert(
        "Cantidad no disponible",
        `Solo quedan ${mostrada} ${producto.unidad}.`
      );
      return;
    }
    agregarProducto(producto, cantidad);
    Alert.alert("Agregado", `${producto.nombre} se agregó al pedido.`);
    navigation.goBack();
  }

  /**
   * FE-01: marca o desmarca el producto para vigilar si se agota.
   * La lista queda en el dispositivo y se borra al cerrar sesión.
   */
  async function manejarSeguir() {
    const siguientes = await alternarSeguimiento(usuario.uid, productoId);
    setSiguiendo(siguientes.includes(productoId));
  }

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!producto) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.vacio}>
          No hay una copia de este producto en el dispositivo. Conéctate una vez y ábrelo desde el
          catálogo.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.botonSeguirTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido}>
      {fuenteImagenProducto(producto.imagenUrl) ? (
        <Image source={fuenteImagenProducto(producto.imagenUrl)} style={styles.imagen} />
      ) : (
        <View style={[styles.imagen, styles.imagenPlaceholder]}>
          <Text style={{ color: "#9AA79A" }}>Sin imagen</Text>
        </View>
      )}

      <Text style={styles.nombre}>{producto.nombre}</Text>
      <Text style={styles.categoria}>{producto.categoria}</Text>
      <Text style={styles.precio}>
        {formatearPrecio(producto.precio)} / {producto.unidad}
      </Text>
      <Text style={styles.descripcion}>{producto.descripcion}</Text>
      <Text style={styles.productor}>Productor: {producto.productor}</Text>

      <View style={styles.selectorCantidad}>
        <TouchableOpacity
          style={styles.botonCantidad}
          onPress={() => setCantidad((valor) => Math.max(1, valor - 1))}
        >
          <Text style={styles.botonCantidadTexto}>−</Text>
        </TouchableOpacity>
        <Text style={styles.cantidad}>{cantidad}</Text>
        <TouchableOpacity
          style={styles.botonCantidad}
          onPress={() => setCantidad((valor) => valor + 1)}
        >
          <Text style={styles.botonCantidadTexto}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.boton} onPress={manejarAgregar}>
        <Text style={styles.botonTexto}>Agregar al pedido</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonSeguir} onPress={manejarSeguir}>
        <Text style={styles.botonSeguirTexto}>
          {siguiendo ? "Dejar de seguir disponibilidad" : "Seguir disponibilidad"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#F4F7F1" },
  contenido: { padding: 20, paddingBottom: 32 },
  vacio: { color: "#5A6B57", textAlign: "center", marginBottom: 16, paddingHorizontal: 24 },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F1" },
  imagen: { width: "100%", height: 180, borderRadius: 14, marginBottom: 16 },
  imagenPlaceholder: { backgroundColor: "#E9EEE6", justifyContent: "center", alignItems: "center" },
  nombre: { fontSize: 24, fontWeight: "700", color: "#2B2F2B" },
  categoria: { color: "#7A867A", marginTop: 2, marginBottom: 8 },
  precio: { fontSize: 20, fontWeight: "600", color: "#2E7D32", marginBottom: 10 },
  descripcion: { color: "#4A554A", lineHeight: 20, marginBottom: 10 },
  productor: { color: "#5A6B57", marginBottom: 6 },
  selectorCantidad: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  botonCantidad: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#DDE3D8",
    justifyContent: "center",
    alignItems: "center",
  },
  botonCantidadTexto: { fontSize: 20, fontWeight: "700", color: "#2E5A2E" },
  cantidad: { fontSize: 18, fontWeight: "600", marginHorizontal: 20 },
  boton: { backgroundColor: "#2E7D32", borderRadius: 12, padding: 16, alignItems: "center" },
  botonTexto: { color: "#fff", fontWeight: "700", fontSize: 16 },
  botonSeguir: {
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  botonSeguirTexto: { color: "#2E7D32", fontWeight: "700" },
});
