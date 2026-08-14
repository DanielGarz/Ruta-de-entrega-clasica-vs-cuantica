"""Parte 1 - Simulacion clasica (bit).

Fuerza bruta: evalua las rutas una por una, sin podar ni optimizar. No agregar
vecino mas cercano ni programacion dinamica; si el clasico se vuelve listo deja
de servir como grupo de control frente al modo cuantico.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Sequence

from .geometria import (
    Punto,
    RutaMedida,
    indices_mas_cortas,
    medir_todas_las_rutas,
    total_rutas,
)


class OrdenEvaluacion(str, Enum):
    SECUENCIAL = "secuencial"
    ALEATORIO = "aleatorio"


@dataclass
class PasoClasico:
    """Una ruta evaluada: un frame de la animacion."""

    indice: int
    ruta_id: int
    ruta: List[int]
    distancia: float
    es_mejor: bool
    mejor_ruta: List[int] = field(default_factory=list)
    mejor_distancia: float = 0.0


@dataclass
class ResultadoClasico:
    puntos: List[Punto]
    rutas: List[RutaMedida]
    cerrada: bool
    orden: OrdenEvaluacion
    total_rutas: int
    pasos: List[PasoClasico]
    mejor_ruta_id: int
    mejor_ruta: List[int]
    mejor_distancia: float
    rutas_evaluadas: int
    empates_en_la_mejor: List[int]


def simular(
    puntos: Sequence[Punto],
    cerrada: bool = False,
    orden: OrdenEvaluacion = OrdenEvaluacion.SECUENCIAL,
    semilla: Optional[int] = None,
) -> ResultadoClasico:
    """Recorre todas las rutas posibles y se queda con la mas corta.

    Devuelve la traza completa para que el frontend la anime paso a paso.
    """
    if len(puntos) < 2:
        raise ValueError("se necesitan al menos 2 puntos para armar una ruta")

    puntos = list(puntos)
    rutas = medir_todas_las_rutas(puntos, cerrada=cerrada)

    secuencia = list(rutas)
    if orden == OrdenEvaluacion.ALEATORIO:
        random.Random(semilla).shuffle(secuencia)

    pasos: List[PasoClasico] = []
    mejor_ruta_id = -1
    mejor_ruta: List[int] = []
    mejor_distancia = float("inf")

    for indice, ruta in enumerate(secuencia, start=1):
        es_mejor = ruta.distancia < mejor_distancia
        if es_mejor:
            mejor_ruta_id = ruta.id
            mejor_ruta = list(ruta.orden)
            mejor_distancia = ruta.distancia

        pasos.append(
            PasoClasico(
                indice=indice,
                ruta_id=ruta.id,
                ruta=list(ruta.orden),
                distancia=ruta.distancia,
                es_mejor=es_mejor,
                mejor_ruta=list(mejor_ruta),
                mejor_distancia=mejor_distancia,
            )
        )

    return ResultadoClasico(
        puntos=puntos,
        rutas=rutas,
        cerrada=cerrada,
        orden=orden,
        total_rutas=total_rutas(len(puntos)),
        pasos=pasos,
        mejor_ruta_id=mejor_ruta_id,
        mejor_ruta=mejor_ruta,
        mejor_distancia=mejor_distancia,
        rutas_evaluadas=len(pasos),
        empates_en_la_mejor=indices_mas_cortas(rutas),
    )
