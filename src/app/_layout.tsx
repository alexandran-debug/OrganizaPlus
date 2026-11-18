import {
  DarkTheme,
  DefaultTheme,
  Redirect,
  Slot,
  ThemeProvider,
  useSegments,
} from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const enAuth = segments[0] === "auth";

  const [verificando, setVerificando] = useState(true);
  const [tieneSesion, setTieneSesion] = useState(false);

  // Revisar la sesión al iniciar y cuando cambia la ruta de autenticación.
  useEffect(() => {
    setVerificando(true);
    async function verificarSesion() {
      try {
        const token = await SecureStore.getItemAsync("organiza_token");
        setTieneSesion(Boolean(token));
      } catch (error) {
        console.error("Error al verificar sesión:", error);
        setTieneSesion(false);
      } finally {
        setVerificando(false);
      }
    }

    verificarSesion();
  }, [enAuth]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {verificando ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#5965D9" />
        </View>
      ) : !tieneSesion && !enAuth ? (
        <Redirect href="/auth/login" />
      ) : tieneSesion && enAuth ? (
        <Redirect href="/" />
      ) : (
        <Slot />
      )}

      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}
