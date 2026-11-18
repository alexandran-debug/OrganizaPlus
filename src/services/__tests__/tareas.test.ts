import { apiRequest } from "../api";
import {
  actualizarTareaServidor,
  crearTareaServidor,
  eliminarTareaServidor,
  obtenerTareasServidor,
} from "../tareas";

jest.mock("../api", () => ({
  apiRequest: jest.fn(),
}));

const apiMock = apiRequest as jest.Mock;

describe("Pruebas de integración de tareas con Laravel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Obtiene las tareas del servidor", async () => {
    const tareas = [
      {
        id: 1,
        title: "Estudiar programación",
        description: "Repasar Laravel",
        completed: false,
        image_path: null,
        latitude: null,
        longitude: null,
      },
    ];

    apiMock.mockResolvedValue({ tasks: tareas });

    const resultado = await obtenerTareasServidor("token123");

    expect(resultado).toEqual(tareas);
    expect(apiMock).toHaveBeenCalledWith(
      "/tasks",
      { method: "GET" },
      "token123",
    );
  });

  test("Crea una tarea en el servidor", async () => {
    apiMock.mockResolvedValue({ message: "Tarea creada" });

    await crearTareaServidor(
      {
        titulo: "Comprar alimentos",
        descripcion: "Comprar leche",
        completada: false,
        ubicacion: {
          latitude: -33.4489,
          longitude: -70.6693,
        },
      },
      "token123",
    );

    expect(apiMock).toHaveBeenCalledWith(
      "/tasks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          title: "Comprar alimentos",
          description: "Comprar leche",
          completed: false,
          latitude: -33.4489,
          longitude: -70.6693,
        }),
      }),
      "token123",
    );
  });

  test("Actualiza una tarea existente", async () => {
    apiMock.mockResolvedValue({ message: "Tarea actualizada" });

    await actualizarTareaServidor(
      5,
      {
        titulo: "Tarea modificada",
        completada: true,
      },
      "token123",
    );

    expect(apiMock).toHaveBeenCalledWith(
      "/tasks/5",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          title: "Tarea modificada",
          completed: true,
        }),
      }),
      "token123",
    );
  });

  test("Elimina una tarea del servidor", async () => {
    apiMock.mockResolvedValue({ message: "Tarea eliminada" });

    await eliminarTareaServidor(5, "token123");

    expect(apiMock).toHaveBeenCalledWith(
      "/tasks/5",
      { method: "DELETE" },
      "token123",
    );
  });
});
