// App.js
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ConexionProvider } from "./src/context/ConexionContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ConexionProvider>
        <AuthProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7F1" }} edges={["top"]}>
            <StatusBar style="dark" />
            <AppNavigator />
          </SafeAreaView>
        </AuthProvider>
      </ConexionProvider>
    </SafeAreaProvider>
  );
}
