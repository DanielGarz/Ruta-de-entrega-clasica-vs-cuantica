# Backend

Aquí está toda la lógica del simulador. El frontend nada más dibuja lo que este
le manda.

## Correrlo

```bash
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

FastAPI genera solo una página para probar los endpoints a mano:
<http://127.0.0.1:8000/docs>

## Pruebas

```bash
python3 -m unittest discover -s tests -v
```

Son 53 y corren con la librería estándar, no hace falta instalar pytest.

## Archivos

- `geometria.py` — la cuadrícula, la distancia entre dos puntos y la lista de
  todas las rutas posibles. Lo usan los dos modos, para que midan igual.
- `clasico.py` — Parte 1, revisa las rutas una por una.
- `cuantico.py` — Parte 2, la amplificación de probabilidad.
- `esquemas.py` — la forma de los datos que salen de la API.
- `main.py` — los endpoints.

## Endpoints

| | |
|---|---|
| `GET /health` | Para ver si está vivo |
| `GET /api/v1/puntos` | Genera un mapa de puntos |
| `POST /api/v1/clasico/simular` | La animación del modo clásico |
| `POST /api/v1/cuantico/simular` | La animación del modo cuántico |
| `GET /api/v1/escenario` | El mapa y los dos modos de una vez |

El frontend usa el último, porque así los dos modos corren sobre los mismos
puntos sin tener que pedirlos por separado.

Parámetros de `/escenario`: `n` (4 o 5 puntos), `cerrada` (si regresa al
punto de partida, por defecto no), `semilla` (para repetir el mismo mapa) y
`grid_size` (qué tan grande es la cuadrícula).

```bash
curl "http://127.0.0.1:8000/api/v1/escenario?n=5&semilla=42"
```

## Cómo viene la respuesta

Las dos simulaciones devuelven una lista de pasos ya resueltos, y el frontend
los va pasando con un temporizador.

En el clásico cada paso trae la ruta que se está probando, su distancia y cuál
era la mejor hasta ese momento. En el cuántico cada paso trae la probabilidad
de todas las rutas, que es lo que el frontend usa como opacidad para irlas
desvaneciendo.

## Detalles

El módulo clásico está escrito a propósito sin optimizaciones. Si lo hacemos
más listo deja de servir para comparar contra el cuántico.

Las iteraciones del cuántico salen de la fórmula de Grover,
`floor((π/4)·√(N/M))`, donde N son las rutas y M cuántas empatan en la
distancia mínima. Hacer más iteraciones de las que dice la fórmula empeora el
resultado en vez de mejorarlo.
