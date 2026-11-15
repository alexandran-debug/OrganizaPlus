import { CameraView, useCameraPermissions } from "expo-camera";
import { Directory, File, Paths } from "expo-file-system";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPhotoCaptured: (uri: string) => void;
};

export default function CamaraTarea({
  visible,
  onClose,
  onPhotoCaptured,
}: Props) {
  const camaraRef = useRef<CameraView | null>(null);
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [camaraLista, setCamaraLista] = useState(false);
  const [capturando, setCapturando] = useState(false);

  async function tomarFotografia() {
    if (!camaraRef.current || !camaraLista || capturando) {
      return;
    }

    try {
      setCapturando(true);

      const fotografia = await camaraRef.current.takePictureAsync({
        quality: 0.7,
      });

      if (!fotografia?.uri) {
        return;
      }

      let uriFinal = fotografia.uri;

      // En Android e iOS guardamos la foto fuera de la caché temporal.
      if (Platform.OS !== "web") {
        const carpetaFotos = new Directory(
          Paths.document,
          "organiza-plus-fotos",
        );

        carpetaFotos.create({
          idempotent: true,
          intermediates: true,
        });

        const archivoOriginal = new File(fotografia.uri);
        const extension =
          fotografia.uri.split(".").pop()?.split("?")[0] || "jpg";

        const archivoDestino = new File(
          carpetaFotos,
          `tarea-${Date.now()}.${extension}`,
        );

        await archivoOriginal.copy(archivoDestino);
        uriFinal = archivoDestino.uri;
      }

      onPhotoCaptured(uriFinal);
      onClose();
    } catch (error) {
      console.error("Error al tomar la fotografía:", error);
    } finally {
      setCapturando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Fotografiar tarea</Text>

        {!permiso ? (
          <ActivityIndicator size="large" color="#5965D9" />
        ) : !permiso.granted ? (
          <View style={styles.mensajePermiso}>
            <Text style={styles.texto}>
              Necesitamos permiso para utilizar la cámara de tu dispositivo.
            </Text>

            <Pressable style={styles.botonPrincipal} onPress={solicitarPermiso}>
              <Text style={styles.textoBoton}>Conceder permiso</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              ref={camaraRef}
              style={styles.camara}
              facing="back"
              onCameraReady={() => setCamaraLista(true)}
            />

            <Pressable
              style={[
                styles.botonPrincipal,
                (!camaraLista || capturando) && styles.botonDeshabilitado,
              ]}
              onPress={tomarFotografia}
              disabled={!camaraLista || capturando}
            >
              {capturando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBoton}>Tomar fotografía</Text>
              )}
            </Pressable>
          </>
        )}

        <Pressable style={styles.botonCancelar} onPress={onClose}>
          <Text style={styles.textoCancelar}>Cancelar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    color: "#20263A",
    fontSize: 23,
    fontWeight: "800",
    marginBottom: 25,
  },
  camara: {
    width: "100%",
    maxWidth: 500,
    height: 420,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 22,
  },
  mensajePermiso: {
    alignItems: "center",
    gap: 18,
    padding: 20,
  },
  texto: {
    color: "#606A80",
    fontSize: 15,
    textAlign: "center",
  },
  botonPrincipal: {
    backgroundColor: "#5965D9",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 190,
    alignItems: "center",
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBoton: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  botonCancelar: {
    marginTop: 18,
    padding: 12,
  },
  textoCancelar: {
    color: "#D65C68",
    fontSize: 14,
    fontWeight: "700",
  },
});
