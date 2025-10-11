const ALLOWED_ORIGINS = [
  'https://fithelper.duckdns.org',
  'https://main.dr3pvtmhloycm.amplifyapp.com',
  'http://localhost:3000',
];

export const corsOptions = {
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],
  exposedHeaders: ['Authorization'], // se il server restituisce token JWT
  credentials: true, // permette cookie, token o header Authorization
  maxAge: 600, // caching delle preflight OPTIONS per 10 minuti
  preflightContinue: false, // Express gestisce la risposta automaticamente
  optionsSuccessStatus: 204, // evita problemi con vecchi browser
};
