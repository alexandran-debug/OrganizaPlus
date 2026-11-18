import { apiRequest } from "@/services/api";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function RegisterScreen() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);

  async function registrarse() {
    if (!nombre.trim() || !correo.trim() || !clave) {
      Alert.alert("Atención", "Completa todos los campos.");
      return;
    }

    if (clave.length < 8) {
      Alert.alert(
        "Atención",
        "La contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    try {
      setCargando(true);

      const respuesta = await apiRequest("/register", {
        method: "POST",
        body: JSON.stringify({
          name: nombre.trim(),
          email: correo.trim(),
          password: clave,
          password_confirmation: clave,
        }),
      });

      await SecureStore.setItemAsync("organiza_token", respuesta.token);
      await SecureStore.setItemAsync(
        "organiza_usuario",
        JSON.stringify(respuesta.user),
      );

      router.replace("/");
    } catch (error) {
      Alert.alert(
        "No se pudo completar el registro",
        error instanceof Error ? error.message : "Inténtalo nuevamente.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.marca}>ORGANIZA+</Text>
      <Text style={styles.titulo}>Crear cuenta</Text>
      <Text style={styles.subtitulo}>
        Regístrate para comenzar a organizarte.
      </Text>

      <Text style={styles.etiqueta}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Tu nombre"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />

      <Text style={styles.etiqueta}>Correo electrónico</Text>
      <TextInput
        style={styles.input}
        placeholder="correo@ejemplo.com"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.etiqueta}>Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Mínimo 8 caracteres"
        value={clave}
        onChangeText={setClave}
        secureTextEntry
      />

      <Pressable style={styles.boton} onPress={registrarse} disabled={cargando}>
        {cargando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.textoBoton}>Crear cuenta</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace("/auth/login")}>
        <Text style={styles.registro}>¿Ya tienes cuenta? Inicia sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#F5F7FB",
  },
  marca: {
    color: "#5965D9",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 18,
  },
  titulo: {
    fontSize: 30,
    fontWeight: "800",
    color: "#20263A",
  },
  subtitulo: {
    color: "#747D91",
    marginTop: 8,
    marginBottom: 20,
  },
  etiqueta: {
    color: "#30364B",
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E6F0",
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
  },
  boton: {
    backgroundColor: "#5965D9",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
  },
  textoBoton: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  registro: {
    textAlign: "center",
    color: "#5965D9",
    fontWeight: "700",
    marginTop: 24,
  },
});
