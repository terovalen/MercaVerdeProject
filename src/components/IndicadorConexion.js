/**
 * Indicador permanente de conexión.
 * Vive fuera del navegador para que siga visible en catálogo, detalle,
 * carrito, pedidos y alertas.
 */
import React from "react";
import { Text, View } from "react-native";
import { useConexion } from "../context/ConexionContext";
import { useSync } from "../context/SyncContext";

export default function IndicadorConexion() {
  const { enLinea } = useConexion();
  const { pendientes, sincronizando } = useSync();

  const enLineaReal = enLinea === true;
  const fondo = enLinea == null ? "#ECEFF1" : enLineaReal ? "#E8F5E9" : "#FFF8E1";
  const color = enLinea == null ? "#546E7A" : enLineaReal ? "#1B5E20" : "#E65100";

  let texto = "Comprobando conexión…";
  if (enLineaReal) texto = sincronizando ? "En línea · sincronizando" : "En línea";
  if (enLinea === false) texto = "Sin conexión";
  if (pendientes > 0) {
    const palabra = pendientes === 1 ? "acción pendiente" : "acciones pendientes";
    texto += ` · ${pendientes} ${palabra} por sincronizar`;
  }

  return (
    <View style={{ backgroundColor: fondo, paddingVertical: 8, paddingHorizontal: 16 }}>
      <Text style={{ color, fontWeight: "700", fontSize: 13, textAlign: "center" }}>{texto}</Text>
    </View>
  );
}
