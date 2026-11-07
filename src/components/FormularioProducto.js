/**
 * Formulario para crear y editar productos.
 * Al crear, el id lo pone el servidor; al editar, el id viaja por dentro.
 * La imagen es una URL pegada a mano, como la de los productos que ya
 * estaban cargados, así que no dependemos de Storage.
 */
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { crearProducto, actualizarProducto } from "../services/productosService";

const VERDE = "#2E7D32";

const CAMPO_INICIAL = {
  nombre: "",
  descripcion: "",
  precio: "",
  unidad: "unidad",
  categoria: "",
  productor: "",
  imagenUrl: "",
  disponibilidad: "",
};

export default function FormularioProducto({ visible, producto, cerrar, alGuardado }) {
  const esEdicion = Boolean(producto?.id);
  const [campos, setCampos] = useState(CAMPO_INICIAL);
  const [activo, setActivo] = useState(true);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCampos(producto
      ? {
          nombre: String(producto.nombre || ""),
          descripcion: String(producto.descripcion || ""),
          precio: String(producto.precio ?? ""),
          unidad: String(producto.unidad || "unidad"),
          categoria: String(producto.categoria || ""),
          productor: String(producto.productor || ""),
          imagenUrl: String(producto.imagenUrl || ""),
          disponibilidad: producto.disponibilidad == null ? "" : String(producto.disponibilidad),
        }
      : CAMPO_INICIAL);
    setActivo(producto ? producto.activo !== false : true);
    setErrores({});
    setErrorGeneral("");
  }, [visible, producto]);

  const poner = (campo, valor) => setCampos(previo => ({ ...previo, [campo]: valor }));

  /** Validación en el celular: los mensajes se muestran bajo cada campo. */
  function validar() {
    const lista = {};
    if (!campos.nombre.trim()) lista.nombre = "El nombre es obligatorio.";
    const precio = Number(String(campos.precio).replace(",", "."));
    if (String(campos.precio).trim() === "" || !Number.isFinite(precio) || precio < 0) {
      lista.precio = "Escribe un precio numérico igual o mayor a 0.";
    }
    if (String(campos.disponibilidad).trim() !== "") {
      const stock = Number(campos.disponibilidad);
      if (!Number.isInteger(stock) || stock < 0) {
        lista.disponibilidad = "La cantidad debe ser un número entero igual o mayor a 0.";
      }
    }
    setErrores(lista);
    return Object.keys(lista).length === 0;
  }

  async function guardar() {
    setErrorGeneral("");
    if (!validar()) return;
    setGuardando(true);
    try {
      const datos = {
        nombre: campos.nombre.trim(),
        descripcion: campos.descripcion.trim(),
        precio: Number(String(campos.precio).replace(",", ".")),
        unidad: campos.unidad.trim() || "unidad",
        categoria: campos.categoria.trim() || "Sin categoría",
        productor: campos.productor.trim(),
        imagenUrl: campos.imagenUrl.trim(),
        ...(String(campos.disponibilidad).trim() !== ""
          ? { disponibilidad: Number(campos.disponibilidad) }
          : {}),
      };

      // El ID lo asigna el servidor; la app jamás escribe uno a mano.
      if (esEdicion) {
        await actualizarProducto(producto.id, { ...datos, activo });
      } else {
        await crearProducto(datos);
      }

      Alert.alert("Listo", esEdicion ? "Producto actualizado." : "Producto creado.");
      alGuardado?.();
      cerrar?.();
    } catch (e) {
      setErrorGeneral(e.message || "No se pudo guardar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <ScrollView style={styles.cuerpo} contentContainerStyle={styles.contenido}>
        <Text style={styles.titulo}>{esEdicion ? "Editar producto" : "Nuevo producto"}</Text>

        {errorGeneral ? <Text style={styles.errorGeneral}>{errorGeneral}</Text> : null}

        {campos.imagenUrl.trim() ? (
          <Image source={{ uri: campos.imagenUrl.trim() }} style={styles.imagen} />
        ) : (
          <View style={[styles.imagen, styles.imagenVacia]}>
            <Text style={{ color: "#9AA79A" }}>Sin imagen: pega una URL abajo</Text>
          </View>
        )}

        <Text style={styles.etiqueta}>URL de la imagen</Text>
        <TextInput
          style={styles.input}
          value={campos.imagenUrl}
          onChangeText={v => poner("imagenUrl", v)}
          placeholder="https://… (enlace de la foto del producto)"
          placeholderTextColor="#AAA"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Text style={styles.ayudaImagen}>Copia desde el navegador el enlace de una foto del producto y pégalo aquí; se verá en el catálogo igual que los demás.</Text>

        <Text style={styles.etiqueta}>Nombre *</Text>
        <TextInput style={styles.input} value={campos.nombre} onChangeText={v => poner("nombre", v)} placeholder="Ej: Galletas festival" placeholderTextColor="#AAA" />
        {errores.nombre ? <Text style={styles.errorCampo}>{errores.nombre}</Text> : null}

        <Text style={styles.etiqueta}>Descripción</Text>
        <TextInput style={[styles.input, styles.textoLargo]} value={campos.descripcion} onChangeText={v => poner("descripcion", v)} multiline placeholder="Detalles del producto" placeholderTextColor="#AAA" />

        <View style={styles.filaDos}>
          <View style={{ flex: 1 }}>
            <Text style={styles.etiqueta}>Precio *</Text>
            <TextInput
              style={styles.input}
              value={campos.precio}
              onChangeText={v => poner("precio", v.replace(/[^\d.,]/g, ""))}
              keyboardType="decimal-pad"
              placeholder="1400"
              placeholderTextColor="#AAA"
            />
            {errores.precio ? <Text style={styles.errorCampo}>{errores.precio}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.etiqueta}>Unidad *</Text>
            <TextInput style={styles.input} value={campos.unidad} onChangeText={v => poner("unidad", v)} placeholder="libra, paquete…" placeholderTextColor="#AAA" />
          </View>
        </View>

        <Text style={styles.etiqueta}>Categoría</Text>
        <TextInput style={styles.input} value={campos.categoria} onChangeText={v => poner("categoria", v)} placeholder="Snacks, Bebidas…" placeholderTextColor="#AAA" />

        <Text style={styles.etiqueta}>Productor</Text>
        <TextInput style={styles.input} value={campos.productor} onChangeText={v => poner("productor", v)} placeholder="Finca, distribuidora…" placeholderTextColor="#AAA" />

        <Text style={styles.etiqueta}>Disponibilidad (cantidad en stock)</Text>
        <TextInput
          style={styles.input}
          value={campos.disponibilidad}
          onChangeText={v => poner("disponibilidad", v.replace(/[^\d]/g, ""))}
          keyboardType="number-pad"
          placeholder="Escribe la cantidad exacta"
          placeholderTextColor="#AAA"
        />
        {errores.disponibilidad ? <Text style={styles.errorCampo}>{errores.disponibilidad}</Text> : null}

        {esEdicion ? (
          <View style={styles.filaActivo}>
            <Text style={styles.etiquetaSinMargen}>Activo (visible en el catálogo)</Text>
            <Switch value={activo} onValueChange={setActivo} thumbColor={activo ? VERDE : "#CCC"} />
          </View>
        ) : null}

        {guardando ? <ActivityIndicator color={VERDE} style={{ marginTop: 14 }} /> : null}

        <TouchableOpacity style={styles.botonGuardar} onPress={guardar} disabled={guardando}>
          <Text style={styles.botonGuardarTexto}>{guardando ? "Guardando…" : "Guardar producto"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonCancelar} onPress={cerrar} disabled={guardando}>
          <Text style={styles.botonCancelarTexto}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cuerpo: { flex: 1, backgroundColor: "#F4F7F1" },
  contenido: { padding: 16, paddingBottom: 40 },
  titulo: { fontSize: 22, fontWeight: "700", color: VERDE, marginBottom: 12 },
  errorGeneral: { color: "#C62828", backgroundColor: "#FFEBEE", padding: 10, borderRadius: 8, marginBottom: 10 },
  imagen: { width: "100%", height: 170, borderRadius: 12, marginBottom: 8 },
  imagenVacia: { backgroundColor: "#E9EEE6", justifyContent: "center", alignItems: "center" },
  ayudaImagen: { color: "#7A867A", fontSize: 12, marginTop: 4 },
  etiqueta: { fontWeight: "600", color: "#2B2F2B", marginTop: 10, marginBottom: 4 },
  etiquetaSinMargen: { fontWeight: "600", color: "#2B2F2B" },
  input: { backgroundColor: "white", borderRadius: 8, borderWidth: 1, borderColor: "#D5DDD3", padding: 10 },
  textoLargo: { minHeight: 60, textAlignVertical: "top" },
  filaDos: { flexDirection: "row", gap: 10 },
  filaActivo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  errorCampo: { color: "#C62828", fontSize: 12, marginTop: 3 },
  botonGuardar: { backgroundColor: VERDE, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 18 },
  botonGuardarTexto: { color: "white", fontWeight: "700", fontSize: 15 },
  botonCancelar: { padding: 14, alignItems: "center", marginTop: 8 },
  botonCancelarTexto: { color: "#7A867A", fontWeight: "600" },
});
