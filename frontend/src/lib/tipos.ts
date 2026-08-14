/** Espejo del contrato del backend (`backend/app/esquemas.py`). */

/** El id 0 es siempre el depósito. x e y son de cuadrícula, no píxeles. */
export interface Punto {
  id: number;
  x: number;
  y: number;
  etiqueta: string;
}

export interface Ruta {
  id: number;
  orden: number[];
  distancia: number;
}

export type OrdenEvaluacion = "secuencial" | "aleatorio";

export interface PasoClasico {
  indice: number;
  ruta_id: number;
  ruta: number[];
  distancia: number;
  es_mejor: boolean;
  mejor_ruta: number[];
  mejor_distancia: number;
}

export interface SimulacionClasica {
  modo: "clasico";
  rutas: Ruta[];
  total_rutas: number;
  pasos: PasoClasico[];
  mejor_ruta_id: number;
  mejor_ruta: number[];
  mejor_distancia: number;
  rutas_evaluadas: number;
  empates_en_la_mejor: number[];
}

export interface ProbabilidadRuta {
  ruta_id: number;
  distancia: number;
  probabilidad: number;
}

/** indice 0 es la superposición inicial. */
export interface PasoCuantico {
  indice: number;
  probabilidades: ProbabilidadRuta[];
  visibles: number[];
  eliminadas_en_esta_ronda: number[];
  probabilidad_marcadas: number;
}

export interface SimulacionCuantica {
  modo: "cuantico";
  rutas: Ruta[];
  total_rutas: number;
  pasos: PasoCuantico[];
  iteraciones: number;
  rutas_marcadas: number[];
  medicion_id: number;
  medicion_ruta: number[];
  medicion_distancia: number;
  acerto: boolean;
  probabilidad_final_marcadas: number;
}

export interface Escenario {
  grid_size: number;
  puntos: Punto[];
  rutas: Ruta[];
  cerrada: boolean;
  semilla: number | null;
  clasico: SimulacionClasica;
  cuantico: SimulacionCuantica;
  rutas_evaluadas_clasico: number;
  iteraciones_cuantico: number;
}

export interface OpcionesEscenario {
  n: number;
  cerrada: boolean;
  orden?: OrdenEvaluacion;
  semilla?: number | null;
  grid_size?: number;
}

export type ModoSimulacion = "clasico" | "cuantico";

export type EstadoSimulacion =
  | "inactivo"
  | "cargando"
  | "corriendo"
  | "finalizado";
