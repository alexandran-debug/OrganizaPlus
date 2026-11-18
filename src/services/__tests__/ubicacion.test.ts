import * as Location from "expo-location";
import { obtenerUbicacion } from "../ubicacion";

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
  },
}));

describe("Pruebas de ubicación GPS", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Obtiene las coordenadas cuando el permiso es concedido", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      {
        granted: true,
      },
    );

    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: -33.4489,
        longitude: -70.6693,
      },
    });

    await expect(obtenerUbicacion()).resolves.toEqual({
      latitude: -33.4489,
      longitude: -70.6693,
    });
  });

  test("No obtiene coordenadas cuando el permiso es denegado", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      {
        granted: false,
      },
    );

    await expect(obtenerUbicacion()).resolves.toBeNull();

    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  test("Devuelve null cuando ocurre un error al solicitar el GPS", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
      new Error("Error de ubicación"),
    );

    await expect(obtenerUbicacion()).resolves.toBeNull();
  });
});
