import "dotenv/config";
import express from "express";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID || "mercaverde-2a8ad" });
const db = getFirestore();
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

async function autenticar(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Falta token de acceso." });
    req.identidad = await getAuth().verifyIdToken(token);
    const perfil = await db.collection("usuarios").doc(req.identidad.uid).get();
    req.perfil = perfil.data() || { rol: "comprador" };
    next();
  } catch { res.status(401).json({ error: "Sesión inválida." }); }
}
const permitir = (...roles) => (req, res, next) => (roles.includes(req.perfil?.rol) || (req.perfil?.rol === "cliente" && roles.includes("comprador"))) ? next() : res.status(403).json({ error: "No tienes permisos para esta operación." });
const error = (res, e) => res.status(400).json({ error: e.message || "Solicitud inválida." });
const plano = (valor) => valor?.toMillis ? valor.toMillis() : valor;
const documentoPlano = (d) => Object.fromEntries(Object.entries(d.data()).map(([k, v]) => [k, plano(v)]));

/** Toma el primer campo que exista (hay documentos con "nombre" y otros con "Nombre"). */
const primerCampo = (data, ...nombres) => {
  for (const nombre of nombres) {
    const valor = data?.[nombre];
    if (valor != null && valor !== "") return valor;
  }
  return "";
};

/**
 * Vista pública del catálogo: lo que el comprador puede ver.
 * El stock (disponibilidad) es dato privado del inventario: no se expone
 * a compradores, ni siquiera como indicador de "agotado". Las existencias
 * se consultan y editan por /api/inventario (solo vendedor y administrador).
 */
function vistaPublica(data = {}) {
  return {
    nombre: primerCampo(data, "nombre", "Nombre") || "Sin nombre",
    descripcion: primerCampo(data, "descripcion", "Descripcion", "Descripción"),
    precio: Number(primerCampo(data, "precio", "Precio")) || 0,
    unidad: primerCampo(data, "unidad", "Unidad") || "unidad",
    categoria: primerCampo(data, "categoria", "Categoria", "Categoría") || "Sin categoría",
    productor: primerCampo(data, "productor", "Productor"),
    imagenUrl: primerCampo(data, "imagenUrl", "ImagenUrl", "imagenURL"),
  };
}

/**
 * Lee el stock de un documento aunque el campo tenga otra mayúscula o un
 * espacio de más (los datos cargados a mano dejaron variantes como
 * "Disponibilidad " con espacio al final junto al campo "disponibilidad").
 * El orden prioriza el campo canónico en minúscula.
 */
