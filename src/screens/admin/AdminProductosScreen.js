/**
 * Pantalla Gestión de productos del administrador.
 * Crear, editar, archivar y restaurar productos del catálogo.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../../services/apiClient";
import { actualizarProducto, archivarProducto } from "../../services/productosService";
import { useAuth } from "../../context/AuthContext";
import usarDialogos from "../../components/usarDialogos";
import FormularioProducto from "../../components/FormularioProducto";

const verde = "#2E7D32";

export default function AdminProductosScreen() {
  const { usuario } = useAuth();
  const { caja: dialogos, avisar, confirmar } = usarDialogos();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [productoForm, setProductoForm] = useState(null);
  const [enOperacion, setEnOperacion] = useState(false);

  const estaActivo = (p) => p.activo ?? (p.Activo !== false);

  const cargar = useCallback(async () => {
    try {
      const data = await apiRequest("/api/inventario");
      setProductos(data || []);
    } catch (e) {
      avisar("No se pudo cargar productos", e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function ejecutar(accion, msgOk) {
    setEnOperacion(true);
    try {
      const respuesta = await accion();
      if (respuesta?.mensaje) avisar("Listo", respuesta.mensaje);
      else if (msgOk) avisar("Listo", msgOk);
      await cargar();
    } catch (e) {
      avisar("No se pudo completar", e.message);
    } finally {
      setEnOperacion(false);
    }
  }

  async function archivar(producto) {
    const confirmado = await confirmar(
      "Archivar producto",
      `"${producto.nombre || producto.Nombre}" dejará de aparecer en el catálogo público. ¿Continuar?`,
      { textoConfirmar: "Archivar" }
    );
    if (confirmado) ejecutar(() => archivarProducto(producto.id));
  }

  function restaurar(producto) {
    ejecutar(() => actualizarProducto(producto.id, { activo: true }));
  }

  function abrirFormulario(producto = null) {
    setProductoForm(producto);
    setFormVisible(true);
  }

  const activos = productos.filter(estaActivo);
  const archivados = productos.filter((p) => !estaActivo(p));

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={verde} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F4F7F1" }} contentContainerStyle={styles.contenido}>
      {dialogos}
      <View style={styles.encabezado}>
        <View style={styles.tituloContenedor}>
          <Text style={styles.titulo}>Gestión de productos</Text>
        </View>
        <TouchableOpacity style={styles.botonNuevo} onPress={() => abrirFormulario(null)} disabled={enOperacion}>
          <Text style={styles.botonNuevoTexto}>＋ Nuevo producto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Activos ({activos.length})</Text>
        {activos.length === 0 ? (
          <Text style={styles.vacio}>No hay productos activos.</Text>
        ) : (
          <FlatList
            data={activos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.filaProducto}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productoNombre}>{item.nombre || item.Nombre}</Text>
                  <Text style={styles.productoMeta}>Stock: {item.disponibilidad ?? item.Disponibilidad ?? 0}</Text>
                </View>
                <View style={styles.productoAcciones}>
                  <TouchableOpacity
                    style={styles.botonIcono}
                    onPress={() => abrirFormulario(item)}
                    disabled={enOperacion}
                  >
                    <Text style={styles.botonIconoTexto}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.botonIcono}
                    onPress={() => archivar(item)}
                    disabled={enOperacion}
                  >
                    <Text style={styles.botonIconoTexto}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {archivados.length > 0 ? (
        <View style={styles.seccion}>
          <Text style={[styles.tituloSeccion, styles.tituloArchivados]}>Archivados ({archivados.length})</Text>
          <FlatList
            data={archivados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.filaArchivado}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productoArchivado}>{item.nombre || item.Nombre}</Text>
                  <Text style={styles.productoMeta}>ID: {item.id}</Text>
                </View>
                <TouchableOpacity
                  style={styles.botonRestaurar}
                  onPress={() => restaurar(item)}
                  disabled={enOperacion}
                >
                  <Text style={styles.botonRestaurarTexto}>Restaurar</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      ) : null}

      <FormularioProducto
        visible={formVisible}
        producto={productoForm}
        cerrar={() => setFormVisible(false)}
        alGuardado={cargar}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F1" },
  contenido: { paddingBottom: 40 },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#F4F7F1",
  },
  botonNuevo: {
    backgroundColor: verde,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  botonNuevoTexto: { color: "#fff", fontWeight: "700" },
  seccion: { paddingHorizontal: 16, marginBottom: 16 },
  tituloSeccion: { fontSize: 16, fontWeight: "700", color: "#2E5A2E", marginBottom: 8 },
  tituloArchivados: { color: "#7A867A" },
  filaProducto: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productoNombre: { fontWeight: "600", color: "#2B2F2B" },
  productoMeta: { color: "#7A867A", fontSize: 12, marginTop: 2 },
  productoAcciones: { flexDirection: "row", gap: 4 },
  botonIcono: { padding: 8, backgroundColor: "#F4F7F1", borderRadius: 8 },
  botonIconoTexto: { color: "#2B2F2B" },
  filaArchivado: {
    backgroundColor: "#F1F8E9",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productoArchivado: { color: "#5A6B57", fontWeight: "600" },
  botonRestaurar: {
    borderWidth: 1,
    borderColor: verde,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  botonRestaurarTexto: { color: verde, fontWeight: "700", fontSize: 12 },
  vacio: { textAlign: "center", color: "#7A867A", marginTop: 20 },
});
