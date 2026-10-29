/**
 * Aviso exigido por el modo offline: lo que se ve sin red puede estar viejo.
 * Solo se muestra cuando NetInfo confirma que no hay conexión.
 */
import React from "react";
import { Text, View } from "react-native";
import { useConexion } from "../context/ConexionContext";

export default function AvisoSinConexion() {
  const { enLinea } = useConexion();
  if (enLinea !== false) return null;

  return (
    <View style={{ backgroundColor: "#FFF3E0", paddingHorizontal: 16, paddingBottom: 8 }}>
      <Text style={{ color: "#E65100", fontSize: 12, textAlign: "center" }}>
        Los precios mostrados sin conexión pueden haber cambiado. Si el dispositivo guarda una copia antigua con existencias, también pudieron variar.
      </Text>
    </View>
  );
}
