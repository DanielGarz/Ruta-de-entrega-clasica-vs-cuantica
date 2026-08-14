"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { factorial, obtenerEscenario } from "@/lib/api";
import type { Escenario, EstadoSimulacion, ModoSimulacion } from "@/lib/tipos";

// El cuántico va más lento porque son 2 o 3 iteraciones contra 24 rutas.
const INTERVALO_MS_CLASICO = 240;
const INTERVALO_MS_CUANTICO = 1100;

export function useSimulacion() {
  const [n, setN] = useState<4 | 5>(5);
  const [cerrada, setCerrada] = useState(false);

  const [escenario, setEscenario] = useState<Escenario | null>(null);
  const [modoActivo, setModoActivo] = useState<ModoSimulacion | null>(null);
  const [estado, setEstado] = useState<EstadoSimulacion>("cargando");
  const [error, setError] = useState<string | null>(null);

  const [indicePaso, setIndicePaso] = useState(0);
  const [rutaGanadora, setRutaGanadora] = useState<number[] | null>(null);

  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const limpiarIntervalo = useCallback(() => {
    if (intervaloRef.current !== null) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  }, []);

  useEffect(() => limpiarIntervalo, [limpiarIntervalo]);

  const reiniciarVista = useCallback(() => {
    limpiarIntervalo();
    setIndicePaso(0);
    setRutaGanadora(null);
    setModoActivo(null);
  }, [limpiarIntervalo]);

  /** Pide un escenario nuevo y deja el mapa listo, sin animar nada. */
  const cargarEscenario = useCallback(
    async (opciones: { n: 4 | 5; cerrada: boolean }) => {
      reiniciarVista();
      setEstado("cargando");
      setError(null);
      try {
        const data = await obtenerEscenario(opciones);
        setEscenario(data);
        setEstado("inactivo");
      } catch (err) {
        setEscenario(null);
        setEstado("inactivo");
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    },
    [reiniciarVista],
  );

  useEffect(() => {
    cargarEscenario({ n: 5, cerrada: false });
  }, [cargarEscenario]);

  /** Anima la traza del modo elegido sobre el escenario ya cargado. */
  const iniciar = useCallback(
    (modo: ModoSimulacion) => {
      if (!escenario) return;
      limpiarIntervalo();
      setModoActivo(modo);
      setRutaGanadora(null);
      setIndicePaso(0);
      setEstado("corriendo");

      const traza =
        modo === "clasico" ? escenario.clasico.pasos : escenario.cuantico.pasos;
      const intervalo =
        modo === "clasico" ? INTERVALO_MS_CLASICO : INTERVALO_MS_CUANTICO;

      let i = 0;
      intervaloRef.current = setInterval(() => {
        i++;
        if (i >= traza.length) {
          limpiarIntervalo();
          setIndicePaso(traza.length - 1);
          setRutaGanadora(
            modo === "clasico"
              ? escenario.clasico.mejor_ruta
              : escenario.cuantico.medicion_ruta,
          );
          setEstado("finalizado");
          return;
        }
        setIndicePaso(i);
      }, intervalo);
    },
    [escenario, limpiarIntervalo],
  );

  const nuevoMapa = useCallback(() => {
    cargarEscenario({ n, cerrada });
  }, [cargarEscenario, n, cerrada]);

  const cambiarN = useCallback(
    (valor: 4 | 5) => {
      setN(valor);
      cargarEscenario({ n: valor, cerrada });
    },
    [cargarEscenario, cerrada],
  );

  const cambiarCerrada = useCallback(
    (valor: boolean) => {
      setCerrada(valor);
      cargarEscenario({ n, cerrada: valor });
    },
    [cargarEscenario, n],
  );

  const repetir = useCallback(() => {
    if (modoActivo) iniciar(modoActivo);
  }, [modoActivo, iniciar]);

  const pasoClasico =
    modoActivo === "clasico" && escenario
      ? escenario.clasico.pasos[indicePaso]
      : null;

  const pasoCuantico =
    modoActivo === "cuantico" && escenario
      ? escenario.cuantico.pasos[indicePaso]
      : null;

  const corriendo = estado === "corriendo" || estado === "cargando";

  const totalFrames = escenario
    ? modoActivo === "clasico"
      ? escenario.clasico.pasos.length
      : modoActivo === "cuantico"
        ? escenario.cuantico.pasos.length - 1 // el paso 0 es la superposición
        : 0
    : 0;

  const contador =
    modoActivo === "clasico"
      ? (pasoClasico?.indice ?? 0)
      : (pasoCuantico?.indice ?? 0);

  // Al terminar solo se dibuja la ganadora; las descartadas desaparecen.
  const finalizado = estado === "finalizado";

  return {
    n,
    cerrada,
    cambiarN,
    cambiarCerrada,
    escenario,
    error,
    estado,
    modoActivo,
    corriendo,
    iniciar,
    nuevoMapa,
    repetir,
    pasoClasico,
    pasoCuantico,
    rutaGanadora,
    contador,
    totalFrames,
    rutaClasicaId: finalizado ? null : (pasoClasico?.ruta_id ?? null),
    mejorParcial: finalizado ? null : (pasoClasico?.mejor_ruta ?? null),
    probabilidades: finalizado ? null : (pasoCuantico?.probabilidades ?? null),
    posibilidades: escenario?.clasico.total_rutas ?? factorial(n - 1),
  };
}
