const ALLOWED_ORIGINS = new Set([
  process.env.BACKEND_URL,
  process.env.FRONTEND_URL,
  process.env.FRONTEND2_URL
]);


export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman, cURL, or server-to-server)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} is not allowed.`));
    }
  },
  credentials: true, // Allows cookies, authorization headers, etc.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'], // Needed if the server returns a JWT
  optionsSuccessStatus: 204, // For legacy browser support
  maxAge: 600, // Cache preflight OPTIONS requests for 10 minutes
};
