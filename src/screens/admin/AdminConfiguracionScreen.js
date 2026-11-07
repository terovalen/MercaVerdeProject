/**
 * Pantalla Configuración del administrador.
 * Ajustes generales del mercado: información de la tienda, reglas de pedidos,
 * y opciones de la aplicación.
 */
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import usarDialogos from "../../components/usarDialogos";

const verde = "#2E7D32";

export default function AdminConfiguracionScreen() {
  const { caja: dialogos, avisar, confirmar } = usarDialogos();
  const [config, setConfig] = useState({
    nombreTienda: "MercaVerde",
    correoContacto: "",
    permiteSustituciones: true,
    stockMinimoAlerta: 5,
    pedidosAutoAceptar: false,
  });
  const [cargando, setCargando] = useState(false);

  const guardar = async () => {
    setCargando(true);
    try {
      await new Promise((r) => setTimeout(r, 800)); // simula guardado
      avisar("Configuración guardada", "Los cambios se aplicaron correctamente.");
    } catch (e) {
      avisar("No se pudo guardar", e.message);
    } finally {
      setCargando(false);
    }
  };

  const restablecer = async () => {
    const confirmado = await confirmar(
      "Restablecer configuración",
      "¿Restablecer todos los valores a los predeterminados?",
      { textoConfirmar: "Restablecer" }
    );
    if (!confirmado) return;
    setConfig({
      nombreTienda: "MercaVerde",
      correoContacto: "",
      permiteSustituciones: true,
      stockMinimoAlerta: 5,
      pedidosAutoAceptar: false,
    });
    avisar("Restablecido", "Configuración restablecida a valores predeterminados.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F4F7F1" }}>
      {dialogos}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contenedor}>
        <View style={styles.encabezado}>
          <Text style={styles.titulo}>Configuración</Text>
          <Text style={styles.subtitulo}>Ajustes generales del mercado</Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Información de la tienda</Text>
          <View style={styles.campo}>
            <Text style={styles.campoEtiqueta}>Nombre de la tienda</Text>
            <TextInput
              style={styles.input}
              value={config.nombreTienda}
              onChangeText={(v) => setConfig({ ...config, nombreTienda: v })}
              placeholder="MercaVerde"
            />
          </View>
          <View style={styles.campo}>
            <Text style={styles.campoEtiqueta}>Correo de contacto</Text>
            <TextInput
              style={styles.input}
              value={config.correoContacto}
              onChangeText={(v) => setConfig({ ...config, correoContacto: v })}
              placeholder="contacto@merca verde.com"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Reglas de pedidos</Text>
          <View style={styles.toggle}>
            <Text style={styles.toggleEtiqueta}>Permitir sustituciones de productos</Text>
            <Switch
              value={config.permiteSustituciones}
              onValueChange={(v) => setConfig({ ...config, permiteSustituciones: v })}
              trackColor={{ false: "#D5DDD3", true: verde }}
            />
          </View>
          <View style={styles.toggle}>
            <Text style={styles.toggleEtiqueta}>Auto-aceptar pedidos pendientes</Text>
            <Switch
              value={config.pedidosAutoAceptar}
              onValueChange={(v) => setConfig({ ...config, pedidosAutoAceptar: v })}
              trackColor={{ false: "#D5DDD3", true: verde }}
            />
          </View>
          <View style={styles.campo}>
            <Text style={styles.campoEtiqueta}>Stock mínimo para alerta</Text>
            <TextInput
              style={styles.input}
              value={String(config.stockMinimoAlerta)}
              onChangeText={(v) => setConfig({ ...config, stockMinimoAlerta: Number(v) || 0 })}
              keyboardType="numeric"
              placeholder="5"
            />
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Acciones</Text>
          <TouchableOpacity style={styles.botonGuardar} onPress={guardar} disabled={cargando}>
            <Text style={styles.botonGuardarTexto}>
              {cargando ? "Guardando..." : "Guardar cambios"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonRestablecer} onPress={restablecer}>
            <Text style={styles.botonRestablecerTexto}>Restablecer valores predeterminados</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 16, paddingBottom: 40 },
  encabezado: { marginBottom: 16 },
  titulo: { fontSize: 24, fontWeight: "700", color: "#2E5A2E" },
  subtitulo: { color: "#7A867A", marginTop: 2 },
  seccion: { marginBottom: 20 },
  tituloSeccion: { fontSize: 16, fontWeight: "700", color: "#2E5A2E", marginBottom: 10 },
  campo: { marginBottom: 14 },
  campoEtiqueta: { color: "#2B2F2B", fontWeight: "600", fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D5DDD3",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#2B2F2B",
  },
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  toggleEtiqueta: { fontSize: 14, color: "#2B2F2B", fontWeight: "500" },
  botonGuardar: {
    backgroundColor: verde,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  botonGuardarTexto: { color: "#fff", fontWeight: "700", fontSize: 16 },
  botonRestablecer: {
    borderWidth: 1,
    borderColor: verde,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  botonRestablecerTexto: { color: verde, fontWeight: "700", fontSize: 16 },
});