function stockDe(data = {}) {
  for (const nombre of ["disponibilidad", "Disponibilidad", "Disponibilidad ", "disponibilidad "]) {
    const valor = data[nombre];
    if (valor != null && valor !== "") return Number(valor) || 0;
  }
  return 0;
}

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/catalogo", autenticar, async (_req, res) => {
  const snap = await db.collection("Productos").get();
  res.json(snap.docs.map(d => ({ id: d.id, ...vistaPublica(d.data()) })));
});
app.get("/api/inventario", autenticar, permitir("vendedor", "administrador"), async (_req, res) => {
  const snap = await db.collection("Productos").get();
  res.json(snap.docs.map(d => {
    const data = d.data();
    // Se entrega la existencias como un único campo "disponibilidad",
    // aunque el documento lo tenga duplicado con otra mayúscula o espacios.
    const datos = { ...data };
    for (const nombre of ["Disponibilidad", "Disponibilidad ", "disponibilidad "]) delete datos[nombre];
    return { id: d.id, ...datos, disponibilidad: stockDe(data) };
  }));
});
app.post("/api/pedidos", autenticar, permitir("comprador"), async (req, res) => {
  try {
    const { id, items } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "El pedido requiere productos." });
    const perfil = await db.collection("usuarios").doc(req.identidad.uid).get();
    const pedidosRef = db.collection("pedidos");
    const pedidoRef = id ? pedidosRef.doc(id) : pedidosRef.doc();
    const result = await db.runTransaction(async tx => {
      let total = 0;
      const normalizedItems = [];
      for (const item of items) {
        if (!Number.isInteger(item.cantidad) || item.cantidad < 1) throw new Error("Cantidad inválida.");
        const ref = db.collection("Productos").doc(item.productoId);
        const productSnap = await tx.get(ref);
        if (!productSnap.exists) throw new Error("Producto inexistente.");
        const p = productSnap.data();
        const stock = stockDe(p);
        if (stock < item.cantidad) throw new Error(`${p.nombre || p.Nombre}: inventario insuficiente (disponible ${stock}).`);
        const precio = Number(p.precio ?? p.Precio ?? 0);
        total += precio * item.cantidad;
        normalizedItems.push({ productoId: item.productoId, nombre: p.nombre || p.Nombre || "Producto", precio, cantidad: item.cantidad, unidad: p.unidad || p.Unidad || "unidad" });
      }
      tx.set(pedidoRef, { usuarioId: req.identidad.uid, generoComprador: perfil.data()?.genero || "prefiero_no_decirlo", items: normalizedItems, total, estado: "recibido", creadoEn: FieldValue.serverTimestamp() });
      return { total, items: normalizedItems };
    });
    res.status(201).json({ id: pedidoRef.id, ...result, estado: "recibido" });
  } catch (e) { error(res, e); }
});
app.get("/api/pedidos", autenticar, async (req, res) => {
  const ref = db.collection("pedidos");
  const esComprador = ["comprador", "cliente"].includes(req.perfil.rol);
  if (!esComprador && !["vendedor", "administrador"].includes(req.perfil.rol)) return res.status(403).json({ error: "No tienes permisos para consultar pedidos." });
  const snap = esComprador ? await ref.where("usuarioId", "==", req.identidad.uid).get() : await ref.get();
  res.json(snap.docs.map(d => ({ id: d.id, ...documentoPlano(d) })));
});
app.patch("/api/pedidos/:id/cancelar", autenticar, permitir("comprador"), async (req, res) => {
  try {
    const ref = db.collection("pedidos").doc(req.params.id);
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data().usuarioId !== req.identidad.uid) throw new Error("Pedido no encontrado.");
      if (snap.data().estado !== "recibido") throw new Error("Solo se puede cancelar antes de que el vendedor empiece a separar el pedido.");
      tx.update(ref, { estado: "cancelado", actualizadoEn: FieldValue.serverTimestamp() });
    });
    res.json({ ok: true });
  } catch (e) { error(res, e); }
});
app.patch("/api/pedidos/:id", autenticar, permitir("vendedor", "administrador"), async (req, res) => {
  const allowed = ["en_preparacion", "listo", "entregado"];
  if (!allowed.includes(req.body.estado)) return res.status(400).json({ error: "Estado no permitido." });
  try {
    const ref = db.collection("pedidos").doc(req.params.id);
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Pedido no encontrado.");
      const pedido = snap.data();
      const transiciones = { recibido: ["en_preparacion"], en_preparacion: ["listo"], listo: ["entregado"] };
      if (!transiciones[pedido.estado]?.includes(req.body.estado)) throw new Error("El pedido no puede avanzar a ese estado.");
      if (req.body.estado === "en_preparacion") {
        if (pedido.estado === "cambio_pendiente") throw new Error("Espera la respuesta del comprador antes de preparar.");
        const stocks = [];
        const cantidades = (pedido.items || []).reduce((map, item) => { map.set(item.productoId, (map.get(item.productoId) || 0) + Number(item.cantidad)); return map; }, new Map());
        for (const [productoId, cantidad] of cantidades) {
          const productRef = db.collection("Productos").doc(productoId);
          const product = await tx.get(productRef);
          if (!product.exists) throw new Error(`Producto no encontrado: ${productoId}.`);
          const stock = stockDe(product.data());
          if (stock < cantidad) throw new Error(`${product.data().nombre || product.data().Nombre}: inventario insuficiente. Propón un reemplazo al comprador.`);
          stocks.push({ productRef, stock, cantidad });
        }
        for (const s of stocks) tx.update(s.productRef, { disponibilidad: s.stock - s.cantidad });
      }
      tx.update(ref, { estado: req.body.estado, actualizadoEn: FieldValue.serverTimestamp() });
    }); res.json({ ok: true });
  }
  catch (e) { error(res, e); }
});
app.patch("/api/pedidos/:id/propuesta", autenticar, permitir("vendedor", "administrador"), async (req, res) => {
  const { itemsPropuestos, motivo } = req.body;
  if (!Array.isArray(itemsPropuestos) || !itemsPropuestos.length) return res.status(400).json({ error: "La propuesta debe incluir productos." });
  try {
    const ref = db.collection("pedidos").doc(req.params.id);
    await db.runTransaction(async tx => {
      const pedido = await tx.get(ref);
      if (!pedido.exists || pedido.data().estado !== "recibido") throw new Error("Solo se pueden proponer cambios antes de separar el pedido.");
      tx.update(ref, { estado: "cambio_pendiente", itemsPropuestos, motivoCambio: motivo || "Ajuste por disponibilidad", actualizadoEn: FieldValue.serverTimestamp() });
    }); res.json({ ok: true });
  }
  catch (e) { error(res, e); }
});
app.patch("/api/pedidos/:id/respuesta-cambio", autenticar, permitir("comprador"), async (req, res) => {
  const aceptar = req.body.aceptar === true;
  try {
    const ref = db.collection("pedidos").doc(req.params.id);
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data().usuarioId !== req.identidad.uid) throw new Error("Pedido no encontrado.");
      if (snap.data().estado !== "cambio_pendiente") throw new Error("El pedido no tiene cambios pendientes.");
      if (aceptar) {
        const propuesta = snap.data().itemsPropuestos || [];
        let total = 0;
        const itemsCanonicos = [];
        for (const item of propuesta) {
          if (!Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) < 1) throw new Error("Cantidad inválida en la propuesta.");
          const product = await tx.get(db.collection("Productos").doc(item.productoId));
          if (!product.exists) throw new Error(`El producto ${item.nombre} ya no está disponible.`);
          const stock = stockDe(product.data());
          if (stock < Number(item.cantidad)) throw new Error(`${item.nombre}: inventario insuficiente para aceptar el cambio.`);
          const data = product.data();
          const precio = Number(data.precio ?? data.Precio ?? 0);
          total += precio * Number(item.cantidad);
          itemsCanonicos.push({ productoId: item.productoId, nombre: data.nombre || data.Nombre || "Producto", precio, cantidad: Number(item.cantidad), unidad: data.unidad || data.Unidad || "unidad" });
        }
        tx.update(ref, { items: itemsCanonicos, total, itemsPropuestos: FieldValue.delete(), estado: "recibido", respuestaCambio: "aceptado" });
      } else tx.update(ref, { itemsPropuestos: FieldValue.delete(), estado: "recibido", respuestaCambio: "rechazado" });
    }); res.json({ ok: true });
  } catch (e) { error(res, e); }
});
app.patch("/api/productos/:id", autenticar, permitir("vendedor", "administrador"), async (req, res) => {
  const stock = Number(req.body.disponibilidad);
  if (!Number.isFinite(stock) || stock < 0) return res.status(400).json({ error: "Inventario inválido." });
  try {
    const ref = db.collection("Productos").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Producto no encontrado." });
    // Escribe el campo canónico "disponibilidad" y borra las variantes
    // duplicadas ("Disponibilidad", "Disponibilidad " con espacio) para que
    // consola, panel y validaciones de pedidos vean siempre el mismo número.
    const cambios = { disponibilidad: stock };
    for (const nombre of ["Disponibilidad", "Disponibilidad ", "disponibilidad "]) {
      if (snap.data()[nombre] !== undefined) cambios[nombre] = FieldValue.delete();
    }
    await ref.update(cambios);
    res.json({ ok: true });
  } catch (e) { error(res, e); }
});
app.get("/api/analitica", autenticar, permitir("administrador"), async (_req, res) => {
  const [os, ps, us] = await Promise.all([db.collection("pedidos").get(), db.collection("Productos").get(), db.collection("usuarios").get()]);
  const orders = os.docs.map(d => d.data());
  const users = Object.fromEntries(us.docs.map(d => [d.id, d.data()]));
  const agruparCampos = (registros, campos) => Object.fromEntries(campos.map(campo => [campo, registros.reduce((grupos, registro) => { const valor = registro[campo] == null || typeof registro[campo] === "object" ? (registro[campo] == null ? "Sin dato" : "Con valor") : String(registro[campo]); grupos[valor] = (grupos[valor] || 0) + 1; return grupos; }, {})]));
  const popular = {};
  for (const o of orders) for (const i of o.items || []) { const gender = o.generoComprador || users[o.usuarioId]?.genero || "sin dato"; const key = `${i.nombre}|${gender}`; popular[key] ||= { producto: i.nombre, genero: gender, cantidad: 0 }; popular[key].cantidad += Number(i.cantidad || 0); }
  const productRows = ps.docs.map(d => d.data());
  const orderFields = agruparCampos(orders.map(o => ({ ...o, generoComprador: o.generoComprador || users[o.usuarioId]?.genero || "sin dato", cantidadProductos: (o.items || []).reduce((n, i) => n + Number(i.cantidad || 0), 0) })), ["usuarioId", "estado", "generoComprador", "total", "cantidadProductos", "creadoEn"]);
  const productFields = agruparCampos(productRows.map(p => ({ nombre: p.nombre || p.Nombre, descripcion: p.descripcion || p.Descripción, precio: p.precio ?? p.Precio, unidad: p.unidad || p.Unidad, disponibilidad: stockDe(p), categoria: p.categoria || p.Categoría || p["Categoría "], productor: p.productor || p.Productor, imagenUrl: p.imagenUrl || p.imagenURL, activo: p.activo ?? p.Activo })), ["nombre", "descripcion", "precio", "unidad", "disponibilidad", "categoria", "productor", "imagenUrl", "activo"]);
  const userFields = agruparCampos(Object.values(users), ["nombre", "correo", "rol", "genero"]);
  const popularTotals = Object.values(popular).reduce((totals, item) => { totals[item.producto] = (totals[item.producto] || 0) + item.cantidad; return totals; }, {});
  const topNames = new Set(Object.entries(popularTotals).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name));
  const productosPopulares = Object.values(popular).filter(item => topNames.has(item.producto));
  res.json({ pedidosPorEstado: Object.fromEntries(["recibido", "en_preparacion", "cambio_pendiente", "listo", "entregado", "cancelado"].map(s => [s, orders.filter(o => o.estado === s).length])), pedidosPorGenero: Object.fromEntries([...new Set(Object.values(users).map(u => u.genero || "sin dato"))].map(g => [g, orders.filter(o => (o.generoComprador || users[o.usuarioId]?.genero || "sin dato") === g).length])), camposFormulario: { pedidos: orderFields, productos: productFields, usuarios: { total: us.size, ...userFields } }, productosPopulares });
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`MercaVerde API escuchando en ${port}`));
