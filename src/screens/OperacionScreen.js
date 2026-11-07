import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../services/apiClient";
import { actualizarProducto, archivarProducto } from "../services/productosService";
import { useAuth } from "../context/AuthContext";
import FormularioProducto from "../components/FormularioProducto";
import FiltrosPedidos from "../components/FiltrosPedidos";
import TarjetaTicket from "../components/TarjetaTicket";
import SelectorProducto from "../components/SelectorProducto";
import GraficosHighcharts from "../components/GraficosHighcharts";
import usarDialogos from "../components/usarDialogos";
import { filtrarTickets } from "../domain/ticketsPedidos";
import { ESTADOS_PEDIDO } from "../domain/estadosPedido";

const verde = "#2E7D32";

/** Intervalo del refresco automático: pedidos y stock aparecen sin recargar. */
const MS_REFRESCO = 7000;

const TITULOS_SECCION = {
  inventario: "Inventario",
  tickets: "Tickets de pedidos",
  analitica: "Analítica del mercado",
};

/** Está activo (no archivado): tolera "activo"/"Activo" según el documento. */
const estaActivo = (p) => p.activo ?? (p.Activo !== false);

/**
 * Fila del inventario: stock y acciones para vendedor/administrador:
 * pasos rápidos (−/+), escribir una cantidad exacta, editar y archivar.
 */
