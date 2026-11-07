/**
 * Resumen de las métricas en texto, para cuando se abre en Expo Go.
 * En el navegador se usa la versión con Highcharts (GraficosHighcharts.web.js).
 */
import React from "react";
import { Text, View } from "react-native";

export default function GraficosHighcharts({
  pedidosPorEstado = {},
  productosPopulares = [],
  camposFormulario = {},
}) {
  const estados = Object.entries(pedidosPorEstado);
  const campos = Object.entries(camposFormulario).flatMap(([entidad, valores]) =>
    Object.entries(valores).map(([campo, contenido]) => ({ entidad, campo, contenido }))
  );

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Pedidos por estado</Text>
      {estados.map(([estado, cantidad]) => (
        <Text key={estado} style={styles.fila}>
          {estado}: {cantidad}
        </Text>
      ))}

      <Text style={{ fontWeight: "700", marginTop: 12, marginBottom: 6 }}>
        Productos más comprados
      </Text>
      {productosPopulares.slice(0, 10).map((p, i) => (
        <Text key={`${p.producto}-${p.genero}`} style={styles.fila}>
          {i + 1}. {p.producto} · {p.genero} · {p.cantidad}
        </Text>
      ))}

      <Text style={{ fontWeight: "700", marginTop: 12, marginBottom: 6 }}>
        Distribución de los campos
      </Text>
      {campos.map(({ entidad, campo, contenido }) =>
        Object.entries(contenido || {}).map(([valor, total]) => (
          <Text key={`${entidad}-${campo}-${valor}`} style={styles.fila}>
            {entidad} · {campo}={valor}: {total}
          </Text>
        ))
      )}
    </View>
  );
}

const styles = {
  fila: {
    padding: 8,
    backgroundColor: "white",
    marginTop: 3,
  },
};
