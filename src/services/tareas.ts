import { apiRequest } from "./api";

// Estructura de una tarea recibida desde Laravel.
export type TareaServidor = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  image_path: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
};

// Obtener las tareas del usuario autenticado.
export async function obtenerTareasServidor(token: string) {
  const respuesta = await apiRequest("/tasks", { method: "GET" }, token);

  return respuesta.tasks as TareaServidor[];
}

// Crear una tarea en Laravel.
export async function crearTareaServidor(
  tarea: {
    titulo: string;
    descripcion: string;
    completada: boolean;
    imagenUri?: string | null;
    ubicacion?: {
      latitude: number;
      longitude: number;
    } | null;
  },
  token: string,
) {
  // Enviar fotografía mediante FormData nativo de React Native.
  if (tarea.imagenUri) {
    const formData = new FormData();

    formData.append("title", tarea.titulo);
    formData.append("description", tarea.descripcion);
    formData.append("completed", tarea.completada ? "1" : "0");

    if (tarea.ubicacion) {
      formData.append("latitude", String(tarea.ubicacion.latitude));
      formData.append("longitude", String(tarea.ubicacion.longitude));
    }

    formData.append("image", {
      uri: tarea.imagenUri,
      name: "fotografia.jpg",
      type: "image/jpeg",
    } as any);

    return apiRequest(
      "/tasks",
      {
        method: "POST",
        body: formData,
      },
      token,
    );
  }

  // Enviar normalmente cuando no hay fotografía.
  return apiRequest(
    "/tasks",
    {
      method: "POST",
      body: JSON.stringify({
        title: tarea.titulo,
        description: tarea.descripcion,
        completed: tarea.completada,
        latitude: tarea.ubicacion?.latitude ?? null,
        longitude: tarea.ubicacion?.longitude ?? null,
      }),
    },
    token,
  );
}

// Actualizar una tarea existente.
export async function actualizarTareaServidor(
  id: number,
  tarea: {
    titulo?: string;
    descripcion?: string;
    completada?: boolean;
    ubicacion?: {
      latitude: number;
      longitude: number;
    } | null;
  },
  token: string,
) {
  const datos: Record<string, unknown> = {};

  if (tarea.titulo !== undefined) datos.title = tarea.titulo;
  if (tarea.descripcion !== undefined) datos.description = tarea.descripcion;
  if (tarea.completada !== undefined) datos.completed = tarea.completada;

  if (tarea.ubicacion !== undefined) {
    datos.latitude = tarea.ubicacion?.latitude ?? null;
    datos.longitude = tarea.ubicacion?.longitude ?? null;
  }

  return apiRequest(
    `/tasks/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(datos),
    },
    token,
  );
}

// Eliminar una tarea de Laravel.
export async function eliminarTareaServidor(id: number, token: string) {
  return apiRequest(`/tasks/${id}`, { method: "DELETE" }, token);
}
