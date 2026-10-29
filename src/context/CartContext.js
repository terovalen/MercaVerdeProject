// src/context/CartContext.js
// Carrito persistido por usuario. Se rehidrata al abrir la app y se
// vuelve a guardar en cada cambio, para que sobreviva al cierre y al reinicio.

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { guardarCarritoLocal, leerCarritoLocal } from "../data/repositorioLocal";

const CartContext = createContext(null);

export function CartProvider({ usuarioId, children }) {
  const [items, setItems] = useState([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setListo(false);

    leerCarritoLocal(usuarioId)
      .then((guardados) => {
        if (!cancelado) setItems(guardados);
      })
      .catch(() => {
        if (!cancelado) setItems([]);
      })
      .finally(() => {
        if (!cancelado) setListo(true);
      });

    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  useEffect(() => {
    if (!listo || !usuarioId) return;
    guardarCarritoLocal(usuarioId, items);
  }, [items, listo, usuarioId]);

  /**
   * Suma cantidad si el producto ya está en el carrito; si no, lo agrega.
   */
  function agregarProducto(producto, cantidad = 1) {
    setItems((prev) => {
      const existente = prev.find((item) => item.productoId === producto.id);
      if (existente) {
        return prev.map((item) =>
          item.productoId === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          unidad: producto.unidad,
          cantidad,
        },
      ];
    });
  }

  /**
   * Cambia la cantidad. En cero, quita el producto.
   */
  function actualizarCantidad(productoId, cantidad) {
    if (cantidad <= 0) {
      quitarProducto(productoId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.productoId === productoId ? { ...item, cantidad } : item))
    );
  }

  /**
   * Elimina una línea del carrito.
   */
  function quitarProducto(productoId) {
    setItems((prev) => prev.filter((item) => item.productoId !== productoId));
  }

  /**
   * Deja el carrito vacío después de confirmar el pedido.
   */
  function vaciarCarrito() {
    setItems([]);
  }

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
    [items]
  );

  const value = {
    items,
    total,
    agregarProducto,
    actualizarCantidad,
    quitarProducto,
    vaciarCarrito,
  };

  if (!listo) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F1" }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook del carrito. Debe usarse dentro de CartProvider.
 */
export function useCart() {
  return useContext(CartContext);
}
