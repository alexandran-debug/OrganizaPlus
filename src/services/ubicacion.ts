import * as Location from "expo-location";

export type Ubicacion = {
  latitude: number;
  longitude: number;
};

export async function obtenerUbicacion(): Promise<Ubicacion | null> {
  try {
    const permiso = await Location.requestForegroundPermissionsAsync();

    if (!permiso.granted) {
      return null;
    }

    const posicion = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: posicion.coords.latitude,
      longitude: posicion.coords.longitude,
    };
  } catch (error) {
    console.warn("No se pudo obtener la ubicación:", error);
    return null;
  }
}
