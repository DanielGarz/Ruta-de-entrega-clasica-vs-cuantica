import type { Punto, Ruta } from "./tipos";

export const ESPACIADO_NODO = 80;
export const ANCHO_CALLE = 22;
export const MARGEN = 50;

export function nodoAPixeles(punto: { x: number; y: number }) {
  return {
    x: MARGEN + punto.x * ESPACIADO_NODO,
    y: MARGEN + punto.y * ESPACIADO_NODO,
  };
}

export function tamanoLienzo(gridSize: number) {
  const lado = MARGEN * 2 + gridSize * ESPACIADO_NODO;
  return { ancho: lado, alto: lado };
}

/**
 * Arma el `d` de un `<path>` siguiendo las calles: entre cada par de puntos
 * avanza primero en horizontal y luego en vertical. Da igual dónde se dé el
 * giro, la distancia Manhattan es la misma.
 */
export function construirTrazoRuta(
  orden: number[],
  puntosPorId: Map<number, Punto>,
): string {
  let d = "";

  for (let i = 0; i < orden.length; i++) {
    const punto = puntosPorId.get(orden[i]);
    if (!punto) continue;
    const { x, y } = nodoAPixeles(punto);

    if (i === 0) {
      d += `M ${x} ${y}`;
      continue;
    }

    const anterior = puntosPorId.get(orden[i - 1]);
    if (!anterior) continue;
    const pxAnterior = nodoAPixeles(anterior);

    d += ` L ${x} ${pxAnterior.y} L ${x} ${y}`;
  }

  return d;
}

export interface TramoRuta {
  d: string;
  puntoMedio: { x: number; y: number };
  /** Grados. */
  angulo: number;
}

/** Parte la ruta en tramos para poder dibujar una flecha sobre cada uno. */
export function construirTramosRuta(
  orden: number[],
  puntosPorId: Map<number, Punto>,
): TramoRuta[] {
  const tramos: TramoRuta[] = [];

  for (let i = 1; i < orden.length; i++) {
    const desde = puntosPorId.get(orden[i - 1]);
    const hasta = puntosPorId.get(orden[i]);
    if (!desde || !hasta) continue;

    const pxDesde = nodoAPixeles(desde);
    const pxHasta = nodoAPixeles(hasta);
    const esquina = { x: pxHasta.x, y: pxDesde.y };

    const d = `M ${pxDesde.x} ${pxDesde.y} L ${esquina.x} ${esquina.y} L ${pxHasta.x} ${pxHasta.y}`;

    // La flecha va en el sub-tramo que entra al destino; si mide 0, en el otro.
    let dirX = pxHasta.x - esquina.x;
    let dirY = pxHasta.y - esquina.y;
    let puntoMedio = {
      x: (esquina.x + pxHasta.x) / 2,
      y: (esquina.y + pxHasta.y) / 2,
    };

    if (dirX === 0 && dirY === 0) {
      dirX = esquina.x - pxDesde.x;
      dirY = esquina.y - pxDesde.y;
      puntoMedio = {
        x: (pxDesde.x + esquina.x) / 2,
        y: (pxDesde.y + esquina.y) / 2,
      };
    }

    tramos.push({
      d,
      puntoMedio,
      angulo: (Math.atan2(dirY, dirX) * 180) / Math.PI,
    });
  }

  return tramos;
}

/**
 * Opacidad del trazo según su probabilidad. La raíz cuadrada evita que con 24
 * rutas en superposición (1/24 cada una) queden todas invisibles.
 */
export function probabilidadAOpacidad(probabilidad: number): number {
  const p = Math.max(0, Math.min(1, probabilidad));
  return 0.05 + 0.95 * Math.sqrt(p);
}

export function indexarPuntos(puntos: Punto[]): Map<number, Punto> {
  return new Map(puntos.map((p) => [p.id, p]));
}

export function indexarRutas(rutas: Ruta[]): Map<number, Ruta> {
  return new Map(rutas.map((r) => [r.id, r]));
}
