import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import GraficosHighcharts from "../components/GraficosHighcharts";

const verde = "#2E7D32";

/** Panel operativo de vendedor y panel de métricas del administrador.
 *  El inventario se lee por /api/inventario, el endpoint privado con existencias. */
export default function OperacionScreen() {
  const { usuario } = useAuth();
  const admin = usuario?.rol === "administrador";
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [productoAlternativo, setProductoAlternativo] = useState("");
  const [analitica, setAnalitica] = useState(null);
  const cargar = useCallback(async () => {
    try {
      const [ps, os] = await Promise.all([apiRequest("/api/inventario"), apiRequest("/api/pedidos")]);
      setProductos(ps);
      setPedidos(os);
      if (usuario?.rol === "administrador") setAnalitica(await apiRequest("/api/analitica"));
    } catch (e) { Alert.alert("No se pudo cargar", e.message); }
    finally { setCargando(false); }
  }, [usuario?.rol]);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  async function actualizarStock(producto, cambio) {
    const nuevo = Math.max(0, Number(producto.disponibilidad || 0) + cambio);
    await apiRequest(`/api/productos/${encodeURIComponent(producto.id)}`, { method: "PATCH", body: { disponibilidad: nuevo } });
    cargar();
  }
  async function cambiarEstado(pedido, estado) {
    await apiRequest(`/api/pedidos/${encodeURIComponent(pedido.id)}`, { method: "PATCH", body: { estado } });
    cargar();
  }
  async function proponerCambio(pedido) {
    const alternativo = productos.find(p => p.id === productoAlternativo.trim());
    if (!alternativo) return Alert.alert("Producto no encontrado", "Escribe el ID de un producto del inventario.");
    const originales = pedido.items || [];
    const itemAgotado = originales.find(i => Number(i.disponibilidad ?? productos.find(p => p.id === i.productoId)?.disponibilidad ?? 0) < Number(i.cantidad));
    const target = itemAgotado || originales[0];
    if (!target) return;
    const itemsPropuestos = originales.map(i => i.productoId === target.productoId ? { productoId: alternativo.id, nombre: alternativo.nombre, precio: alternativo.precio, cantidad: i.cantidad, unidad: alternativo.unidad } : i);
    try {
      await apiRequest(`/api/pedidos/${encodeURIComponent(pedido.id)}/propuesta`, { method: "PATCH", body: { itemsPropuestos, motivo: `Propuesta de reemplazo por inventario: ${target.nombre} → ${alternativo.nombre}` } });
      setProductoAlternativo(""); cargar();
    } catch (e) { Alert.alert("No se pudo proponer el cambio", e.message); }
  }
  if (cargando) return <ActivityIndicator style={{ flex: 1 }} color={verde} />;
  /** Lista de inventario con botones + / −: se muestra a vendedor y administrador. */
  const listaInventario = <View>
    <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 18 }}>Inventario</Text>
    {productos.map(p => <View key={p.id} style={{ backgroundColor: "white", padding: 12, marginTop: 6, borderRadius: 10, flexDirection: "row", alignItems: "center" }}><View style={{ flex: 1 }}><Text>{p.nombre || p.Nombre} · stock {p.disponibilidad ?? p.Disponibilidad ?? 0}</Text><Text style={{ color: "#7A867A", fontSize: 11 }}>ID: {p.id}</Text></View><TouchableOpacity onPress={() => actualizarStock({ ...p, disponibilidad: p.disponibilidad ?? p.Disponibilidad }, -1)}><Text style={{ padding: 8, color: verde }}>−</Text></TouchableOpacity><TouchableOpacity onPress={() => actualizarStock({ ...p, disponibilidad: p.disponibilidad ?? p.Disponibilidad }, 1)}><Text style={{ padding: 8, color: verde }}>+</Text></TouchableOpacity></View>)}
  </View>;

  const resumenGenero = ["mujer", "hombre", "otro", "prefiero_no_decirlo"].map(g => ({ genero: g, total: pedidos.filter(p => p.generoComprador === g).length }));
  const populares = Object.values(pedidos.flatMap(p => (p.items || []).map(i => ({ nombre: i.nombre, genero: p.generoComprador || "sin dato", cantidad: Number(i.cantidad) || 0 }))).reduce((acc, i) => { const k = `${i.nombre}|${i.genero}`; acc[k] ||= { ...i, cantidad: 0 }; acc[k].cantidad += i.cantidad; return acc; }, {})).sort((a,b) => b.cantidad-a.cantidad).slice(0,10);
  return <FlatList style={{ flex: 1, backgroundColor: "#F4F7F1" }} contentContainerStyle={{ padding: 16, gap: 10 }}
    ListHeaderComponent={<View>
      <Text style={{ fontSize: 24, fontWeight: "700", color: verde }}>{admin ? "Dashboard de mercado" : "Pedidos por gestionar"}</Text>
      {admin ? <>
        <Text style={{ marginTop: 8, color: "#5A6B57" }}>Ajusta el stock aquí abajo y revisa las métricas del mercado.</Text>
        {listaInventario}
        <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 18 }}>Resumen de pedidos y productos</Text>
        {analitica ? <GraficosHighcharts pedidosPorEstado={analitica.pedidosPorEstado} productosPopulares={analitica.productosPopulares} camposFormulario={analitica.camposFormulario} /> : null}
        <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 18 }}>Pedidos por estado</Text>
        {["recibido", "en_preparacion", "listo", "entregado", "cancelado"].map(e => <Text key={e} style={{ padding: 8, backgroundColor: "white", marginTop: 4 }}>{e.replaceAll("_", " ")}: {pedidos.filter(p => p.estado === e).length}</Text>)}
        <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 18 }}>Pedidos por género registrado</Text>
        {resumenGenero.map(r => <Text key={r.genero} style={{ padding: 8, backgroundColor: "white", marginTop: 4 }}>{r.genero}: {r.total}</Text>)}
        <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 18 }}>10 productos más comprados por género</Text>
        {(analitica?.productosPopulares || populares).map((p,i) => <Text key={`${p.producto || p.nombre}-${p.genero}`} style={{ padding: 8, backgroundColor: "white", marginTop: 4 }}>{i+1}. {p.producto || p.nombre} · {p.genero} · {p.cantidad}</Text>)}
        <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 18 }}>Distribución de todos los campos</Text>
        {Object.entries(analitica?.camposFormulario || {}).flatMap(([entidad, campos]) => Object.entries(campos).flatMap(([campo, valores]) => typeof valores === "object" ? Object.entries(valores).map(([valor, cuenta]) => <Text key={`${entidad}-${campo}-${valor}`} style={{ padding: 7, backgroundColor: "white", marginTop: 3 }}>{entidad} · {campo}={valor}: {cuenta}</Text>) : [<Text key={`${entidad}-${campo}`} style={{ padding: 7, backgroundColor: "white", marginTop: 3 }}>{entidad} · {campo}: {valores}</Text>] ))}
        <Text style={{ color: "#5A6B57", marginTop: 8 }}>Las categorías de precio y existencias se muestran por valor registrado; al ampliar los formularios, la API añade sus nuevos campos a este resumen.</Text>
      </> : <>
        <Text style={{ marginTop: 8, color: "#5A6B57" }}>Actualiza inventario y revisa solicitudes pendientes.</Text>
        {listaInventario}
      </>}
    </View>}
    data={admin ? [] : pedidos.filter(p => !["cancelado", "entregado"].includes(p.estado))}
    keyExtractor={p => p.id}
    renderItem={({ item }) => <View style={{ backgroundColor: "white", borderRadius: 10, padding: 12 }}><Text style={{ fontWeight: "700" }}>Pedido {item.id}</Text><Text>Cliente: {item.usuarioId} · Total: ${item.total || 0} · Estado: {item.estado}</Text><Text>{(item.items || []).map(i => `${i.nombre} x${i.cantidad}`).join(", ")}</Text>{item.estado !== "cambio_pendiente" ? <><TextInput value={productoAlternativo} onChangeText={setProductoAlternativo} placeholder="ID producto alternativo del inventario" style={{ backgroundColor: "#F4F7F1", padding: 9, marginTop: 8, borderRadius: 6 }} /><TouchableOpacity onPress={() => proponerCambio(item)} style={{ backgroundColor: "#E6A700", padding: 8, borderRadius: 6, alignSelf: "flex-start", marginTop: 6 }}><Text style={{ color: "white" }}>Proponer reemplazo por stock</Text></TouchableOpacity></> : <Text style={{ color: "#8D5B00", marginTop: 6 }}>Esperando respuesta del comprador a la propuesta.</Text>}<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>{[["en_preparacion", "Preparar"], ["listo", "Listo"], ["entregado", "Entregado"]].map(([e,t]) => <TouchableOpacity key={e} onPress={() => cambiarEstado(item,e)} style={{ backgroundColor: verde, padding: 8, borderRadius: 6 }}><Text style={{ color: "white" }}>{t}</Text></TouchableOpacity>)}</View></View>}
  />;
}
