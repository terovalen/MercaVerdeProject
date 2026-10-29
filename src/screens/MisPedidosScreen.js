// src/screens/MisPedidosScreen.js
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { cargarPedidosDelUsuario } from "../casosdeuso/cargarPedidos";
import { cancelarPedidoUsuario } from "../casosdeuso/cancelarPedido";
import { reintentarSincronizacion } from "../services/sincronizacionService";
import { useAuth } from "../context/AuthContext";
import { useConexion } from "../context/ConexionContext";
import { useSync } from "../context/SyncContext";
import TarjetaPedido from "../components/TarjetaPedido";
import Dialogo from "../components/Dialogo";
import { apiRequest } from "../services/apiClient";

export default function MisPedidosScreen({ navigation }) {
  const { usuario } = useAuth();
  const { enLinea } = useConexion();
  const { sincronizar, refrescar, ultimaSync } = useSync();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [dialogo, setDialogo] = useState(null);

  /**
   * Muestra la copia local al instante y, con red, la fusiona con Firestore.
   * Solo entran pedidos de este uid.
   */
  const cargar = useCallback(async () => {
    const resultado = await cargarPedidosDelUsuario(usuario.uid, enLinea, (parcial) => {
      setPedidos(parcial.pedidos);
      setCargando(false);
    });
    setPedidos(resultado.pedidos);
    setAviso(resultado.aviso);
    setCargando(false);
  }, [usuario?.uid, enLinea]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar, ultimaSync])
  );

  /**
   * Pide confirmación y aplica la regla de cancelación.
   * Los pedidos listos o entregados ni siquiera abren esta alerta:
   * la tarjeta los bloquea antes.
   */
  /**
   * Pide confirmación en un diálogo visible también en el navegador.
   */
  function pedirCancelacion(pedido) {
    setDialogo({
      titulo: "Cancelar pedido",
      mensaje: "¿Confirmas la cancelación? El pedido se eliminará.",
      textoConfirmar: "Sí, cancelar",
      textoCancelar: "No",
      onConfirmar: () => ejecutarCancelacion(pedido),
    });
  }

  /**
   * Borra el pedido en Firestore y, si salió bien, avisa y vuelve al inicio.
   */
  async function ejecutarCancelacion(pedido) {
    setDialogo(null);
    const resultado = await cancelarPedidoUsuario({
      usuarioId: usuario.uid,
      pedido,
      enLinea,
      sincronizar,
    });
    await refrescar();
    await cargar();

    if (resultado.ok && resultado.irAlInicio) {
      setDialogo({
        titulo: "Pedido cancelado",
        mensaje: "Pedido cancelado correctamente.",
        textoConfirmar: "Ir al inicio",
        onConfirmar: () => {
          setDialogo(null);
          navigation.navigate("Catalogo");
        },
      });
      return;
    }

    setDialogo({
      titulo: resultado.ok ? "Cancelación" : "No se canceló",
      mensaje: resultado.mensaje,
      textoConfirmar: "Entendido",
      onConfirmar: () => setDialogo(null),
    });
  }

  /**
   * Devuelve a la cola un pedido que falló al sincronizar y vuelve a intentar.
   */
  async function manejarReintento(pedido) {
    await reintentarSincronizacion(usuario.uid, pedido);
    if (enLinea === true) await sincronizar();
    else await refrescar();
    await cargar();
  }

  async function manejarRefresh() {
    setRefrescando(true);
    try {
      if (enLinea === true) await sincronizar();
      await cargar();
    } finally {
      setRefrescando(false);
    }
  }

  async function responderCambio(pedido, aceptar) {
    try {
      await apiRequest(`/api/pedidos/${encodeURIComponent(pedido.id)}/respuesta-cambio`, { method: "PATCH", body: { aceptar } });
      await cargar();
    } catch (error) {
      setDialogo({ titulo: "No se pudo actualizar", mensaje: error.message, textoConfirmar: "Entendido", onConfirmar: () => setDialogo(null) });
    }
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
      {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={manejarRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.vacio}>
            {enLinea === false
              ? "Todavía no hay pedidos guardados en este dispositivo."
              : "Aún no tienes pedidos."}
          </Text>
        }
        renderItem={({ item }) => (
          <View>
            <TarjetaPedido pedido={item} onCancelar={pedirCancelacion} onReintentar={manejarReintento} />
            {item.estado === "cambio_pendiente" ? <View style={{ backgroundColor: "#FFF8E1", padding: 12, borderRadius: 10, marginBottom: 10 }}><Text style={{ fontWeight: "700", color: "#8D5B00" }}>El vendedor propone cambiar los productos</Text><Text>{item.motivoCambio || "Por disponibilidad de inventario"}</Text>{(item.itemsPropuestos || []).map(i => <Text key={i.productoId}>{i.cantidad} × {i.nombre}</Text>)}<View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}><Text onPress={() => responderCambio(item, true)} style={{ color: "#2E7D32", fontWeight: "700", padding: 8 }}>Aceptar cambios</Text><Text onPress={() => responderCambio(item, false)} style={{ color: "#C62828", fontWeight: "700", padding: 8 }}>Rechazar</Text></View></View> : null}
          </View>
        )}
      />
      <Dialogo
        visible={Boolean(dialogo)}
        titulo={dialogo?.titulo}
        mensaje={dialogo?.mensaje}
        textoConfirmar={dialogo?.textoConfirmar}
        textoCancelar={dialogo?.textoCancelar}
        onConfirmar={dialogo?.onConfirmar}
        onCancelar={() => setDialogo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#F4F7F1", padding: 16 },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F1" },
  vacio: { textAlign: "center", marginTop: 40, color: "#7A867A" },
  aviso: { color: "#E65100", marginBottom: 8, fontSize: 12 },
});
