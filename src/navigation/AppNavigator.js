// src/navigation/AppNavigator.js
import React from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { SyncProvider } from "../context/SyncContext";

import IndicadorConexion from "../components/IndicadorConexion";
import AvisoSinConexion from "../components/AvisoSinConexion";
import MenuPrincipal from "../components/MenuPrincipal";

import LoginScreen from "../screens/LoginScreen";
import RegistroScreen from "../screens/RegistroScreen";
import CatalogoScreen from "../screens/CatalogoScreen";
import DetalleProductoScreen from "../screens/DetalleProductoScreen";
import CarritoScreen from "../screens/CarritoScreen";
import MisPedidosScreen from "../screens/MisPedidosScreen";
import AlertasStockScreen from "../screens/AlertasStockScreen";
import OperacionScreen from "../screens/OperacionScreen";

const Stack = createNativeStackNavigator();
const navegacionRef = createNavigationContainerRef();

const opcionesVerdes = {
  headerStyle: { backgroundColor: "#F4F7F1" },
  headerTintColor: "#2E5A2E",
  headerShadowVisible: false,
};

function PilaAutenticacion() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registro" component={RegistroScreen} />
    </Stack.Navigator>
  );
}

function PilaPrincipal({ rol }) {
  return (
    <Stack.Navigator screenOptions={opcionesVerdes}>
      {rol !== "comprador" ? (
        <Stack.Screen name="Operacion" component={OperacionScreen} options={{ title: rol === "administrador" ? "Administración" : "Gestión de mercado" }} />
      ) : <>
      <Stack.Screen name="Catalogo" component={CatalogoScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="DetalleProducto"
        component={DetalleProductoScreen}
        options={{ title: "Detalle del producto" }}
      />
      <Stack.Screen name="Carrito" component={CarritoScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="MisPedidos"
        component={MisPedidosScreen}
        options={{ title: "Mis pedidos" }}
      />
      <Stack.Screen
        name="AlertasStock"
        component={AlertasStockScreen}
        options={{ title: "Alertas de stock" }}
      />
      </>}
    </Stack.Navigator>
  );
}

/**
 * Sesión iniciada: carrito persistido y cola de sincronización de este uid.
 * El indicador queda por fuera del stack para no desaparecer al cambiar de pantalla.
 */
function ZonaAutenticada({ usuario }) {
  const { salir } = useAuth();

  /**
   * Navega solo si el contenedor ya está montado.
   */
  function irA(pantalla) {
    if (navegacionRef.isReady()) navegacionRef.navigate(pantalla);
  }

  return (
    <SyncProvider usuarioId={usuario.uid}>
      <View style={{ flex: 1, backgroundColor: "#F4F7F1" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <IndicadorConexion />
          </View>
          <MenuPrincipal
            rol={usuario.rol || "comprador"}
            onInicio={() => irA(usuario.rol === "comprador" ? "Catalogo" : "Operacion")}
            onPedidos={() => irA(usuario.rol === "comprador" ? "MisPedidos" : "Operacion")}
            onAlertas={() => irA(usuario.rol === "comprador" ? "AlertasStock" : "Operacion")}
            onSalir={salir}
          />
        </View>
        <AvisoSinConexion />
        <CartProvider usuarioId={usuario.uid}>
          <NavigationContainer ref={navegacionRef}>
            <PilaPrincipal rol={usuario.rol || "comprador"} />
          </NavigationContainer>
        </CartProvider>
      </View>
    </SyncProvider>
  );
}

export default function AppNavigator() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F1" }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F4F7F1" }}>
        <IndicadorConexion />
        <NavigationContainer>
          <PilaAutenticacion />
        </NavigationContainer>
      </View>
    );
  }

  return <ZonaAutenticada usuario={usuario} />;
}
