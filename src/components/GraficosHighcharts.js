import React from "react";
import { Text, View } from "react-native";

// A mobile-safe summary for Expo Go. The interactive Highcharts view is used on web.
export default function GraficosHighcharts({ pedidosPorEstado = {}, productosPopulares = [], camposFormulario = {} }) {
  return <View style={{ marginTop: 12 }}>{Object.entries(pedidosPorEstado).map(([estado, cantidad]) => <Text key={estado} style={{ padding: 8, backgroundColor: "white", marginTop: 3 }}>{estado}: {cantidad}</Text>)}{Object.entries(camposFormulario).flatMap(([entidad, campos]) => Object.entries(campos).flatMap(([campo, valores]) => valores && typeof valores === "object" ? Object.entries(valores).map(([valor, total]) => <Text key={`${entidad}-${campo}-${valor}`} style={{ padding: 8, backgroundColor: "white", marginTop: 3 }}>{entidad} · {campo}={valor}: {total}</Text>) : []))}{productosPopulares.slice(0, 10).map((p, i) => <Text key={`${p.producto}-${p.genero}`} style={{ padding: 8, backgroundColor: "white", marginTop: 3 }}>{i + 1}. {p.producto} · {p.genero} · {p.cantidad}</Text>)}</View>;
}
