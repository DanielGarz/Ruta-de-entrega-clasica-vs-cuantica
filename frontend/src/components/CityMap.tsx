"use client";

import { useMemo } from "react";
import {
  ANCHO_CALLE,
  construirTramosRuta,
  construirTrazoRuta,
  ESPACIADO_NODO,
  indexarPuntos,
  indexarRutas,
  nodoAPixeles,
  probabilidadAOpacidad,
  tamanoLienzo,
} from "@/lib/mapa-geometria";
import type { Escenario, ProbabilidadRuta, Punto } from "@/lib/tipos";

/** Dibuja la cuadrícula, los puntos y las rutas ya resueltas por el backend. */
interface Props {
  escenario: Escenario | null;
  /** Clásico: la única ruta visible en este frame. */
  rutaClasicaId: number | null;
  /** Clásico: la campeona vigente, al fondo. */
  mejorParcial: number[] | null;
  /** Cuántico: probabilidad de todas las rutas en este frame. */
  probabilidades: ProbabilidadRuta[] | null;
  rutaGanadora: number[] | null;
}

const ROJO = "#ef4444";
const VERDE = "#22c55e";
const AMBAR = "#f59e0b";

/** Pinta el mapa completo: calles, edificios, puntos y las rutas de cada modo. */
export default function CityMap({
  escenario,
  rutaClasicaId,
  mejorParcial,
  probabilidades,
  rutaGanadora,
}: Props) {
  // Cuadrícula vacía por default para que el layout no salte al cargar.
  const gridSize = escenario?.grid_size ?? 6;
  const { ancho, alto } = tamanoLienzo(gridSize);

  const puntosPorId = useMemo(
    () =>
      escenario ? indexarPuntos(escenario.puntos) : new Map<number, Punto>(),
    [escenario],
  );
  const rutasPorId = useMemo(
    () => (escenario ? indexarRutas(escenario.rutas) : new Map()),
    [escenario],
  );

  const edificios = useMemo(() => {
    const lista: { x: number; y: number }[] = [];
    for (let col = 0; col < gridSize; col++) {
      for (let fila = 0; fila < gridSize; fila++) {
        lista.push({ x: col, y: fila });
      }
    }
    return lista;
  }, [gridSize]);

  const rutaClasica =
    rutaClasicaId !== null ? rutasPorId.get(rutaClasicaId) : undefined;

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        width="100%"
        style={{ maxWidth: ancho }}
        className="rounded-lg"
        role="img"
        aria-label="Mapa de la ciudad con las rutas de entrega"
      >
        <rect x={0} y={0} width={ancho} height={alto} fill="#f5f5f5" />

        {edificios.map((b) => {
          const esquina = nodoAPixeles(b);
          const tamano = ESPACIADO_NODO - ANCHO_CALLE;
          return (
            <rect
              key={`${b.x}-${b.y}`}
              x={esquina.x + ANCHO_CALLE / 2}
              y={esquina.y + ANCHO_CALLE / 2}
              width={tamano}
              height={tamano}
              fill="#3a3a3a"
              rx={3}
            />
          );
        })}

        <rect
          x={2}
          y={2}
          width={ancho - 4}
          height={alto - 4}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth={4}
        />

        {/* Cuántico: todas a la vez, con opacidad según su probabilidad. */}
        {probabilidades?.map((pr) => {
          const ruta = rutasPorId.get(pr.ruta_id);
          if (!ruta) return null;
          const opacidad = probabilidadAOpacidad(pr.probabilidad);
          return (
            <path
              key={`q-${pr.ruta_id}`}
              d={construirTrazoRuta(ruta.orden, puntosPorId)}
              fill="none"
              stroke={ROJO}
              strokeWidth={3 + 4 * pr.probabilidad}
              strokeOpacity={opacidad}
              strokeLinecap="round"
            />
          );
        })}

        {/* Clásico: la campeona vigente, tenue al fondo. */}
        {mejorParcial && (
          <path
            d={construirTrazoRuta(mejorParcial, puntosPorId)}
            fill="none"
            stroke={AMBAR}
            strokeWidth={5}
            strokeOpacity={0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Clásico: la ruta que se está probando. */}
        {rutaClasica && (
          <RutaConFlechas
            orden={rutaClasica.orden}
            puntosPorId={puntosPorId}
            color={ROJO}
            grosor={5}
          />
        )}

        {rutaGanadora && (
          <RutaConFlechas
            orden={rutaGanadora}
            puntosPorId={puntosPorId}
            color={VERDE}
            grosor={6}
          />
        )}

        {escenario?.puntos.map((p) => {
          const { x, y } = nodoAPixeles(p);
          const esDeposito = p.id === 0;
          return (
            <g key={p.id}>
              <circle
                cx={x}
                cy={y}
                r={esDeposito ? 14 : 12}
                fill={esDeposito ? "#3b82f6" : "#ffffff"}
                stroke="#1a1a1a"
                strokeWidth={2}
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight="bold"
                fill={esDeposito ? "#ffffff" : "#1a1a1a"}
              >
                {p.etiqueta || String(p.id)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Dibuja una ruta con una flecha en cada tramo para ver el orden del recorrido. */
function RutaConFlechas({
  orden,
  puntosPorId,
  color,
  grosor,
}: {
  orden: number[];
  puntosPorId: Map<number, Punto>;
  color: string;
  grosor: number;
}) {
  const tramos = useMemo(
    () => construirTramosRuta(orden, puntosPorId),
    [orden, puntosPorId],
  );

  const TAMANO_FLECHA = 7;

  return (
    <g>
      <path
        d={construirTrazoRuta(orden, puntosPorId)}
        fill="none"
        stroke={color}
        strokeWidth={grosor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {tramos.map((tramo, i) => (
        <polygon
          // biome-ignore lint/suspicious/noArrayIndexKey: los tramos son posicionales
          key={i}
          points={`0,-${TAMANO_FLECHA * 0.65} ${TAMANO_FLECHA},0 0,${TAMANO_FLECHA * 0.65}`}
          fill={color}
          stroke="#1a1a1a"
          strokeWidth={1}
          transform={`translate(${tramo.puntoMedio.x}, ${tramo.puntoMedio.y}) rotate(${tramo.angulo})`}
        />
      ))}
    </g>
  );
}
