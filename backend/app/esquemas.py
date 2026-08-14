"""Contrato de la API. Ambos modos comparten PuntoOut y RutaOut para que el
frontend pueda dibujarlos con el mismo codigo.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from .clasico import OrdenEvaluacion
from .geometria import GRID_SIZE


class PuntoOut(BaseModel):
    """x e y son coordenadas de cuadricula, no pixeles."""

    id: int
    x: float
    y: float
    etiqueta: str = ""


class RutaOut(BaseModel):
    id: int
    orden: List[int]
    distancia: float


class PuntosResponse(BaseModel):
    puntos: List[PuntoOut]
    grid_size: int = GRID_SIZE
    semilla: Optional[int] = None


class _BaseSimulacionRequest(BaseModel):
    puntos: List[PuntoOut] = Field(
        ...,
        min_length=2,
        max_length=8,
        description="Destinos; el primero es el deposito y queda fijo.",
    )
    cerrada: bool = Field(False, description="True = el vehiculo regresa al deposito.")
    semilla: Optional[int] = None


class SimulacionClasicaRequest(_BaseSimulacionRequest):
    orden: OrdenEvaluacion = OrdenEvaluacion.SECUENCIAL


class SimulacionCuanticaRequest(_BaseSimulacionRequest):
    iteraciones: Optional[int] = Field(
        None,
        ge=0,
        le=50,
        description="Forzar iteraciones. None = optimo de Grover.",
    )


class PasoClasicoOut(BaseModel):
    indice: int = Field(..., description="Contador de rutas evaluadas, arranca en 1.")
    ruta_id: int
    ruta: List[int]
    distancia: float
    es_mejor: bool
    mejor_ruta: List[int]
    mejor_distancia: float


class SimulacionClasicaResponse(BaseModel):
    modo: str = "clasico"
    puntos: List[PuntoOut]
    rutas: List[RutaOut]
    cerrada: bool
    orden: OrdenEvaluacion
    total_rutas: int
    pasos: List[PasoClasicoOut]
    mejor_ruta_id: int
    mejor_ruta: List[int]
    mejor_distancia: float
    rutas_evaluadas: int
    empates_en_la_mejor: List[int]


class ProbabilidadRutaOut(BaseModel):
    ruta_id: int
    distancia: float
    probabilidad: float


class PasoCuanticoOut(BaseModel):
    indice: int = Field(..., description="0 = superposicion inicial.")
    probabilidades: List[ProbabilidadRutaOut]
    visibles: List[int]
    eliminadas_en_esta_ronda: List[int]
    probabilidad_marcadas: float


class SimulacionCuanticaResponse(BaseModel):
    modo: str = "cuantico"
    puntos: List[PuntoOut]
    rutas: List[RutaOut]
    cerrada: bool
    total_rutas: int
    pasos: List[PasoCuanticoOut]
    iteraciones: int
    rutas_marcadas: List[int]
    medicion_id: int
    medicion_ruta: List[int]
    medicion_distancia: float
    acerto: bool
    probabilidad_final_marcadas: float


class EscenarioResponse(BaseModel):
    """Los dos modos resueltos sobre el mismo mapa."""

    grid_size: int
    puntos: List[PuntoOut]
    rutas: List[RutaOut]
    cerrada: bool
    semilla: Optional[int] = None
    clasico: SimulacionClasicaResponse
    cuantico: SimulacionCuanticaResponse
    rutas_evaluadas_clasico: int
    iteraciones_cuantico: int
