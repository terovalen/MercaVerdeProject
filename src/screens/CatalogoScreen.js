// src/screens/CatalogoScreen.js
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { cargarCatalogoDelUsuario } from "../casosdeuso/cargarCatalogo";
import { fuenteImagenProducto } from "../services/catalogoService";
import { categoriasDe, filtrarProductos } from "../domain/filtrosCatalogo";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useConexion } from "../context/ConexionContext";
import FiltrosCatalogo from "../components/FiltrosCatalogo";
import { formatearFecha, formatearPrecio } from "../utils/formato";

const FILTRO_INICIAL = {
  texto: "",
  categoria: "Todas",
  precioMin: "",
  precioMax: "",
};

export default function CatalogoScreen({ navigation }) {
  const { usuario } = useAuth();
  const { enLinea } = useConexion();
  const { items } = useCart();
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState(FILTRO_INICIAL);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [actualizadoEn, setActualizadoEn] = useState(null);

  /**
   * Pinta primero la caché y, con red, sustituye por el catálogo de Firestore.
   */
  const cargar = useCallback(async () => {
    const resultado = await cargarCatalogoDelUsuario(usuario.uid, enLinea, (parcial) => {
      setProductos(parcial.productos);
      setActualizadoEn(parcial.actualizadoEn);
      setCargando(false);
    });
    setProductos(resultado.productos);
    setActualizadoEn(resultado.actualizadoEn);
    setAviso(resultado.aviso);
    setCargando(enLinea == null && resultado.productos.length === 0);
  }, [usuario?.uid, enLinea]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  /**
   * Pull-to-refresh. Sin red termina enseguida y deja la lista que ya se ve.
   */
  async function manejarRefresh() {
    setRefrescando(true);
    try {
      await cargar();
    } finally {
      setRefrescando(false);
    }
  }

  const visibles = filtrarProductos(productos, filtro);
  const categorias = categoriasDe(productos);
  const totalItemsCarrito = items.reduce((acc, item) => acc + item.cantidad, 0);

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.cargandoTexto}>Cargando catálogo…</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Catálogo de la semana</Text>
          <Text style={styles.bajada}>Toca un producto para verlo y agregarlo a tu pedido.</Text>
        </View>
      </View>

      {actualizadoEn ? (
        <Text style={styles.meta}>Actualizado {formatearFecha(actualizadoEn)}</Text>
      ) : null}

      <FlatList
        data={visibles}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={manejarRefresh} />}
        contentContainerStyle={{ paddingBottom: 90 }}
        ListHeaderComponent={
          <FiltrosCatalogo
            valores={filtro}
            onChange={setFiltro}
            categorias={categorias}
            visibles={visibles.length}
            total={productos.length}
          />
        }
        ListEmptyComponent={
          <Text style={styles.vacio}>
            {productos.length === 0
              ? aviso || "No hay productos en el catálogo todavía."
              : "Ningún producto coincide con la búsqueda o los filtros."}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tarjeta}
            activeOpacity={0.75}
            onPress={() =>
              navigation.navigate("DetalleProducto", { productoId: item.id, producto: item })
            }
          >
            {fuenteImagenProducto(item.imagenUrl) ? (
              <Image source={fuenteImagenProducto(item.imagenUrl)} style={styles.imagen} />
            ) : (
              <View style={[styles.imagen, styles.imagenPlaceholder]}>
                <Text style={{ color: "#9AA79A" }}>Sin imagen</Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.detalle}>
                {formatearPrecio(item.precio)} / {item.unidad}
              </Text>
              <Text style={styles.categoria}>{item.categoria}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.botonCarrito} onPress={() => navigation.navigate("Carrito")}>
        <Text style={styles.botonCarritoTexto}>
          Ver pedido {totalItemsCarrito > 0 ? `(${totalItemsCarrito})` : ""}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#F4F7F1", paddingTop: 12, paddingHorizontal: 16 },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F1" },
  cargandoTexto: { marginTop: 8, color: "#5A6B57" },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titulo: { fontSize: 22, fontWeight: "700", color: "#2E5A2E" },
  bajada: { color: "#5A6B57", marginTop: 2, marginBottom: 4 },
  meta: { color: "#7A867A", fontSize: 12, marginBottom: 6 },
  vacio: { textAlign: "center", marginTop: 24, color: "#7A867A" },
  tarjeta: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#2E5A2E",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  imagen: { width: 76, height: 76, borderRadius: 12, marginRight: 12 },
  imagenPlaceholder: { backgroundColor: "#E9EEE6", justifyContent: "center", alignItems: "center" },
  info: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: "600", color: "#2B2F2B" },
  detalle: { color: "#5A6B57", marginTop: 2 },
  categoria: { color: "#7A867A", fontSize: 12, marginTop: 2 },
  botonCarrito: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  botonCarritoTexto: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
