export type TareaExterna = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

// Comprueba que la respuesta tenga los datos esperados.
function esTareaExterna(item: unknown): item is TareaExterna {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const tarea = item as Record<string, unknown>;

  return (
    typeof tarea.userId === "number" &&
    typeof tarea.id === "number" &&
    typeof tarea.title === "string" &&
    typeof tarea.completed === "boolean"
  );
}

// Consulta las tareas de una API pública externa.
export async function obtenerTareasExternas(): Promise<TareaExterna[]> {
  const respuesta = await fetch(
    "https://jsonplaceholder.typicode.com/todos?_limit=10",
  );

  if (!respuesta.ok) {
    throw new Error(
      `La API externa respondió con el estado ${respuesta.status}.`,
    );
  }

  const datos: unknown = await respuesta.json();

  if (!Array.isArray(datos) || !datos.every(esTareaExterna)) {
    throw new Error("La respuesta de la API externa no es válida.");
  }

  return datos;
}
