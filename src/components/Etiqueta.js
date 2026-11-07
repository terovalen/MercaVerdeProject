/**
 * Pastilla de estado reutilizable.
 * Los pedidos y los productos usan la misma forma visual.
 */
import React from "react";
import { Text, View } from "react-native";

export default function Etiqueta({ texto, color, fondo }) {
  return (
    <View
      style={{
        backgroundColor: fondo,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color, fontWeight: "700", fontSize: 12 }}>{texto}</Text>
    </View>
  );
}
