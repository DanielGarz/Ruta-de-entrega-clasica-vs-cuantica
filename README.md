# Ruta de entrega — clásica vs cuántica

Proyecto de la materia. Simula cómo un vehículo de reparto busca la ruta más
corta para visitar 4 o 5 puntos, resolviéndolo de dos formas sobre el mismo
mapa: una clásica (bit) y otra cuántica simulada (qubit). La idea es que se
vea la diferencia entre las dos, no solo que salga el resultado.

![Captura del simulador](frontend/public/portada.png)

En el ejemplo de la imagen, con 5 puntos: el modo clásico probó las 24 rutas
una por una y el cuántico llegó a la misma respuesta (distancia 16) en 3
iteraciones.

## El problema

Es el problema del agente viajero, en chiquito. Con 5 puntos y dejando fijo el
punto de partida hay 4! = 24 rutas posibles, y para estar seguros de cuál es la
más corta hay que revisarlas todas. No hay atajo.

El detalle interesante es cómo crece: con 6 puntos son 120 rutas, con 8 son
5040 y con 11 ya son más de 3 millones.

La ciudad es una cuadrícula, así que el vehículo se mueve por las calles y
nunca en diagonal. Por eso la distancia se mide sumando cuadras
(`|dx| + |dy|`), no en línea recta.

## Cómo funciona cada modo

**Clásico (bit).** Un bit está en un solo estado a la vez, así que el programa
revisa una ruta a la vez: la mide, la compara con la mejor que llevaba y pasa a
la siguiente. En pantalla se ve una sola ruta roja cambiando, con un contador
que sube hasta 24.

Está hecho a propósito sin optimizaciones. Si le pusiéramos algún truco para
descartar rutas antes de medirlas ya no serviría para comparar contra el modo
cuántico.

**Cuántico (qubit).** Es una simulación del algoritmo de Grover; no hay
computadora cuántica de por medio. Las 24 rutas empiezan todas con la misma
probabilidad (1/24) y en cada iteración se le sube la probabilidad a la más
corta y se le baja a las demás. En pantalla se ven las 24 dibujadas al mismo
tiempo y las malas se van desvaneciendo.

El número de iteraciones no lo escogimos nosotros, sale de la fórmula de
Grover: `k = (π/4)·√(N/M)`. Para 24 rutas dan 3 iteraciones y termina con
alrededor de 98% de probabilidad de acertar.

## Tecnologías

| | |
|---|---|
| Backend | Python con FastAPI |
| Frontend | Next.js con TypeScript y Tailwind |

Toda la lógica (permutaciones, distancias, probabilidades) está en el backend.
El frontend solo dibuja lo que le llega.

## Cómo correrlo

Se necesitan dos terminales.

Backend:

```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Y se abre <http://localhost:3000>.

Ojo: el backend no tiene página propia, si entras al puerto 8000 directo sale
un 404 y es normal. La aplicación está en el 3000.

## Estructura

```
backend/
  app/
    geometria.py    la cuadrícula, las distancias y todas las rutas posibles
    clasico.py      Parte 1: fuerza bruta
    cuantico.py     Parte 2: amplificación de probabilidad
    esquemas.py     qué forma tienen los datos que devuelve la API
    main.py         los endpoints
  tests/            53 pruebas

frontend/src/
  app/page.tsx      la pantalla
  components/       el mapa y los controles
  hooks/            reproduce la animación
  lib/              tipos, llamada a la API y dibujo del SVG
```

El backend manda toda la animación resuelta en una sola llamada, y el frontend
la va pasando con un temporizador. Así el servidor no tiene que guardar nada
entre paso y paso.

Para correr las pruebas:

```bash
cd backend
python3 -m unittest discover -s tests
```

## Dos cosas que nos pasaron

**Los empates son comunes.** Como la distancia se mide por cuadras y las
coordenadas son enteras, varias rutas distintas miden exactamente lo mismo. Es
normal que el modo clásico y el cuántico terminen mostrando rutas diferentes
con la misma distancia; no está mal, simplemente empataron.

**El modo cuántico a veces falla.** Al final se hace una medición según las
probabilidades, así que como en un 2% de los casos cae en una ruta que no es la
mínima. Lo dejamos así en vez de forzar el resultado, porque justamente eso es
lo que significa que el algoritmo sea probabilístico.

## El caso que nos tocó

> **Caso 3 — Ruta óptima de entrega (mini TSP, 4 a 5 puntos)**
>
> Un dron de entrega debe visitar 4 o 5 puntos siguiendo la ruta más corta
> posible. Mecanismo cuántico: A — amplificación de probabilidad, aplicada a
> rutas en vez de casillas.
>
> **Parte 1 (bit):** calcular todas las permutaciones, dibujar cada ruta una por
> una con su distancia y un contador, y al final resaltar la más corta.
>
> **Parte 2 (qubit):** dibujar todas las rutas a la vez semi-transparentes
> (superposición), darles la misma probabilidad inicial y en cada iteración
> subir la de la más corta y bajar las demás, hasta que quede una sola
> brillante. Medir al final con la función ponderada.
>
> Debe verse el mapa con los puntos y las rutas, una sola ruta a la vez en
> clásico, todas a la vez en cuántico, y el contador de rutas evaluadas contra
> el de iteraciones.
