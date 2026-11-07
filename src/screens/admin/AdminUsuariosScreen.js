/**
 * Pantalla Gestión de usuarios del administrador.
 * Consultar, modificar, suspender y reactivar cuentas y gestionar roles.
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

const ROLES_DISPONIBLES = [
  { id: "comprador", texto: "Comprador" },
  { id: "vendedor", texto: "Vendedor" },
  { id: "administrador", texto: "Administrador" },
];

export default function AdminUsuariosScreen() {
  const { caja: dialogos, avisar, confirmar } = usarDialogos();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todos"); // todos, activos, suspendidos
  const [rolDropdown, setRolDropdown] = useState(null); // { usuario, index }

  const cargar = useCallback(async () => {
    try {
      const data = await apiRequest("/api/usuarios");
      setUsuarios(data || []);
    } catch (e) {
      setUsuarios([]);
      if (!e.message?.includes("404")) {
        avisar("No se pudo cargar usuarios", e.message);
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const filtrados = usuarios.filter((u) => {
    if (filtro === "activos") return u.rol !== "suspendido";
    if (filtro === "suspendidos") return u.rol === "suspendido";
    return true;
  });

  const rolesDisponiblesPara = (rolActual) =>
    ROLES_DISPONIBLES.filter((r) => r.id !== rolActual);
  async function cambiarRol(usuario, nuevoRol) {
    const confirmado = await confirmar(
      "Cambiar rol",
      `¿Asignar rol "${nuevoRol}" a ${usuario.nombre || usuario.correo}?`,
      { textoConfirmar: "Cambiar" }
    );
    if (!confirmado) return;
    try {
      await apiRequest(`/api/usuarios/${usuario.id}`, {
        method: "PATCH",
        body: { rol: nuevoRol },
      });
      setRolDropdown(null);
      cargar();
      avisar("Rol actualizado", `Rol cambiado a ${nuevoRol}.`);
    } catch (e) {
      avisar("No se pudo cambiar el rol", e.message);
    }
  }

  async function suspenderReactivar(usuario) {
    const estaSuspendido = usuario.rol === "suspendido";
    const accion = estaSuspendido ? "reactivar" : "suspender";
    const confirmado = await confirmar(
      `${accion.charAt(0).toUpperCase() + accion.slice(1)} cuenta`,
      `¿${estaSuspendido ? "Reactivar" : "Suspender"} la cuenta de ${usuario.nombre || usuario.correo}?`,
      { textoConfirmar: accion }
    );
    if (!confirmado) return;
    try {
      await apiRequest(`/api/usuarios/${usuario.id}`, {
        method: "PATCH",
        body: { rol: estaSuspendido ? "comprador" : "suspendido" },
      });
      cargar();
      avisar("Cuenta actualizada", `${estaSuspendido ? "Reactivada" : "Suspendida"}.`);
    } catch (e) {
      avisar("No se pudo actualizar la cuenta", e.message);
    }
  }

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
        <Text style={styles.titulo}>Gestión de usuarios</Text>
        <Text style={styles.subtitulo}>Consultar, modificar, suspender y reactivar cuentas</Text>
      </View>

      <View style={styles.filtros}>
        {["todos", "activos", "suspendidos"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filtro === f && styles.chipActivo]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.chipTexto, filtro === f && styles.chipTextoActivo]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id || item.uid}
        renderItem={({ item, index }) => {
          const mostrarDropdown = rolDropdown?.index === index;
          const rolesOpciones = rolesDisponiblesPara(item.rol);
          return (
            <View style={styles.filaUsuario} key={item.id || item.uid}>
              <View style={styles.usuarioInfo}>
                <Text style={styles.usuarioNombre}>{item.nombre || item.correo || "Sin nombre"}</Text>
                <Text style={styles.usuarioCorreo}>{item.correo || item.email || "-"}</Text>
              </View>
              <View style={styles.usuarioAcciones}>
                <Text style={[styles.usuarioRol, item.rol === "administrador" && styles.rolAdmin]}>
                  {item.rol}
                </Text>
                <TouchableOpacity
                  style={styles.botonCambiarRol}
                  onPress={() =>
                    mostrarDropdown ? setRolDropdown(null) : setRolDropdown({ usuario: item, index })
                  }
                >
                  <Text style={styles.botonCambiarRolTexto}>Cambiar rol</Text>
                </TouchableOpacity>
                {mostrarDropdown && (
                  <View style={styles.dropdown}>
                    {rolesOpciones.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={styles.dropdownOpcion}
                        onPress={() => cambiarRol(item, r.id)}
                      >
                        <Text style={styles.dropdownOpcionTexto}>{r.texto}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.botonAccion, item.rol === "suspendido" ? styles.botonReactivar : styles.botonSuspender]}
                  onPress={() => suspenderReactivar(item)}
                >
                  <Text style={styles.botonAccionTexto}>
                    {item.rol === "suspendido" ? "Reactivar" : "Suspender"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.vacio}>No hay usuarios registrados.</Text>}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F1" },
  contenido: { paddingBottom: 40 },
  encabezado: { padding: 16, backgroundColor: "#F4F7F1" },
  titulo: { fontSize: 24, fontWeight: "700", color: "#2E5A2E" },
  subtitulo: { color: "#7A867A", marginTop: 2 },
  filtros: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D5DDD3",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActivo: { backgroundColor: verde, borderColor: verde },
  chipTexto: { color: "#2B2F2B", fontSize: 12 },
  chipTextoActivo: { color: "#fff", fontWeight: "700" },
  filaUsuario: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  usuarioInfo: {
    flex: 2,
  },
  usuarioNombre: { fontWeight: "700", color: "#2B2F2B", fontSize: 15 },
  usuarioCorreo: { color: "#7A867A", fontSize: 13, marginTop: 3 },
  usuarioAcciones: {
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-end",
  },
  usuarioRol: { fontSize: 11, fontWeight: "600", color: "#1565C0", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: "#E3F2FD", marginBottom: 6 },
  rolAdmin: { backgroundColor: "#FFF8E1", color: "#FF9800" },
  botonCambiarRol: { backgroundColor: "#E8F5E9", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  botonCambiarRolTexto: { color: verde, fontSize: 10, fontWeight: "700" },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D5DDD3",
    borderRadius: 8,
    marginTop: 4,
    width: 120,
    alignSelf: "flex-end",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  dropdownOpcion: {
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  dropdownOpcionTexto: { fontSize: 13, color: "#2B2F2B", fontWeight: "600" },
  botonAccion: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  botonSuspender: { backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#FFCDD2" },
  botonReactivar: { backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: verde },
  botonAccionTexto: { fontSize: 10, fontWeight: "700" },
  vacio: { textAlign: "center", color: "#7A867A", marginTop: 20 },
});
