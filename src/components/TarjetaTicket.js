/**
 * Tarjeta de ticket del panel vendedor/administrador: el detalle del pedido
 * se despliega sobre la misma tarjeta. Muestra comprador, productos,
 * cantidades, precios y total; la línea de seguimiento indica en qué punto
 * va el pedido y la guía de estado dice cuándo puede prepararse y cuándo
 * se espera la respuesta del comprador a una propuesta de cambio.
 */
import React, { useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { metaEstado } from "../domain/estadosPedido";
import {
  accionSegunEstado,
  esperaRespuestaComprador,
  puedePreparar,
  RUTA_SEGUIMIENTO,
} from "../domain/ticketsPedidos";
import { formatearPrecio, formatearFecha } from "../utils/formato";

const VERDE = "#2E7D32";

const ETIQUETA_GENERO = {
  mujer: "Mujer",
  hombre: "Hombre",
  otro: "Otro",
  prefiero_no_decirlo: "Prefiero no decirlo",
};

export default function TarjetaTicket({
  pedido,
  enOperacion,
  onPreparar,
  onListo,
  onEntregado,
  onProponer,
}) {
  const [abierto, setAbierto] = useState(false);
  const meta = metaEstado(pedido.estado);
  const guia = accionSegunEstado(pedido.estado);
  const esperandoComprador = esperaRespuestaComprador(pedido.estado);
  const items = pedido.items || [];

  // Índice de la línea de seguimiento: cambio_pendiente se muestra en la
  // casilla de recibido con su propia advertencia (la propuesta está en pausa).
  const indice = RUTA_SEGUIMIENTO.indexOf(pedido.estado);

  return (
    <View style={styles.tarjeta}>
      {/* El encabezado NO despliega: "Ver detalle" es el único interruptor */}
      <View style={styles.encabezado}>
        <View style={styles.encabezadoInfo}>
          <Text style={styles.tituloTicket} numberOfLines={1}>
            Ticket {pedido.id && String(pedido.id).startsWith("ped_")
              ? String(pedido.id).slice(4, 16)
              : pedido.id || "(sin id)"}
          </Text>
          <Text style={styles.subTicket}>
            {formatearFecha(pedido.creadoEn)} · {items.length} {items.length === 1 ? "producto" : "productos"}
          </Text>
        </View>
        <View style={[styles.chipEstado, { backgroundColor: meta.fondo }]}>
          <Text style={[styles.chipEstadoTexto, { color: meta.color }]}>{meta.etiqueta}</Text>
        </View>
      </View>

      <View style={styles.compradorCaja}>
        <Text style={styles.compradorLinea}>
          {ETIQUETA_GENERO[pedido.generoComprador] || "Comprador"}
          {pedido.usuarioId ? ` · ${String(pedido.usuarioId).slice(0, 10)}…` : ""}
        </Text>

        <Text style={styles.lineaResumen} numberOfLines={2}>
          {items.map(i => `${i.nombre} x${i.cantidad}`).join(", ") || "Sin productos"}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={styles.totalTicket}>Total: {formatearPrecio(pedido.total)}</Text>
          <TouchableOpacity
            style={styles.botonDetalle}
            onPress={() => setAbierto(v => !v)}
            accessibilityLabel={abierto ? "Ocultar detalle" : "Ver detalle"}
          >
            <Text style={styles.verDetalle}>{abierto ? "Ocultar detalle ▲" : "Ver detalle ▼"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {abierto ? (
        <View style={styles.detalle}>
          {/* Productos del pedido con cantidad, precio y subtotal */}
          {items.map((item, i) => (
            <View key={`${item.productoId}-${i}`} style={styles.lineaProducto}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600" }}>
                  {item.nombre} × {item.cantidad} ({item.unidad})
                </Text>
                <Text style={styles.subLinea}>
                  {formatearPrecio(item.precio)} / {item.unidad}
                </Text>
              </View>
              <Text style={styles.subtotalLinea}>{formatearPrecio(Number(item.precio) * Number(item.cantidad))}</Text>
              {puedePreparar(pedido.estado) ? (
                <TouchableOpacity onPress={() => onProponer?.(item)} testID={`reemplazar-${i}`}>
                  <Text style={{ color: "#E6A700", fontWeight: "600", marginLeft: 8 }}>Reemplazar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          {/* Guía del estado: cuándo puede preparar y cuándo espera al comprador */}
          <Text
            style={[
              styles.guia,
              esperandoComprador ? styles.guiaEsperando : null,
            ]}
          >
            {guia.texto}
          </Text>

          {esperandoComprador && pedido.motivoCambio ? (
            <Text style={styles.motivoCambio}>Motivo de la propuesta: {pedido.motivoCambio}</Text>
          ) : null}

          {/* Seguimiento: recibido → en preparación → listo → entregado */}
          {pedido.estado !== "cancelado" ? (
            <View style={styles.timeline}>
              {RUTA_SEGUIMIENTO.map((paso, i) => {
                const pasoMeta = metaEstado(paso);
                const hecho = indice >= i;
                const actual = indice === i;
                return (
                  <View key={paso} style={{ flex: 1, alignItems: "center" }}>
                    <View
                      style={[
                        styles.punto,
                        { backgroundColor: hecho ? pasoMeta.color : "#D5DDD3" },
                        actual ? styles.puntoActual : null,
                      ]}
                    />
                    <View style={[styles.linea, hecho ? { backgroundColor: pasoMeta.color } : null]} />
                    <Text style={[styles.puntoEtiqueta, hecho ? { color: pasoMeta.color, fontWeight: "600" } : null]}>
                      {pasoMeta.etiqueta}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.guia, { color: "#C62828" }]}>Pedido cancelado por el comprador.</Text>
          )}

          {/* Acciones según estado */}
          <View style={styles.acciones}>
            {puedePreparar(pedido.estado) ? (
              <>
                <TouchableOpacity style={[styles.boton, { backgroundColor: "#E6A700" }]} onPress={() => onProponer?.(null)} disabled={enOperacion}>
                  <Text style={styles.botonTexto}>Proponer reemplazo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.boton, { backgroundColor: VERDE }]} onPress={onPreparar} disabled={enOperacion}>
                  <Text style={styles.botonTexto}>Preparar</Text>
                </TouchableOpacity>
              </>
            ) : null}
            {pedido.estado === "en_preparacion" ? (
              <TouchableOpacity style={[styles.boton, { backgroundColor: VERDE }]} onPress={onListo} disabled={enOperacion}>
                <Text style={styles.botonTexto}>Listo</Text>
              </TouchableOpacity>
            ) : null}
            {pedido.estado === "listo" ? (
              <TouchableOpacity style={[styles.boton, { backgroundColor: VERDE }]} onPress={onEntregado} disabled={enOperacion}>
                <Text style={styles.botonTexto}>Entregado</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: "white", borderRadius: 12, padding: 12 },
  encabezado: { flexDirection: "row", alignItems: "center" },
  encabezadoInfo: { flex: 1, marginRight: 8 },
  tituloTicket: { fontWeight: "700", fontSize: 15, color: "#2B2F2B" },
  subTicket: { color: "#7A867A", fontSize: 12, marginTop: 1 },
  chipEstado: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  chipEstadoTexto: { fontSize: 11, fontWeight: "700" },
  compradorCaja: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#EDF1EA", paddingTop: 8 },
  compradorLinea: { fontWeight: "600", color: "#2B2F2B", fontSize: 13 },
  lineaResumen: { color: "#5A6B57", fontSize: 12, marginTop: 2 },
  totalTicket: { fontWeight: "700", color: VERDE, marginTop: 4 },
  verDetalle: { color: "#2E7D32", fontSize: 12, fontWeight: "700", marginTop: 4 },
  botonDetalle: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: "#2E7D32" },
  detalle: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#EDF1EA", paddingTop: 8 },
  lineaProducto: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  subLinea: { color: "#7A867A", fontSize: 11 },
  subtotalLinea: { fontWeight: "600", color: "#2B2F2B" },
  guia: { backgroundColor: "#F4F7F1", color: "#2B2F2B", padding: 8, borderRadius: 8, fontSize: 12, marginTop: 6 },
  guiaEsperando: { backgroundColor: "#FFF8E1", color: "#8D5B00", fontWeight: "600" },
  motivoCambio: { color: "#8D5B00", fontSize: 12, marginTop: 6, fontStyle: "italic" },
  timeline: { flexDirection: "row", marginTop: 12 },
  punto: { width: 16, height: 16, borderRadius: 8, marginTop: 0 },
  puntoActual: { width: 20, height: 20, borderRadius: 10 },
  linea: { height: 2, width: "100%", backgroundColor: "#D5DDD3", marginVertical: 4 },
  puntoEtiqueta: { fontSize: 10, textAlign: "center", marginTop: 2, flexWrap: "wrap" },
  acciones: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  boton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  botonTexto: { color: "white", fontWeight: "700", fontSize: 13 },
});
