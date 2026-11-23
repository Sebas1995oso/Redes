const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------
// CONFIGURACIÓN DEL EQUIPO
// Reemplazar por el N real (número de lista del primer integrante
// en orden alfabético por apellido). Ej: N = 12 -> "CIAF-12"
// ---------------------------------------------------------------
const N = process.env.TEAM_N || '1'; // 
const HEADER_NAME = 'x-red-equipo'; // Node normaliza los headers a minúsculas
const HEADER_VALUE = `CIAF-${1}`;

// Origen permitido explícitamente por CORS (simula el front-end del equipo)
const ALLOWED_ORIGIN = 'http://localhost:5500';

// ---------------------------------------------------------------
// 1) CORS (va primero para que responda correctamente los preflight
//    OPTIONS, que el navegador envía SIN credenciales/headers custom)
// ---------------------------------------------------------------
app.use(
  cors({
    origin: ALLOWED_ORIGIN,                         // -> Access-Control-Allow-Origin: http://localhost:5500
    methods: ['GET', 'POST', 'OPTIONS'],            // -> Access-Control-Allow-Methods
    allowedHeaders: ['Content-Type', 'X-Red-Equipo'], // -> Access-Control-Allow-Headers
    exposedHeaders: ['X-Servidor-Procesado'],       // -> Access-Control-Expose-Headers (para que el navegador pueda leerlo)
    optionsSuccessStatus: 204,
  })
);

// ---------------------------------------------------------------
// 2) Parseo de JSON
// ---------------------------------------------------------------
app.use(express.json());

// ---------------------------------------------------------------
// 3) Middleware de validación del header X-Red-Equipo
// ---------------------------------------------------------------
function validarEquipo(req, res, next) {
  const valor = req.get(HEADER_NAME);

  if (!valor || valor !== HEADER_VALUE) {
    return res.status(401).json({
      error: 'Unauthorized',
      mensaje: !valor
        ? 'Falta el encabezado obligatorio X-Red-Equipo.'
        : 'El valor del encabezado X-Red-Equipo es incorrecto.',
      esperado: 'X-Red-Equipo: CIAF-N (donde N es el número del equipo)',
    });
  }

  // Header de respuesta personalizado para respuestas autorizadas
  res.set('X-Servidor-Procesado', `Equipo-${N}`);
  next();
}

app.use('/api', validarEquipo);

// ---------------------------------------------------------------
// 4) Datos en memoria (simulan una base de datos)
// ---------------------------------------------------------------
const envios = [
  { id: 1, guia: 'ENV-1001', destino: 'Pereira', estado: 'En tránsito' },
  { id: 2, guia: 'ENV-1002', destino: 'Bogotá', estado: 'Entregado' },
];

// ---------------------------------------------------------------
// 5) Endpoints
// ---------------------------------------------------------------

// GET /api/envios  -> consulta (opcional: ?guia=ENV-1001)
app.get('/api/envios', (req, res) => {
  const { guia } = req.query;
  const resultado = guia ? envios.filter((e) => e.guia === guia) : envios;
  res.status(200).json({ total: resultado.length, data: resultado });
});

// POST /api/envios -> registro (JSON: { guia, destino, estado })
app.post('/api/envios', (req, res) => {
  const { guia, destino, estado } = req.body || {};

  if (!guia || !destino || !estado) {
    return res.status(400).json({
      error: 'Bad Request',
      mensaje: 'El cuerpo JSON debe incluir: guia, destino y estado.',
    });
  }

  const nuevo = { id: envios.length + 1, guia, destino, estado };
  envios.push(nuevo);
  res.status(201).json({ mensaje: 'Envío registrado', data: nuevo });
});

// ---------------------------------------------------------------
// 6) Manejo de errores (p. ej. JSON mal formado -> 400)
// ---------------------------------------------------------------
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Bad Request',
      mensaje: 'El cuerpo de la petición no es un JSON válido.',
    });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log(`CORS permitido para: ${ALLOWED_ORIGIN}`);
  console.log(`Header requerido -> X-Red-Equipo: ${HEADER_VALUE}`);
});