/**
 * Pantalla Centro de soporte del administrador.
 * Gestionar tickets, responder solicitudes y relacionar reportes con incidentes técnicos.
 * El administrador solo visualiza los estados, no los cambia.
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

const verde = "#2E7D32";

const ESTADOS_VISIBLES = ["pendiente", "cambio_pendiente", "en_preparacion", "listo", "entregado"];

export default function AdminSoporteScreen() {
  const { caja: dialogos, avisar } = usarDialogos();
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  const cargar = useCallback(async () => {
    try {
      const data = await apiRequest("/api/pedidos");
      const ticketsData = (data || []).filter((p) => ESTADOS_VISIBLES.includes(p.estado));
      setTickets(ticketsData);
    } catch (e) {
      setTickets([]);
      if (!e.message?.includes("404")) {
        avisar("No se pudo cargar tickets", e.message);
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    cargar();
  }, [cargar]));

  // Refresco automático cada 7 segundos para ver cambios de estado
  useEffect(() => {
    const t = setInterval(cargar, 7000);
    return () => clearInterval(t);
  }, [cargar]);

  const filtrados = tickets.filter((t) => {
    if (filtro === "todos") return true;
    return t.estado === filtro;
  });

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
        <Text style={styles.titulo}>Centro de soporte</Text>
        <Text style={styles.subtitulo}>Tickets y estados de seguimiento</Text>
      </View>

      <View style={styles.filtros}>
        {[
          { id: "todos", texto: "Todos" },
          { id: "pendiente", texto: "Pendiente" },
          { id: "cambio_pendiente", texto: "Cambio pendiente" },
          { id: "en_preparacion", texto: "En preparación" },
          { id: "listo", texto: "Listo" },
          { id: "entregado", texto: "Entregado" },
        ].map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.chip, filtro === f.id && styles.chipActivo]}
            onPress={() => setFiltro(f.id)}
          >
            <Text style={[styles.chipTexto, filtro === f.id && styles.chipTextoActivo]}>{f.texto}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.filaTicket}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ticketId}>Ticket {String(item.id).slice(0, 8)}</Text>
              <Text style={[styles.ticketEstado, estadoColor(item.estado)]}>
                {item.estado.replace("_", " ")}
              </Text>
              {item.motivoCambio ? (
                <Text style={styles.ticketMotivo}>{item.motivoCambio}</Text>
              ) : null}
              {item.itemsPropuestos ? (
                <Text style={styles.ticketPropuesta}>
                  Propuesta: {item.itemsPropuestos.length} producto(s) sugerido(s)
                </Text>
              ) : null}
            </View>
            <View style={styles.ticketAcciones}>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vacio}>No hay tickets de soporte.</Text>}
      />
    </ScrollView>
  );
}

function estadoColor(estado) {
  switch (estado) {
    case "pendiente": return { color: "#FF9800", fontWeight: "700" };
    case "cambio_pendiente": return { color: "#8D5B00", fontWeight: "700" };
    case "en_preparacion": return { color: "#1565C0", fontWeight: "700" };
    case "listo": return { color: "#2E7D32", fontWeight: "700" };
    case "entregado": return { color: "#546E7A", fontWeight: "700" };
    default: return { color: "#7A867A", fontWeight: "700" };
  }
}

const styles = StyleSheet.create({
  centrado: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F1" },
  contenido: { paddingBottom: 40 },
  encabezado: { padding: 16, backgroundColor: "#F4F7F1" },
  titulo: { fontSize: 24, fontWeight: "700", color: "#2E5A2E" },
  subtitulo: { color: "#7A867A", marginTop: 2 },
  filtros: { flexDirection: "row", gap: 6, paddingHorizontal: 16, marginBottom: 12, flexWrap: "wrap" },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D5DDD3",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActivo: { backgroundColor: verde, borderColor: verde },
  chipTexto: { color: "#2B2F2B", fontSize: 11 },
  chipTextoActivo: { color: "#fff", fontWeight: "700" },
  filaTicket: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  ticketId: { fontWeight: "600", color: "#2B2F2B" },
  ticketEstado: { fontSize: 12 },
  ticketMotivo: { color: "#5A6B57", fontSize: 12, marginTop: 4, fontStyle: "italic" },
  ticketPropuesta: { color: "#8D5B00", fontSize: 12, marginTop: 4, fontWeight: "600" },
  ticketAcciones: { flexDirection: "row", gap: 6 },
  botonDetalle: { backgroundColor: "#E8F5E9", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  botonTextoDetalle: { color: verde, fontWeight: "700", fontSize: 10 },
  vacio: { textAlign: "center", color: "#7A867A", marginTop: 20 },
});