function FilaInventario({ producto, enOperacion, onPaso, onGuardarCantidad, onEditar, onArchivar }) {
  const stock = Number(producto.disponibilidad ?? producto.Disponibilidad ?? 0);
  const [cantidad, setCantidad] = useState(String(stock));

  // Si el stock cambia en el servidor (recarga o auto-refresco), el campo vuelve a mostrarlo.
  useEffect(() => { setCantidad(String(stock)); }, [stock, producto.id]);

  return (
    <View style={styles.filaProducto}>
      <View style={styles.filaEncabezado}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "600" }}>{producto.nombre || producto.Nombre}</Text>
          <Text style={styles.metaProducto}>Stock: {stock} · ID: {producto.id}</Text>
        </View>
        <TouchableOpacity style={styles.botonIcono} onPress={onEditar} disabled={enOperacion}>
          <Text style={styles.botonIconoTexto}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonIcono} onPress={onArchivar} disabled={enOperacion}>
          <Text style={styles.botonIconoTexto}>🗑</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filaControles}>
        <TouchableOpacity style={styles.botonPaso} onPress={() => onPaso(-1)} disabled={enOperacion}>
          <Text style={styles.botonPasoTexto}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonPaso} onPress={() => onPaso(1)} disabled={enOperacion}>
          <Text style={styles.botonPasoTexto}>+</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.inputCantidad}
          value={cantidad}
          onChangeText={v => setCantidad(v.replace(/[^\d]/g, ""))}
          keyboardType="number-pad"
          placeholder="Cantidad"
          placeholderTextColor="#AAA"
        />
        <TouchableOpacity style={styles.botonGuardar} onPress={() => onGuardarCantidad(cantidad)} disabled={enOperacion}>
          <Text style={styles.botonGuardarTexto}>{enOperacion ? "…" : "Guardar"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Panel del vendedor y dashboard del administrador.
 * Las secciones se eligen desde el menú lateral: Inventario, Tickets de
 * pedidos y Analítica (esta última solo para el administrador).
 * Se refresca solo cada pocos segundos, para que los cambios de pedidos
 * y de stock aparezcan sin recargar.
 */
export default function OperacionScreen({ route }) {
  const { usuario } = useAuth();
  const admin = usuario?.rol === "administrador";
  const { caja: dialogos, avisar, confirmar } = usarDialogos();
  const [seccion, setSeccion] = useState(() => route?.params?.seccion || "inventario");
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [analitica, setAnalitica] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [productoForm, setProductoForm] = useState(null); // null = crear producto
  const [enOperacion, setEnOperacion] = useState(false);
  // Tickets
  const [filtroTickets, setFiltroTickets] = useState({ estado: "activos", texto: "", rango: "todas" });
  // Sustitución sin IDs: pedido en gestión, ítem a reemplazar y selector
  const [pedidoPropuesta, setPedidoPropuesta] = useState(null);
  const [itemSustituir, setItemSustituir] = useState(null);
  const [selectorVisible, setSelectorVisible] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    try {
      const [ps, os] = await Promise.all([apiRequest("/api/inventario"), apiRequest("/api/pedidos")]);
      setProductos(ps);
      setPedidos(os);
      if (usuario?.rol === "administrador") setAnalitica(await apiRequest("/api/analitica"));
    } catch (e) {
      // El refresco automático falla en silencio; una caída momentánea
      // de la API no borra lo que ya se ve.
      if (!silencioso) avisar("No se pudo cargar", e.message);
    } finally { setCargando(false); }
  }, [usuario?.rol]);

  useFocusEffect(useCallback(() => {
    const pedida = route?.params?.seccion;
    if (pedida) setSeccion(pedida);
    cargar();
    // Refresco automático: nuevo pedido, cambio de estado del comprador
    // o edit del stock de otro teléfono aparecen solos.
    const temporizador = setInterval(() => { cargar(true); }, MS_REFRESCO);
    return () => clearInterval(temporizador);
  }, [cargar, route?.params?.seccion]));

  /** Ejecuta una acción de gestión e informa el resultado de la API. */
  async function ejecutar(accion, msgOk) {
    setEnOperacion(true);
    try {
      const respuesta = await accion();
      if (respuesta?.mensaje) avisar("Listo", respuesta.mensaje);
      else if (msgOk) avisar("Listo", msgOk);
      await cargar();
    } catch (e) {
      avisar("No se pudo completar", e.message);
    } finally {
      setEnOperacion(false);
    }
  }

  /** Paso rápido (−/+): sobre la cantidad actual. */
  function cambiarStock(producto, cambio) {
    const nuevo = Math.max(0, Number(producto.disponibilidad ?? producto.Disponibilidad ?? 0) + cambio);
    ejecutar(() => actualizarProducto(producto.id, { disponibilidad: nuevo }));
  }

  /** Inventario escrito: valida la cantidad y la envía como tal. */
  function guardarCantidad(producto, texto) {
    const cantidad = Number(texto);
    if (String(texto).trim() === "" || !Number.isInteger(cantidad) || cantidad < 0) {
      avisar("Cantidad inválida", "Escribe un número entero igual o mayor a 0.");
      return;
    }
    ejecutar(() => actualizarProducto(producto.id, { disponibilidad: cantidad }));
  }

  async function archivar(producto) {
    const confirmado = await confirmar(
      "Archivar producto",
      `"${producto.nombre || producto.Nombre}" dejará de aparecer en el catálogo público, pero se conserva en Firestore. ¿Continuar?`,
      { textoConfirmar: "Archivar" }
    );
    if (confirmado) ejecutar(() => archivarProducto(producto.id));
  }

  function restaurar(producto) {
    ejecutar(() => actualizarProducto(producto.id, { activo: true }));
  }

  function abrirFormulario(producto = null) {
    setProductoForm(producto);
    setFormVisible(true);
  }

  /** Cambia el estado del pedido (transición validada por la API). */
  function cambiarEstado(pedido, estado) {
    ejecutar(
      () => apiRequest(`/api/pedidos/${encodeURIComponent(pedido.id)}`, { method: "PATCH", body: { estado } }),
      `Ticket marcado como ${estado.replaceAll("_", " ")}.`
    );
  }

  /** Elimina un pedido (solo vendedor/administrador). */
  async function eliminarPedido(pedido) {
    ejecutar(
      () => apiRequest(`/api/pedidos/${encodeURIComponent(pedido.id)}`, { method: "DELETE" }),
      "Pedido eliminado."
    );
  }

  /**
   * Sustitución sin IDs: se toca "Reemplazar" en la línea del producto
   * (o sale solo si hay uno agotado), se busca el sustituto por nombre
   * y se confirma antes de mandarle la propuesta al comprador.
   */
  function abrirPropuesta(pedido, item = null) {
    if (pedido.estado === ESTADOS_PEDIDO.CAMBIO_PENDIENTE) {
      avisar("Esperando al comprador", "Ya hay una propuesta en curso; espera la respuesta del comprador para enviar otra.");
      return;
    }
    const originales = pedido.items || [];
    if (!originales.length) {
      avisar("Pedido vacío", "Este pedido no tiene productos para reemplazar.");
      return;
    }
    const itemAgotado = originales.find(i =>
      Number(productos.find(p => p.id === i.productoId)?.disponibilidad ?? 0) < Number(i.cantidad)
    );
    setPedidoPropuesta(pedido);
    setItemSustituir(item || itemAgotado || originales[0]);
    setSelectorVisible(true);
  }

  async function elegirSustituto(alternativo) {
    const pedido = pedidoPropuesta;
    const target = itemSustituir;
    setSelectorVisible(false);
    setPedidoPropuesta(null);
    setItemSustituir(null);
    if (!pedido || !target) return;

    const itemsPropuestos = (pedido.items || []).map(i =>
      i.productoId === target.productoId
        ? { productoId: alternativo.id, nombre: alternativo.nombre, precio: alternativo.precio, cantidad: i.cantidad, unidad: alternativo.unidad }
        : i
    );
    const confirmado = await confirmar(
      "Confirmar propuesta",
      `Reemplazar "${target.nombre} × ${target.cantidad}" por "${alternativo.nombre} × ${target.cantidad}"? El comprador debe aceptar la propuesta.`,
      { textoConfirmar: "Enviar propuesta" }
    );
    if (!confirmado) return;
    ejecutar(
      () => apiRequest(`/api/pedidos/${encodeURIComponent(pedido.id)}/propuesta`, {
        method: "PATCH",
        body: {
          itemsPropuestos,
          motivo: `Propuesta de reemplazo por inventario: ${target.nombre} → ${alternativo.nombre}`,
        },
      }),
      "Propuesta enviada: el comprador revisará el cambio."
    );
  }

  if (cargando) return <ActivityIndicator style={{ flex: 1 }} color={verde} />;

  const activos = productos.filter(estaActivo);
  const archivados = productos.filter(p => !estaActivo(p));
  const tickets = filtrarTickets(pedidos, filtroTickets);

  const resumenGenero = ["mujer", "hombre", "otro", "prefiero_no_decirlo"].map(g => ({ genero: g, total: pedidos.filter(p => p.generoComprador === g).length }));
  const populares = Object.values(pedidos.flatMap(p => (p.items || []).map(i => ({ nombre: i.nombre, genero: p.generoComprador || "sin dato", cantidad: Number(i.cantidad) || 0 }))).reduce((acc, i) => { const k = `${i.nombre}|${i.genero}`; acc[k] ||= { ...i, cantidad: 0 }; acc[k].cantidad += i.cantidad; return acc; }, {})).sort((a,b) => b.cantidad-a.cantidad).slice(0,10);

  // Propiedades de fila reutilizables entre activos y archivados.
  const propsFila = (producto) => ({
    producto,
    enOperacion,
    onPaso: (cambio) => cambiarStock(producto, cambio),
    onGuardarCantidad: (texto) => guardarCantidad(producto, texto),
    onEditar: () => abrirFormulario(producto),
    onArchivar: () => archivar(producto),
  });

  const listaInventario = <View>
    <View style={styles.filaTitulo}>
      <TouchableOpacity style={styles.botonNuevo} onPress={() => abrirFormulario(null)} disabled={enOperacion}>
        <Text style={styles.botonNuevoTexto}>＋ Nuevo producto</Text>
      </TouchableOpacity>
    </View>
    {activos.length === 0 ? <Text style={styles.vacioSeccion}>No hay productos activos. Crea uno con "Nuevo producto".</Text> : null}
    {activos.map(p => <FilaInventario key={p.id} {...propsFila(p)} />)}

    {archivados.length > 0 ? <View>
      <Text style={[styles.tituloSeccion, styles.tituloArchivados]}>Archivados ({archivados.length})</Text>
      <Text style={styles.metaArchivados}>No aparecen en el catálogo público. "Restaurar" los devuelve.</Text>
      {archivados.map(p => (
        <View key={p.id} style={styles.filaArchivado}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#7A867A" }}>{p.nombre || p.Nombre}</Text>
            <Text style={styles.metaProducto}>ID: {p.id}</Text>
          </View>
          <TouchableOpacity style={styles.botonMiniRestaurar} onPress={() => restaurar(p)} disabled={enOperacion}>
            <Text style={{ color: verde, fontWeight: "600" }}>Restaurar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View> : null}
  </View>;

  const seccionTickets = <View>
    <FiltrosPedidos valores={filtroTickets} onChange={setFiltroTickets} pedidos={pedidos} />
    <Text style={styles.contadorTickets}>Mostrando {tickets.length} de {pedidos.length} pedidos · se actualizan solos</Text>
  </View>;

  // La analítica (administrador) vive en su propia sección del menú lateral.
  const seccionAnalitica = <View>
    {analitica ? <GraficosHighcharts pedidosPorEstado={analitica.pedidosPorEstado} productosPopulares={analitica.productosPopulares} camposFormulario={analitica.camposFormulario} /> : null}
    <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 18 }}>Pedidos por estado</Text>
    {["pendiente", "en_preparacion", "listo", "entregado", "cancelado"].map(e => <Text key={e} style={{ padding: 8, backgroundColor: "white", marginTop: 4 }}>{e.replaceAll("_", " ")}: {pedidos.filter(p => p.estado === e).length}</Text>)}
    <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 18 }}>Pedidos por género registrado</Text>
    {resumenGenero.map(r => <Text key={r.genero} style={{ padding: 8, backgroundColor: "white", marginTop: 4 }}>{r.genero}: {r.total}</Text>)}
    <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 18 }}>10 productos más comprados por género</Text>
    {(analitica?.productosPopulares || populares).map((p,i) => <Text key={`${p.producto || p.nombre}-${p.genero}`} style={{ padding: 8, backgroundColor: "white", marginTop: 4 }}>{i+1}. {p.producto || p.nombre} · {p.genero} · {p.cantidad}</Text>)}
    <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 18 }}>Distribución de todos los campos</Text>
    {Object.entries(analitica?.camposFormulario || {}).flatMap(([entidad, campos]) => Object.entries(campos).flatMap(([campo, valores]) => typeof valores === "object" ? Object.entries(valores).map(([valor, cuenta]) => <Text key={`${entidad}-${campo}-${valor}`} style={{ padding: 7, backgroundColor: "white", marginTop: 3 }}>{entidad} · {campo}={valor}: {cuenta}</Text>) : [<Text key={`${entidad}-${campo}`} style={{ padding: 7, backgroundColor: "white", marginTop: 3 }}>{entidad} · {campo}: {valores}</Text>] ))}
    <Text style={{ color: "#5A6B57", marginTop: 8 }}>Las categorías de precio y existencias se muestran por valor registrado; al ampliar los formularios, la API añade sus nuevos campos a este resumen.</Text>
  </View>;

  return (
    <View style={{ flex: 1 }}>
    <FlatList style={{ flex: 1, backgroundColor: "#F4F7F1" }} contentContainerStyle={{ padding: 16, gap: 10 }}
      ListHeaderComponent={<View>
        <Text style={{ fontSize: 24, fontWeight: "700", color: verde }}>{TITULOS_SECCION[seccion] || TITULOS_SECCION.inventario}</Text>
        <Text style={{ marginTop: 4, color: "#5A6B57" }}>Todo se refresca solo: pedidos nuevos, cambios de estado y stock aparecen sin recargar.</Text>
        {seccion === "inventario" ? listaInventario : null}
        {seccion === "tickets" ? seccionTickets : null}
        {seccion === "analitica" && admin ? seccionAnalitica : null}
      </View>}
      data={seccion === "tickets" ? tickets : []}
      keyExtractor={p => p.id}
      ListEmptyComponent={seccion === "tickets"
        ? <Text style={styles.vacioSeccion}>Ningún ticket coincide con el filtro. Prueba "Todos" o borra la búsqueda.</Text>
        : null}
      renderItem={({ item }) => (
        <TarjetaTicket
          pedido={item}
          enOperacion={enOperacion}
          onPreparar={() => cambiarEstado(item, "en_preparacion")}
          onListo={() => cambiarEstado(item, "listo")}
          onEntregado={() => cambiarEstado(item, "entregado")}
          onProponer={(itemObjetivo) => abrirPropuesta(item, itemObjetivo)}
          onEliminar={() => eliminarPedido(item)}
        />
      )}
    />
    <FormularioProducto
      visible={formVisible}
      producto={productoForm}
      cerrar={() => setFormVisible(false)}
      alGuardado={cargar}
    />
    <SelectorProducto
      visible={selectorVisible}
      productos={activos.filter(p => p.activo !== false && p.id !== itemSustituir?.productoId)}
      cerrar={() => { setSelectorVisible(false); setPedidoPropuesta(null); setItemSustituir(null); }}
      onElegir={elegirSustituto}
      subtitulo={itemSustituir ? `Reemplazando: ${itemSustituir.nombre} × ${itemSustituir.cantidad}` : undefined}
    />
    {dialogos}
    </View>
  );
}

