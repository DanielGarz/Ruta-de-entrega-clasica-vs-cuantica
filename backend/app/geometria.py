"""Geometria compartida por la simulacion clasica y la cuantica.

La ciudad es una cuadricula: los destinos caen sobre nodos de coordenadas
enteras y el vehiculo circula por las calles, asi que la distancia es Manhattan.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass
from itertools import permutations
from typing import Iterator, List, Optional, Sequence, Tuple

GRID_SIZE = 6

_ETIQUETAS = ["Base", "A", "B", "C", "D", "E", "F", "G"]

TOLERANCIA = 1e-9


@dataclass(frozen=True)
class Punto:
    """Un destino del mapa. x e y son coordenadas de la cuadricula, no pixeles."""

    id: int
    x: float
    y: float
    etiqueta: str = ""


def distancia(a: Punto, b: Punto) -> float:
    """Distancia entre dos puntos yendo por las calles: |dx| + |dy|."""
    return abs(a.x - b.x) + abs(a.y - b.y)


def longitud_ruta(ruta: Sequence[Punto], cerrada: bool = False) -> float:
    """Suma los tramos de la ruta; cerrada=True agrega el regreso al deposito."""
    if len(ruta) < 2:
        return 0.0
    total = sum(distancia(ruta[i], ruta[i + 1]) for i in range(len(ruta) - 1))
    if cerrada:
        total += distancia(ruta[-1], ruta[0])
    return total


def rutas_posibles(puntos: Sequence[Punto]) -> Iterator[Tuple[Punto, ...]]:
    """Todas las rutas con el primer punto fijo como deposito.

    Fijarlo es lo que baja 5! = 120 permutaciones a 4! = 24 rutas.
    """
    if not puntos:
        return
    deposito, resto = puntos[0], tuple(puntos[1:])
    for orden in permutations(resto):
        yield (deposito,) + orden


def total_rutas(n_puntos: int) -> int:
    """(n-1)! con el deposito fijo."""
    return math.factorial(n_puntos - 1) if n_puntos > 1 else 1


@dataclass(frozen=True)
class RutaMedida:
    """Una ruta ya calculada, con el orden en que se visitan los puntos."""

    id: int
    orden: List[int]
    distancia: float


def medir_todas_las_rutas(
    puntos: Sequence[Punto], cerrada: bool = False
) -> List[RutaMedida]:
    """Catalogo de rutas con su distancia. Es el punto de partida de ambos modos."""
    medidas: List[RutaMedida] = []
    for i, ruta in enumerate(rutas_posibles(puntos)):
        ids = [p.id for p in ruta]
        if cerrada:
            ids = ids + [ruta[0].id]
        medidas.append(
            RutaMedida(
                id=i,
                orden=ids,
                distancia=round(longitud_ruta(ruta, cerrada=cerrada), 4),
            )
        )
    return medidas


def indices_mas_cortas(rutas: Sequence[RutaMedida]) -> List[int]:
    """Ids de las rutas de distancia minima.

    Devuelve varias porque los empates son frecuentes: en ruta cerrada, una ruta
    y su reversa miden identico. El modo cuantico necesita saber cuantas son.
    """
    if not rutas:
        return []
    minima = min(r.distancia for r in rutas)
    return [r.id for r in rutas if math.isclose(r.distancia, minima, abs_tol=TOLERANCIA)]


def generar_puntos(
    n: int = 5,
    grid_size: int = GRID_SIZE,
    semilla: Optional[int] = None,
) -> List[Punto]:
    """Coloca n destinos sobre nodos distintos de la cuadricula.

    Con la misma semilla ambos modos corren sobre el mismo mapa, que es lo que
    hace justa la comparacion.
    """
    if n < 2:
        raise ValueError("se necesitan al menos 2 puntos")

    nodos = [(x, y) for x in range(grid_size + 1) for y in range(grid_size + 1)]
    if n > len(nodos):
        raise ValueError(
            "no caben %d puntos en una cuadricula de %dx%d" % (n, grid_size, grid_size)
        )

    rng = random.Random(semilla)
    elegidos = rng.sample(nodos, n)
    return [
        Punto(id=i, x=float(x), y=float(y), etiqueta=_etiqueta(i))
        for i, (x, y) in enumerate(elegidos)
    ]


def _etiqueta(i: int) -> str:
    """Nombre visible del punto: Base, A, B, C..."""
    return _ETIQUETAS[i] if i < len(_ETIQUETAS) else "P%d" % i
