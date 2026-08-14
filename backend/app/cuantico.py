"""Parte 2 - Simulacion cuantica (qubit): amplificacion de probabilidad.

Simula el algoritmo de Grover sobre rutas, corriendo en una maquina clasica: no
hay hardware ni librerias cuanticas. Las N rutas arrancan en superposicion
uniforme y cada iteracion aplica oraculo + difusion, subiendo la probabilidad de
las rutas de distancia minima y bajando la del resto.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from typing import List, Optional, Sequence

from .geometria import (
    Punto,
    RutaMedida,
    indices_mas_cortas,
    medir_todas_las_rutas,
    total_rutas,
)

# Umbral bajo el cual una ruta se considera "desvanecida". Es solo una ayuda
# visual: la opacidad real sale de la probabilidad.
FACTOR_UMBRAL_VISIBLE = 0.5


@dataclass
class ProbabilidadRuta:
    ruta_id: int
    distancia: float
    probabilidad: float


@dataclass
class PasoCuantico:
    """Una iteracion. indice 0 es la superposicion inicial."""

    indice: int
    probabilidades: List[ProbabilidadRuta]
    visibles: List[int] = field(default_factory=list)
    eliminadas_en_esta_ronda: List[int] = field(default_factory=list)
    probabilidad_marcadas: float = 0.0


@dataclass
class ResultadoCuantico:
    puntos: List[Punto]
    rutas: List[RutaMedida]
    cerrada: bool
    total_rutas: int
    pasos: List[PasoCuantico]
    iteraciones: int
    rutas_marcadas: List[int]
    medicion_id: int
    medicion_ruta: List[int]
    medicion_distancia: float
    # La medicion es un muestreo, asi que puede caer fuera de las marcadas.
    acerto: bool
    probabilidad_final_marcadas: float


def iteraciones_optimas(n_rutas: int, n_marcadas: int) -> int:
    """Optimo de Grover: floor((pi/4) * sqrt(N/M)). Pasarse empeora el resultado."""
    if n_rutas <= 0 or n_marcadas <= 0 or n_marcadas >= n_rutas:
        return 0
    return max(1, math.floor((math.pi / 4) * math.sqrt(n_rutas / n_marcadas)))


def simular(
    puntos: Sequence[Punto],
    cerrada: bool = False,
    semilla: Optional[int] = None,
    iteraciones: Optional[int] = None,
) -> ResultadoCuantico:
    """Corre la amplificacion y devuelve la probabilidad de todas las rutas en
    cada iteracion. iteraciones=None usa el optimo de Grover.
    """
    if len(puntos) < 2:
        raise ValueError("se necesitan al menos 2 puntos para armar una ruta")

    puntos = list(puntos)
    rutas = medir_todas_las_rutas(puntos, cerrada=cerrada)
    n = len(rutas)
    marcadas = indices_mas_cortas(rutas)
    es_marcada = [r.id in set(marcadas) for r in rutas]

    k = iteraciones_optimas(n, len(marcadas)) if iteraciones is None else max(0, iteraciones)

    amplitudes = [1.0 / math.sqrt(n)] * n
    umbral = (1.0 / n) * FACTOR_UMBRAL_VISIBLE

    pasos: List[PasoCuantico] = []
    visibles_previas = [r.id for r in rutas]
    pasos.append(_armar_paso(0, rutas, amplitudes, es_marcada, umbral, visibles_previas))
    visibles_previas = list(pasos[0].visibles)

    for paso in range(1, k + 1):
        # Oraculo: invierte el signo de las rutas que cumplen la condicion.
        for i in range(n):
            if es_marcada[i]:
                amplitudes[i] = -amplitudes[i]

        # Difusion: inversion sobre la media.
        media = sum(amplitudes) / n
        amplitudes = [2 * media - a for a in amplitudes]

        frame = _armar_paso(paso, rutas, amplitudes, es_marcada, umbral, visibles_previas)
        pasos.append(frame)
        visibles_previas = list(frame.visibles)

    # Se muestrea en vez de tomar el maximo, que es lo que hace una medicion real.
    probabilidades = [a * a for a in amplitudes]
    rng = random.Random(semilla)
    medida = _muestrear(rng, probabilidades)
    ruta_medida = rutas[medida]

    return ResultadoCuantico(
        puntos=puntos,
        rutas=rutas,
        cerrada=cerrada,
        total_rutas=total_rutas(len(puntos)),
        pasos=pasos,
        iteraciones=k,
        rutas_marcadas=marcadas,
        medicion_id=ruta_medida.id,
        medicion_ruta=list(ruta_medida.orden),
        medicion_distancia=ruta_medida.distancia,
        acerto=ruta_medida.id in set(marcadas),
        probabilidad_final_marcadas=round(
            sum(p for i, p in enumerate(probabilidades) if es_marcada[i]), 6
        ),
    )


def _armar_paso(
    indice: int,
    rutas: Sequence[RutaMedida],
    amplitudes: Sequence[float],
    es_marcada: Sequence[bool],
    umbral: float,
    visibles_previas: Sequence[int],
) -> PasoCuantico:
    probabilidades = [a * a for a in amplitudes]

    detalle = [
        ProbabilidadRuta(
            ruta_id=ruta.id,
            distancia=ruta.distancia,
            probabilidad=round(probabilidades[i], 6),
        )
        for i, ruta in enumerate(rutas)
    ]

    visibles = [ruta.id for i, ruta in enumerate(rutas) if probabilidades[i] >= umbral]
    previas = set(visibles_previas)
    eliminadas = sorted(previas - set(visibles))

    return PasoCuantico(
        indice=indice,
        probabilidades=detalle,
        visibles=visibles,
        eliminadas_en_esta_ronda=eliminadas,
        probabilidad_marcadas=round(
            sum(p for i, p in enumerate(probabilidades) if es_marcada[i]), 6
        ),
    )


def _muestrear(rng: random.Random, probabilidades: Sequence[float]) -> int:
    total = sum(probabilidades)
    objetivo = rng.random() * total
    acumulado = 0.0
    for i, p in enumerate(probabilidades):
        acumulado += p
        if objetivo <= acumulado:
            return i
    return len(probabilidades) - 1