const styles = StyleSheet.create({
  filaTitulo: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 12, marginBottom: 2 },
  tituloSeccion: { fontWeight: "700", fontSize: 18 },
  tituloArchivados: { color: "#7A867A", marginTop: 14 },
  metaArchivados: { color: "#7A867A", fontSize: 12, marginTop: 2, marginBottom: 4 },
  vacioSeccion: { color: "#7A867A", marginTop: 6 },
  contadorTickets: { color: "#7A867A", fontSize: 12, marginTop: 6 },
  botonNuevo: { backgroundColor: verde, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  botonNuevoTexto: { color: "white", fontWeight: "700" },
  filaProducto: { backgroundColor: "white", padding: 12, marginTop: 6, borderRadius: 10 },
  filaEncabezado: { flexDirection: "row", alignItems: "center" },
  metaProducto: { color: "#7A867A", fontSize: 11, marginTop: 2 },
  filaControles: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  botonIcono: { padding: 8, backgroundColor: "#F4F7F1", borderRadius: 8, marginLeft: 4 },
  botonIconoTexto: { color: "#2B2F2B" },
  botonPaso: { backgroundColor: "#E8F5E9", borderRadius: 8, width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  botonPasoTexto: { color: verde, fontSize: 18, fontWeight: "700" },
  inputCantidad: { flex: 1, borderWidth: 1, borderColor: "#D5DDD3", borderRadius: 8, padding: 8, backgroundColor: "white", minWidth: 70 },
  botonGuardar: { backgroundColor: verde, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  botonGuardarTexto: { color: "white", fontWeight: "700", fontSize: 12 },
  filaArchivado: { backgroundColor: "white", padding: 12, marginTop: 6, borderRadius: 10, flexDirection: "row", alignItems: "center" },
  botonMiniRestaurar: { borderWidth: 1, borderColor: verde, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
});
