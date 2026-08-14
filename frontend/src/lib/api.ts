import type { Escenario, OpcionesEscenario } from "./tipos";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

export function factorial(n: number): number {
  let resultado = 1;
  for (let i = 2; i <= n; i++) resultado *= i;
  return resultado;
}

/** Pide el mapa y las trazas de ambos modos en una sola llamada. */
export async function obtenerEscenario(
  opciones: OpcionesEscenario,
): Promise<Escenario> {
  const params = new URLSearchParams({
    n: String(opciones.n),
    cerrada: String(opciones.cerrada),
  });
  if (opciones.orden) params.set("orden", opciones.orden);
  if (opciones.grid_size) params.set("grid_size", String(opciones.grid_size));
  if (opciones.semilla !== undefined && opciones.semilla !== null) {
    params.set("semilla", String(opciones.semilla));
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BACKEND_URL}/api/v1/escenario?${params}`, {
      cache: "no-store",
    });
  } catch {
    throw new Error(
      `No se pudo conectar con el backend en ${BACKEND_URL}. ` +
        `Verifica que siga corriendo: cd backend && python3 -m uvicorn app.main:app --reload --port 8000`,
    );
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(
      `El backend respondió ${respuesta.status}. ${detalle.slice(0, 200)}`,
    );
  }

  return respuesta.json();
}
