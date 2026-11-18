export const API_URL = "http://192.168.1.82:8000/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Detectar si se están enviando archivos.
  const esFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  // Dejar que fetch configure el encabezado de archivos.
  if (options.body && !esFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al comunicarse con el servidor.");
  }

  return data;
}
