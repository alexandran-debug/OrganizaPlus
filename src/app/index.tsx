import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import CamaraTarea from "@/components/camara-tarea";
import {
  actualizarTareaServidor,
  crearTareaServidor,
  eliminarTareaServidor,
  obtenerTareasServidor,
} from "@/services/tareas";
import { obtenerTareasExternas } from "@/services/tareas-externas";
import { obtenerUbicacion } from "@/services/ubicacion";

type Ubicacion = {
  latitude: number;
  longitude: number;
};

type Tarea = {
  id: string;
  serverId?: number | null;
  externalId?: number;
  titulo: string;
  descripcion: string;
  completada: boolean;
  imagenUri?: string | null;
  ubicacion?: Ubicacion | null;
};

const CLAVE_ALMACENAMIENTO = "@taskflow/tareas";

export default function HomeScreen() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tareaEditando, setTareaEditando] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "pendientes" | "completadas">(
    "todas",
  );
  const [cargando, setCargando] = useState(true);
  const [importando, setImportando] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [claveUsuario, setClaveUsuario] = useState<string | null>(null);

  // Evita que se ejecuten dos sincronizaciones al mismo tiempo.
  const sincronizandoRef = useRef(false);

  // Registra si ocurrió una reconexión mientras otra sincronización estaba activa.
  const reintentoPendienteRef = useRef(false);

  // Permite ejecutar la sincronización desde el listener de conexión.
  const sincronizarPendientesRef = useRef<
    ((tokenActual: string, claveActual: string) => Promise<void>) | null
  >(null);

  // Sincronizar tareas pendientes cuando vuelve internet.
  sincronizarPendientesRef.current = async (
    tokenActual: string,
    claveActual: string,
  ) => {
    if (sincronizandoRef.current) {
      console.log(
        "Ya hay una sincronización en curso. Se dejará pendiente el reintento.",
      );
      reintentoPendienteRef.current = true;
      return;
    }

    sincronizandoRef.current = true;

    try {
      console.log("Reconexión detectada. Iniciando sincronización...");

      // Leer los datos más recientes directamente del almacenamiento.
      const datosGuardados = await AsyncStorage.getItem(claveActual);

      const tareasLocales: Tarea[] = datosGuardados
        ? JSON.parse(datosGuardados)
        : [];

      const claveEliminadas = claveActual.replace(
        CLAVE_ALMACENAMIENTO,
        "@taskflow/eliminadas",
      );

      // Reintentar eliminaciones que quedaron pendientes.
      const datosEliminadas = await AsyncStorage.getItem(claveEliminadas);

      const eliminadas: number[] = datosEliminadas
        ? JSON.parse(datosEliminadas)
        : [];

      const eliminacionesPendientes: number[] = [];

      for (const id of eliminadas) {
        try {
          await eliminarTareaServidor(id, tokenActual);
          console.log("Eliminación pendiente sincronizada:", id);
        } catch (error) {
          eliminacionesPendientes.push(id);
          console.warn("No se pudo reintentar la eliminación:", error);
        }
      }

      await AsyncStorage.setItem(
        claveEliminadas,
        JSON.stringify(eliminacionesPendientes),
      );

      const tareasSincronizadas: Tarea[] = [];

      // Enviar las tareas nuevas y actualizar las que ya existen en Laravel.
      for (const tarea of tareasLocales) {
        if (tarea.serverId != null) {
          try {
            await actualizarTareaServidor(
              tarea.serverId,
              {
                titulo: tarea.titulo,
                descripcion: tarea.descripcion,
                completada: tarea.completada,
                ubicacion: tarea.ubicacion ?? null,
              },
              tokenActual,
            );

            console.log("Tarea actualizada en Laravel:", tarea.serverId);

            tareasSincronizadas.push(tarea);
          } catch (error) {
            console.warn(
              "No se pudo actualizar la tarea. Se conserva localmente:",
              tarea.titulo,
              error,
            );

            tareasSincronizadas.push(tarea);
          }
        } else {
          try {
            console.log("Enviando tarea pendiente:", tarea.titulo);

            const respuesta = await crearTareaServidor(
              {
                titulo: tarea.titulo,
                descripcion: tarea.descripcion,
                completada: tarea.completada,
                ubicacion: tarea.ubicacion ?? null,
                imagenUri: tarea.imagenUri ?? null,
              },
              tokenActual,
            );

            console.log(
              "Tarea pendiente sincronizada en Laravel:",
              respuesta.task.id,
            );

            tareasSincronizadas.push({
              ...tarea,
              serverId: respuesta.task.id,
            });
          } catch (error) {
            console.warn(
              "La tarea todavía no se pudo sincronizar:",
              tarea.titulo,
              error,
            );

            tareasSincronizadas.push(tarea);
          }
        }
      }

      // Guardar inmediatamente el resultado en el teléfono.
      await AsyncStorage.setItem(
        claveActual,
        JSON.stringify(tareasSincronizadas),
      );

      setTareas(tareasSincronizadas);

      console.log("Proceso de sincronización finalizado.");
    } catch (error) {
      console.error("Error durante la sincronización al reconectar:", error);
    } finally {
      sincronizandoRef.current = false;

      // Si llegó otra reconexión durante el proceso, volver a intentarlo.
      if (reintentoPendienteRef.current) {
        reintentoPendienteRef.current = false;

        console.log("Hay otro reintento pendiente. Se iniciará nuevamente.");

        void sincronizarPendientesRef.current?.(tokenActual, claveActual);
      }
    }
  };

  // Cargar sesión, tareas locales y tareas del servidor.
  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        const tokenGuardado = await SecureStore.getItemAsync("organiza_token");
        const usuarioGuardado =
          await SecureStore.getItemAsync("organiza_usuario");

        if (!tokenGuardado || !usuarioGuardado) {
          throw new Error("No se encontró una sesión activa.");
        }

        const usuario = JSON.parse(usuarioGuardado);
        const usuarioId = Number(usuario.id);

        if (!Number.isFinite(usuarioId)) {
          throw new Error("No se pudo identificar al usuario.");
        }

        const claveTareas = `${CLAVE_ALMACENAMIENTO}:${usuarioId}`;
        const claveEliminadas = `@taskflow/eliminadas:${usuarioId}`;

        setToken(tokenGuardado);
        setClaveUsuario(claveTareas);

        let datosGuardados = await AsyncStorage.getItem(claveTareas);

        // Recuperar tareas de la versión anterior de la aplicación.
        if (datosGuardados === null) {
          const tareasAntiguas =
            await AsyncStorage.getItem(CLAVE_ALMACENAMIENTO);

          if (tareasAntiguas !== null) {
            await AsyncStorage.setItem(claveTareas, tareasAntiguas);
            await AsyncStorage.removeItem(CLAVE_ALMACENAMIENTO);
            datosGuardados = tareasAntiguas;
          }
        }

        const tareasLocales: Tarea[] = datosGuardados
          ? JSON.parse(datosGuardados)
          : [];

        if (!activo) return;

        setTareas(tareasLocales);
        setCargando(false);

        // Evitar que la reconexión inicie otra sincronización en paralelo.
        sincronizandoRef.current = true;

        try {
          console.log("Consultando tareas en Laravel...");

          const tareasRemotas = await obtenerTareasServidor(tokenGuardado);

          console.log("Tareas recibidas desde Laravel:", tareasRemotas.length);

          // Reintentar eliminaciones pendientes.
          const eliminadasGuardadas =
            await AsyncStorage.getItem(claveEliminadas);

          const eliminadas: number[] = eliminadasGuardadas
            ? JSON.parse(eliminadasGuardadas)
            : [];

          const eliminacionesPendientes: number[] = [];

          for (const id of eliminadas) {
            try {
              await eliminarTareaServidor(id, tokenGuardado);
            } catch (error) {
              eliminacionesPendientes.push(id);
              console.warn("No se pudo sincronizar una eliminación:", error);
            }
          }

          await AsyncStorage.setItem(
            claveEliminadas,
            JSON.stringify(eliminacionesPendientes),
          );

          const idsLocales = new Set(
            tareasLocales
              .filter((tarea) => tarea.serverId != null)
              .map((tarea) => tarea.serverId),
          );

          const tareasActualizadas: Tarea[] = [];

          // Enviar tareas locales pendientes o actualizar las existentes.
          for (const tarea of tareasLocales) {
            if (tarea.serverId != null) {
              try {
                await actualizarTareaServidor(
                  tarea.serverId,
                  {
                    titulo: tarea.titulo,
                    descripcion: tarea.descripcion,
                    completada: tarea.completada,
                    ubicacion: tarea.ubicacion ?? null,
                  },
                  tokenGuardado,
                );
              } catch (error) {
                console.warn("No se pudo actualizar la tarea:", error);
              }

              tareasActualizadas.push(tarea);
            } else {
              try {
                const respuesta = await crearTareaServidor(
                  {
                    titulo: tarea.titulo,
                    descripcion: tarea.descripcion,
                    completada: tarea.completada,
                    ubicacion: tarea.ubicacion ?? null,
                    imagenUri: tarea.imagenUri ?? null,
                  },
                  tokenGuardado,
                );

                tareasActualizadas.push({
                  ...tarea,
                  serverId: respuesta.task.id,
                });
              } catch (error) {
                tareasActualizadas.push(tarea);
                console.warn("Tarea pendiente de sincronización:", error);
              }
            }
          }

          // Importar tareas que están en Laravel y no en el teléfono.
          const tareasImportadas: Tarea[] = tareasRemotas
            .filter(
              (tarea) =>
                !idsLocales.has(tarea.id) &&
                !eliminacionesPendientes.includes(tarea.id) &&
                !eliminadas.includes(tarea.id),
            )
            .map((tarea) => ({
              id: `servidor-${tarea.id}`,
              serverId: tarea.id,
              titulo: tarea.title,
              descripcion: tarea.description ?? "",
              completada: tarea.completed,
              imagenUri: null,
              ubicacion:
                tarea.latitude !== null && tarea.longitude !== null
                  ? {
                      latitude: Number(tarea.latitude),
                      longitude: Number(tarea.longitude),
                    }
                  : null,
            }));

          const resultado = [...tareasActualizadas, ...tareasImportadas];

          if (activo) {
            // Guardar también la sincronización inicial en el almacenamiento.
            await AsyncStorage.setItem(claveTareas, JSON.stringify(resultado));

            setTareas(resultado);
          }
        } catch (error) {
          console.error("Error al consultar o sincronizar con Laravel:", error);
        } finally {
          sincronizandoRef.current = false;

          // Atender una reconexión que haya ocurrido durante la carga inicial.
          if (reintentoPendienteRef.current && activo) {
            reintentoPendienteRef.current = false;

            console.log(
              "Se detectó una reconexión durante la carga inicial. Reintentando...",
            );

            void sincronizarPendientesRef.current?.(tokenGuardado, claveTareas);
          }
        }
      } catch (error) {
        console.error("Error al cargar los datos:", error);

        if (activo) {
          Alert.alert(
            "Error",
            error instanceof Error ? error.message : String(error),
          );

          setCargando(false);
        }
      }
    }

    cargarDatos();

    return () => {
      activo = false;
    };
  }, []);

  // Detectar cuando el dispositivo recupera la conexión a internet.
  useEffect(() => {
    let conexionAnterior: boolean | null = null;

    console.log("Iniciando detector de conexión a internet...");

    const cancelarSuscripcion = NetInfo.addEventListener((estado) => {
      const conectado = estado.isConnected === true;

      console.log("Estado de conexión detectado:", {
        conectado: estado.isConnected,
        internetAlcanzable: estado.isInternetReachable,
      });

      // El primer evento establece el estado inicial.
      if (conexionAnterior === null) {
        conexionAnterior = conectado;
        console.log("Estado inicial de conexión:", conectado);
        return;
      }

      // Detectar cuando se recupera la conexión.
      if (conexionAnterior === false && conectado === true) {
        console.log("Se recuperó la conexión a internet.");

        if (!token || !claveUsuario) {
          console.log(
            "No hay una sesión disponible para sincronizar las tareas.",
          );
        } else if (sincronizandoRef.current) {
          console.log(
            "La sincronización inicial sigue activa. Se programará un reintento.",
          );

          reintentoPendienteRef.current = true;
        } else {
          console.log("Iniciando sincronización de tareas pendientes...");

          void sincronizarPendientesRef.current?.(token, claveUsuario);
        }
      }

      conexionAnterior = conectado;
    });

    return () => {
      cancelarSuscripcion();
      console.log("Detector de conexión detenido.");
    };
  }, [token, claveUsuario]);

  // Guardar automáticamente en el teléfono.
  useEffect(() => {
    if (cargando || !claveUsuario) return;

    AsyncStorage.setItem(claveUsuario, JSON.stringify(tareas)).catch(
      (error) => {
        console.error("Error al guardar las tareas localmente:", error);

        Alert.alert(
          "Error",
          "No se pudieron guardar las tareas en el dispositivo.",
        );
      },
    );
  }, [tareas, cargando, claveUsuario]);

  const pendientes = tareas.filter((tarea) => !tarea.completada).length;
  const completadas = tareas.filter((tarea) => tarea.completada).length;

  const tareasFiltradas = tareas.filter((tarea) => {
    if (filtro === "pendientes") return !tarea.completada;
    if (filtro === "completadas") return tarea.completada;
    return true;
  });

  function limpiarFormulario() {
    setTitulo("");
    setDescripcion("");
    setImagenUri(null);
    setTareaEditando(null);
    setMostrarFormulario(false);
  }

  // Importar tareas desde una API pública externa.
  async function importarTareasExternas() {
    if (importando) return;

    setImportando(true);

    try {
      console.log("Consultando API externa...");

      const tareasExternas = await obtenerTareasExternas();

      // Identificar las tareas que ya fueron importadas.
      const idsExternosExistentes = new Set(
        tareas
          .map((tarea) => tarea.externalId)
          .filter((id): id is number => id !== undefined),
      );

      const tareasNuevas = tareasExternas.filter(
        (tarea) => !idsExternosExistentes.has(tarea.id),
      );

      if (tareasNuevas.length === 0) {
        Alert.alert(
          "Sin tareas nuevas",
          "Todas las tareas de esta API ya fueron importadas.",
        );
        return;
      }

      const tareasPreparadas: Tarea[] = [];
      let sincronizadas = 0;

      // Preparar e intentar guardar cada tarea en Laravel.
      for (const externa of tareasNuevas) {
        const nuevaTarea: Tarea = {
          id: `externa-${externa.id}`,
          externalId: externa.id,
          serverId: null,
          titulo: externa.title,
          descripcion: "Tarea importada desde JSONPlaceholder.",
          completada: externa.completed,
          imagenUri: null,
          ubicacion: null,
        };

        if (token) {
          try {
            const respuesta = await crearTareaServidor(
              {
                titulo: nuevaTarea.titulo,
                descripcion: nuevaTarea.descripcion,
                completada: nuevaTarea.completada,
                ubicacion: null,
                imagenUri: null,
              },
              token,
            );

            nuevaTarea.serverId = respuesta.task.id;
            sincronizadas++;

            console.log(
              "Tarea externa sincronizada con Laravel:",
              respuesta.task.id,
            );
          } catch (error) {
            console.warn(
              "La tarea externa quedó pendiente de sincronización:",
              nuevaTarea.titulo,
              error,
            );
          }
        }

        tareasPreparadas.push(nuevaTarea);
      }

      // Incorporar las tareas sin reemplazar las existentes.
      const resultado = [...tareasPreparadas, ...tareas];

      setTareas(resultado);

      // Guardar inmediatamente las tareas importadas en el teléfono.
      if (claveUsuario) {
        await AsyncStorage.setItem(claveUsuario, JSON.stringify(resultado));
      }

      const pendientesSincronizacion = tareasPreparadas.length - sincronizadas;

      Alert.alert(
        "Importación completada",
        `Tareas importadas: ${tareasPreparadas.length}\n` +
          `Sincronizadas con Laravel: ${sincronizadas}\n` +
          `Pendientes de sincronización: ${pendientesSincronizacion}`,
      );
    } catch (error) {
      console.error("Error al importar tareas externas:", error);

      Alert.alert(
        "Error de importación",
        error instanceof Error
          ? error.message
          : "No fue posible consultar la API externa.",
      );
    } finally {
      setImportando(false);
    }
  }

  // Cerrar sesión sin eliminar las tareas guardadas.
  function cerrarSesion() {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás segura de que deseas cerrar tu sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync("organiza_token");
              await SecureStore.deleteItemAsync("organiza_usuario");

              setToken(null);
              setClaveUsuario(null);

              router.replace("/auth/login");
            } catch (error) {
              console.error("Error al cerrar sesión:", error);

              Alert.alert(
                "Error",
                "No se pudo cerrar la sesión. Inténtalo nuevamente.",
              );
            }
          },
        },
      ],
    );
  }

  // Crear una tarea o guardar cambios.
  async function guardarTarea() {
    if (!titulo.trim()) {
      Alert.alert("Falta el título", "Escribe un título para la tarea.");
      return;
    }

    // Editar una tarea existente.
    if (tareaEditando) {
      const tareaOriginal = tareas.find((tarea) => tarea.id === tareaEditando);

      const datosActualizados = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        imagenUri,
      };

      setTareas((anteriores) =>
        anteriores.map((tarea) =>
          tarea.id === tareaEditando
            ? { ...tarea, ...datosActualizados }
            : tarea,
        ),
      );

      if (tareaOriginal?.serverId != null && token) {
        try {
          await actualizarTareaServidor(
            tareaOriginal.serverId,
            {
              titulo: datosActualizados.titulo,
              descripcion: datosActualizados.descripcion,
            },
            token,
          );

          console.log("Tarea actualizada en Laravel.");
        } catch (error) {
          console.error("Error al actualizar en Laravel:", error);

          Alert.alert(
            "Sincronización pendiente",
            "Los cambios quedaron guardados en el teléfono, pero no se pudieron enviar al servidor. Se intentará sincronizarlos cuando vuelva internet.",
          );
        }
      }

      limpiarFormulario();
      return;
    }

    // Obtener ubicación GPS. Si falla, se puede guardar sin ella.
    const ubicacion = await obtenerUbicacion();

    // Identificador único para evitar claves duplicadas.
    const nuevaTarea: Tarea = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      serverId: null,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      completada: false,
      imagenUri,
      ubicacion,
    };

    // Guardar primero en el dispositivo.
    setTareas((anteriores) => [nuevaTarea, ...anteriores]);

    // Enviar a Laravel.
    if (!token) {
      console.error("No hay token de autenticación disponible.");

      Alert.alert(
        "Sesión no disponible",
        "La tarea quedó guardada en el teléfono. Inicia sesión nuevamente para sincronizarla.",
      );
    } else {
      try {
        console.log("Enviando tarea a Laravel...");

        const respuesta = await crearTareaServidor(
          {
            titulo: nuevaTarea.titulo,
            descripcion: nuevaTarea.descripcion,
            completada: nuevaTarea.completada,
            ubicacion: nuevaTarea.ubicacion,
            imagenUri: nuevaTarea.imagenUri ?? null,
          },
          token,
        );

        console.log("Tarea creada en Laravel:", respuesta.task.id);

        setTareas((anteriores) =>
          anteriores.map((tarea) =>
            tarea.id === nuevaTarea.id
              ? { ...tarea, serverId: respuesta.task.id }
              : tarea,
          ),
        );

        Alert.alert(
          "Tarea sincronizada",
          "La tarea se guardó en el dispositivo y en Laravel.",
        );
      } catch (error) {
        console.error("ERROR AL SINCRONIZAR CON LARAVEL:", error);

        Alert.alert(
          "Tarea guardada localmente",
          "No se pudo enviar a Laravel. Se intentará sincronizar automáticamente cuando vuelva internet.",
        );
      }
    }

    if (!ubicacion) {
      Alert.alert(
        "Ubicación no registrada",
        "La tarea se guardó, pero no fue posible obtener la ubicación GPS.",
      );
    }

    limpiarFormulario();
  }

  function editarTarea(tarea: Tarea) {
    setTitulo(tarea.titulo);
    setDescripcion(tarea.descripcion);
    setImagenUri(tarea.imagenUri ?? null);
    setTareaEditando(tarea.id);
    setMostrarFormulario(true);
  }

  function eliminarTarea(id: string) {
    Alert.alert(
      "Eliminar tarea",
      "¿Estás segura de que deseas eliminar esta tarea?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const tarea = tareas.find((item) => item.id === id);

            setTareas((anteriores) =>
              anteriores.filter((item) => item.id !== id),
            );

            if (tarea?.serverId != null && token && claveUsuario) {
              try {
                await eliminarTareaServidor(tarea.serverId, token);

                console.log("Tarea eliminada de Laravel.");
              } catch (error) {
                console.error("Error al eliminar en Laravel:", error);

                try {
                  const claveEliminadas = claveUsuario.replace(
                    CLAVE_ALMACENAMIENTO,
                    "@taskflow/eliminadas",
                  );

                  const datos = await AsyncStorage.getItem(claveEliminadas);

                  const eliminadas: number[] = datos ? JSON.parse(datos) : [];

                  if (!eliminadas.includes(tarea.serverId)) {
                    eliminadas.push(tarea.serverId);
                  }

                  await AsyncStorage.setItem(
                    claveEliminadas,
                    JSON.stringify(eliminadas),
                  );
                } catch (errorAlmacenamiento) {
                  console.error(
                    "Error al registrar eliminación pendiente:",
                    errorAlmacenamiento,
                  );
                }

                Alert.alert(
                  "Eliminación pendiente",
                  "La tarea se quitó del teléfono. Se intentará eliminar del servidor cuando haya conexión.",
                );
              }
            }
          },
        },
      ],
    );
  }

  // Cambiar el estado y guardarlo localmente antes de sincronizar.
  async function cambiarEstado(id: string) {
    const tarea = tareas.find((item) => item.id === id);

    if (!tarea) return;

    const nuevoEstado = !tarea.completada;

    // Preparar la lista con el nuevo estado.
    const tareasActualizadas = tareas.map((item) =>
      item.id === id ? { ...item, completada: nuevoEstado } : item,
    );

    // Actualizar inmediatamente la pantalla.
    setTareas(tareasActualizadas);

    // Guardar el cambio en el teléfono antes de intentar sincronizar.
    try {
      if (claveUsuario) {
        await AsyncStorage.setItem(
          claveUsuario,
          JSON.stringify(tareasActualizadas),
        );
      }
    } catch (error) {
      console.error("Error al guardar el nuevo estado localmente:", error);

      Alert.alert("Error", "No se pudo guardar el cambio en el dispositivo.");

      return;
    }

    // Enviar el cambio a Laravel si la tarea ya existe en el servidor.
    if (tarea.serverId != null && token) {
      try {
        await actualizarTareaServidor(
          tarea.serverId,
          { completada: nuevoEstado },
          token,
        );

        console.log("Estado actualizado en Laravel:", nuevoEstado);
      } catch (error) {
        console.error("Error al actualizar el estado:", error);

        Alert.alert(
          "Sincronización pendiente",
          "El cambio quedó guardado en el teléfono. Se intentará enviar a Laravel cuando vuelva internet.",
        );
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.encabezado}>
          <View>
            <Text style={styles.marca}>ORGANIZA+</Text>
            <Text style={styles.tituloPrincipal}>Organiza tu día.</Text>
            <Text style={styles.subtitulo}>
              Pequeños pasos, grandes logros.
            </Text>

            <Pressable style={styles.botonCerrarSesion} onPress={cerrarSesion}>
              <Text style={styles.textoCerrarSesion}>Cerrar sesión</Text>
            </Pressable>
          </View>

          <View style={styles.iconoEncabezado}>
            <Text style={styles.iconoTexto}>✓</Text>
          </View>
        </View>

        <View style={styles.resumen}>
          <View style={styles.tarjetaResumen}>
            <Text style={styles.numeroResumen}>{tareas.length}</Text>
            <Text style={styles.textoResumen}>Total</Text>
          </View>

          <View style={styles.tarjetaResumen}>
            <Text style={styles.numeroResumen}>{pendientes}</Text>
            <Text style={styles.textoResumen}>Pendientes</Text>
          </View>

          <View style={styles.tarjetaResumen}>
            <Text style={styles.numeroResumen}>{completadas}</Text>
            <Text style={styles.textoResumen}>Completadas</Text>
          </View>
        </View>

        <View style={styles.tituloSeccion}>
          <View style={styles.encabezadoLista}>
            <Text style={styles.tituloLista}>Mis tareas</Text>
            <Text style={styles.descripcionSeccion}>
              Mantén tus actividades bajo control.
            </Text>
          </View>

          <Pressable
            style={styles.botonAgregar}
            onPress={() => {
              limpiarFormulario();
              setMostrarFormulario(true);
            }}
          >
            <Text style={styles.textoBotonAgregar}>+ Nueva</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.botonImportar}
          onPress={importarTareasExternas}
          disabled={importando}
        >
          <Text style={styles.textoBotonImportar}>
            {importando ? "Importando tareas..." : "↓ Importar tareas externas"}
          </Text>
        </Pressable>

        {mostrarFormulario && (
          <View style={styles.formulario}>
            <Text style={styles.tituloFormulario}>
              {tareaEditando ? "Editar tarea" : "Crear una tarea"}
            </Text>

            <Text style={styles.etiqueta}>Título *</Text>

            <TextInput
              style={styles.campo}
              placeholder="Ej. Estudiar programación"
              placeholderTextColor="#9299A8"
              value={titulo}
              onChangeText={setTitulo}
              maxLength={80}
              accessibilityLabel="Título de la tarea"
            />

            <Text style={styles.etiqueta}>Descripción</Text>

            <TextInput
              style={[styles.campo, styles.campoDescripcion]}
              placeholder="Agrega algunos detalles..."
              placeholderTextColor="#9299A8"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              maxLength={300}
              accessibilityLabel="Descripción de la tarea"
            />

            <Pressable
              style={styles.botonFotografia}
              onPress={() => setMostrarCamara(true)}
            >
              <Text style={styles.textoBotonFotografia}>
                {imagenUri ? "Cambiar fotografía" : "+ Tomar fotografía"}
              </Text>
            </Pressable>

            {imagenUri && (
              <View style={styles.contenedorImagen}>
                <Image
                  source={{ uri: imagenUri }}
                  style={styles.imagenTarea}
                  resizeMode="cover"
                />

                <Pressable onPress={() => setImagenUri(null)}>
                  <Text style={styles.textoEliminarImagen}>
                    Quitar fotografía
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={styles.botonesFormulario}>
              <Pressable
                style={styles.botonCancelar}
                onPress={limpiarFormulario}
              >
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </Pressable>

              <Pressable style={styles.botonGuardar} onPress={guardarTarea}>
                <Text style={styles.textoGuardar}>
                  {tareaEditando ? "Guardar cambios" : "Crear tarea"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtros}
          contentContainerStyle={styles.contenidoFiltros}
        >
          {[
            { valor: "todas", texto: "Todas" },
            { valor: "pendientes", texto: "Pendientes" },
            { valor: "completadas", texto: "Completadas" },
          ].map((opcion) => (
            <Pressable
              key={opcion.valor}
              style={[
                styles.botonFiltro,
                filtro === opcion.valor && styles.botonFiltroActivo,
              ]}
              onPress={() =>
                setFiltro(
                  opcion.valor as "todas" | "pendientes" | "completadas",
                )
              }
            >
              <Text
                style={[
                  styles.textoFiltro,
                  filtro === opcion.valor && styles.textoFiltroActivo,
                ]}
              >
                {opcion.texto}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {cargando ? (
          <View style={styles.estadoVacio}>
            <Text style={styles.tituloVacio}>Cargando tus tareas...</Text>
          </View>
        ) : tareasFiltradas.length === 0 ? (
          <View style={styles.estadoVacio}>
            <View style={styles.iconoVacio}>
              <Text style={styles.iconoVacioTexto}>✓</Text>
            </View>

            <Text style={styles.tituloVacio}>
              {filtro === "completadas"
                ? "Aún no hay tareas completadas"
                : filtro === "pendientes"
                  ? "¡No tienes tareas pendientes!"
                  : "Comienza con tu primera tarea"}
            </Text>

            <Text style={styles.textoVacio}>
              {filtro === "todas"
                ? "Agrega una tarea y empieza a organizar tu día."
                : "Cuando tengas tareas en esta categoría, aparecerán aquí."}
            </Text>

            {filtro === "todas" && (
              <Pressable
                style={styles.botonVacio}
                onPress={() => setMostrarFormulario(true)}
              >
                <Text style={styles.textoBotonVacio}>
                  + Crear mi primera tarea
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.listaTareas}>
            {tareasFiltradas.map((tarea) => (
              <View key={tarea.id} style={styles.tarjetaTarea}>
                <Pressable
                  style={[
                    styles.checkbox,
                    tarea.completada && styles.checkboxActivo,
                  ]}
                  onPress={() => cambiarEstado(tarea.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: tarea.completada }}
                  accessibilityLabel={`Marcar ${tarea.titulo} como ${
                    tarea.completada ? "pendiente" : "completada"
                  }`}
                >
                  {tarea.completada && (
                    <Text style={styles.marcaCheckbox}>✓</Text>
                  )}
                </Pressable>

                <View style={styles.informacionTarea}>
                  <Text
                    style={[
                      styles.tituloTarea,
                      tarea.completada && styles.tareaTerminada,
                    ]}
                  >
                    {tarea.titulo}
                  </Text>

                  {tarea.descripcion ? (
                    <Text style={styles.descripcionTarea}>
                      {tarea.descripcion}
                    </Text>
                  ) : null}

                  {tarea.ubicacion && (
                    <View style={styles.contenedorUbicacion}>
                      <Text style={styles.textoUbicacion}>
                        📍 Ubicación registrada
                      </Text>

                      <Text style={styles.coordenadasUbicacion}>
                        Latitud: {tarea.ubicacion.latitude.toFixed(6)}
                      </Text>

                      <Text style={styles.coordenadasUbicacion}>
                        Longitud: {tarea.ubicacion.longitude.toFixed(6)}
                      </Text>
                    </View>
                  )}

                  {tarea.imagenUri && (
                    <Image
                      source={{ uri: tarea.imagenUri }}
                      style={styles.imagenTarjeta}
                      resizeMode="cover"
                    />
                  )}

                  <Text
                    style={[
                      styles.estadoTarea,
                      tarea.completada
                        ? styles.estadoCompletada
                        : styles.estadoPendiente,
                    ]}
                  >
                    {tarea.completada ? "COMPLETADA" : "PENDIENTE"}
                  </Text>
                </View>

                <View style={styles.accionesTarea}>
                  <Pressable
                    style={styles.botonAccion}
                    onPress={() => editarTarea(tarea)}
                    accessibilityLabel={`Editar ${tarea.titulo}`}
                  >
                    <Text style={styles.textoEditar}>Editar</Text>
                  </Pressable>

                  <Pressable
                    style={styles.botonAccion}
                    onPress={() => eliminarTarea(tarea.id)}
                    accessibilityLabel={`Eliminar ${tarea.titulo}`}
                  >
                    <Text style={styles.textoEliminar}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.pie}>
          <Text style={styles.textoPie}>ORGANIZA+ · Un paso a la vez.</Text>
        </View>
      </ScrollView>

      <CamaraTarea
        visible={mostrarCamara}
        onClose={() => setMostrarCamara(false)}
        onPhotoCaptured={(uri) => setImagenUri(uri)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#F5F7FB" },
  contenido: {
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 35,
    paddingBottom: 45,
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  marca: {
    color: "#5965D9",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 10,
  },
  tituloPrincipal: { color: "#20263A", fontSize: 30, fontWeight: "800" },
  subtitulo: { color: "#747D91", fontSize: 14, marginTop: 7 },
  botonCerrarSesion: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: "#EEF0FF",
  },
  textoCerrarSesion: {
    color: "#5965D9",
    fontSize: 12,
    fontWeight: "700",
  },
  iconoEncabezado: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#5965D9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconoTexto: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  resumen: { flexDirection: "row", gap: 12, marginBottom: 32 },
  tarjetaResumen: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9ECF4",
  },
  numeroResumen: {
    color: "#292F45",
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
  },
  textoResumen: {
    color: "#81899B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  tituloSeccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  encabezadoLista: { flex: 1 },
  tituloLista: { color: "#242A3D", fontSize: 22, fontWeight: "800" },
  descripcionSeccion: { color: "#858DA0", fontSize: 12, marginTop: 5 },
  botonAgregar: {
    backgroundColor: "#5965D9",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  textoBotonAgregar: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  botonImportar: {
    backgroundColor: "#EEF0FF",
    borderWidth: 1,
    borderColor: "#D5D9FF",
    borderRadius: 11,
    paddingVertical: 13,
    paddingHorizontal: 15,
    alignItems: "center",
    marginBottom: 18,
  },
  textoBotonImportar: {
    color: "#5965D9",
    fontSize: 13,
    fontWeight: "700",
  },
  formulario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E6E9F2",
    padding: 19,
    marginBottom: 22,
  },
  tituloFormulario: {
    color: "#252B40",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 18,
  },
  etiqueta: {
    color: "#41495E",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  campo: {
    borderWidth: 1,
    borderColor: "#E1E5EF",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: "#292F43",
    marginBottom: 17,
    backgroundColor: "#FCFCFE",
  },
  campoDescripcion: { minHeight: 90, textAlignVertical: "top" },
  botonFotografia: {
    backgroundColor: "#EEF0FF",
    borderRadius: 11,
    paddingVertical: 13,
    paddingHorizontal: 15,
    alignItems: "center",
    marginBottom: 16,
  },
  textoBotonFotografia: { color: "#5965D9", fontSize: 13, fontWeight: "700" },
  contenedorImagen: { alignItems: "center", marginBottom: 18, gap: 9 },
  imagenTarea: { width: 180, height: 150, borderRadius: 12 },
  textoEliminarImagen: { color: "#D65C68", fontSize: 12, fontWeight: "700" },
  imagenTarjeta: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginTop: 10,
    maxWidth: 250,
  },
  contenedorUbicacion: {
    backgroundColor: "#EEF0FF",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  textoUbicacion: {
    color: "#5965D9",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 5,
  },
  coordenadasUbicacion: { color: "#606A80", fontSize: 11, marginTop: 2 },
  botonesFormulario: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },
  botonCancelar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F0F2F8",
  },
  textoCancelar: { color: "#606A80", fontSize: 13, fontWeight: "700" },
  botonGuardar: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#5965D9",
  },
  textoGuardar: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  filtros: { marginBottom: 18, flexGrow: 0 },
  contenidoFiltros: { gap: 9 },
  botonFiltro: {
    paddingVertical: 10,
    paddingHorizontal: 17,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E9F2",
  },
  botonFiltroActivo: { backgroundColor: "#E8EAFE", borderColor: "#D5D9FF" },
  textoFiltro: { color: "#737C90", fontSize: 13, fontWeight: "600" },
  textoFiltroActivo: { color: "#505BD0", fontWeight: "800" },
  estadoVacio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 25,
    paddingVertical: 35,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECF4",
  },
  iconoVacio: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },
  iconoVacioTexto: { color: "#5965D9", fontSize: 29, fontWeight: "800" },
  tituloVacio: {
    color: "#343B50",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  textoVacio: {
    color: "#858DA0",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 9,
    maxWidth: 310,
  },
  botonVacio: {
    backgroundColor: "#5965D9",
    borderRadius: 11,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 20,
  },
  textoBotonVacio: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  listaTareas: { gap: 13 },
  tarjetaTarea: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECF4",
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#C9CEDD",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActivo: { backgroundColor: "#5965D9", borderColor: "#5965D9" },
  marcaCheckbox: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  informacionTarea: { flex: 1, minWidth: 0 },
  tituloTarea: {
    color: "#30364B",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  tareaTerminada: { color: "#969DAE", textDecorationLine: "line-through" },
  descripcionTarea: {
    color: "#81899B",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  estadoTarea: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 11,
  },
  estadoPendiente: { color: "#C18431" },
  estadoCompletada: { color: "#319A78" },
  accionesTarea: { alignItems: "flex-end", gap: 12 },
  botonAccion: { paddingVertical: 3, paddingHorizontal: 2 },
  textoEditar: { color: "#5965D9", fontSize: 12, fontWeight: "700" },
  textoEliminar: { color: "#D65C68", fontSize: 12, fontWeight: "700" },
  pie: {
    alignItems: "center",
    marginTop: 35,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E9F1",
  },
  textoPie: { color: "#969DAE", fontSize: 11, letterSpacing: 1 },
});
