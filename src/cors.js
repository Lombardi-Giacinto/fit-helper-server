const ALLOWED_ORIGINS = [
  'https://fithelper.duckdns.org',
  process.env.FRONTEND_URL,
  'http://localhost:3000',
];

export const corsOptions = {
  origin: function (origin, callback) {
    // Consenti richieste senza "origin" (Postman, cURL, server-to-server)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} non è consentito.`));
    }
  },
  credentials: true,// permette cookie, token o header Authorization
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],// se il server restituisce token JWT
  optionsSuccessStatus: 204,// evita problemi con vecchi browser
  maxAge: 600,// caching delle preflight OPTIONS per 10 minuti
};
