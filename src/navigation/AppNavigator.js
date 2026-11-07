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
import MenuAdministrador from "../components/MenuAdministrador";

import LoginScreen from "../screens/LoginScreen";
import RegistroScreen from "../screens/RegistroScreen";
import CatalogoScreen from "../screens/CatalogoScreen";
import DetalleProductoScreen from "../screens/DetalleProductoScreen";
import CarritoScreen from "../screens/CarritoScreen";
import MisPedidosScreen from "../screens/MisPedidosScreen";
import PagoScreen from "../screens/PagoScreen";
import OperacionScreen from "../screens/OperacionScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminUsuariosScreen from "../screens/admin/AdminUsuariosScreen";
import AdminSoporteScreen from "../screens/admin/AdminSoporteScreen";
import AdminProductosScreen from "../screens/admin/AdminProductosScreen";
import AdminReportesScreen from "../screens/admin/AdminReportesScreen";
import AdminConfiguracionScreen from "../screens/admin/AdminConfiguracionScreen";

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
      {rol === "administrador" ? (
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: "Dashboard" }} />
          <Stack.Screen name="AdminUsuarios" component={AdminUsuariosScreen} options={{ title: "Gestión de usuarios" }} />
          <Stack.Screen name="AdminSoporte" component={AdminSoporteScreen} options={{ title: "Centro de soporte" }} />
          <Stack.Screen name="AdminProductos" component={AdminProductosScreen} options={{ title: "Gestión de productos" }} />
          <Stack.Screen name="AdminReportes" component={AdminReportesScreen} options={{ title: "Reportes y analíticas" }} />
          <Stack.Screen name="AdminConfiguracion" component={AdminConfiguracionScreen} options={{ title: "Configuración" }} />
          <Stack.Screen name="Operacion" component={OperacionScreen} options={{ title: "Inventario y pedidos" }} />
        </>
      ) : rol !== "comprador" ? (
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
        name="PagoScreen"
        component={PagoScreen}
        options={{ title: "Pagar pedido" }}
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
   * Navega solo si el contenedor ya está montado. Para el panel operativo
   * va acompañado de la sección que abre (inventario/tickets/analítica).
   */
  function irA(pantalla, parametros) {
    if (navegacionRef.isReady()) navegacionRef.navigate(pantalla, parametros);
  }

  return (
    <SyncProvider usuarioId={usuario.uid}>
      <View style={{ flex: 1, backgroundColor: "#F4F7F1" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <IndicadorConexion />
          </View>
          {usuario.rol === "administrador" ? (
            <MenuAdministrador
              onSalir={salir}
              onNavegar={(seccion) => {
                const mapaSecciones = {
                  dashboard: "AdminDashboard",
                  usuarios: "AdminUsuarios",
                  monitoreo: "AdminMonitoreo",
                  soporte: "AdminSoporte",
                  productos: "AdminProductos",
                  reportes: "AdminReportes",
                  configuracion: "AdminConfiguracion",
                };
                irA(mapaSecciones[seccion] || "AdminDashboard");
              }}
            />
          ) : (
            <MenuPrincipal
              rol={usuario.rol || "comprador"}
              onInicio={() => (usuario.rol === "comprador" ? irA("Catalogo") : irA("Operacion", { seccion: "inventario" }))}
              onPedidos={() => (usuario.rol === "comprador" ? irA("MisPedidos") : irA("Operacion", { seccion: "tickets" }))}
              onInventario={() => irA("Operacion", { seccion: "inventario" })}
              onTickets={() => irA("Operacion", { seccion: "tickets" })}
              onAnalitica={() => irA("Operacion", { seccion: "analitica" })}
              onSalir={salir}
            />
          )}
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
