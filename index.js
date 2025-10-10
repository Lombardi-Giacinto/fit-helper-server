import './config.js'; // Import config first to load environment variables
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import router from './routes/api.route.js';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import mongoSanitize from 'express-mongo-sanitize';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import xss from "xss-clean";
import compression from "compression";
import morgan from "morgan";

const uri = process.env.MONGODB_URI;
const port = process.env.PORT;

const app = express();

//CORS
const allowedOrigins = [
  "https://main.dr3pvtmhloycm.amplifyapp.com",
  "http://localhost:5173"
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin)
      callback(null, true);
    else if (allowedOrigins.includes(origin)) 
      callback(null, origin); 
    else {
      console.error(`CORS Error: Origin ${origin} not allowed.`);
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));


//security
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);
mongoose.set('strictPopulate', true);

app.use(mongoSanitize());
app.use(helmet());

// Rate Limiting: Limita le richieste da uno stesso IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true, 
  legacyHeaders: false, // Disable  X-RateLimit-*
});
app.use(limiter);

// host + upgrade filter
const ALLOWED_HOSTS = new Set(['fithelper.duckdns.org', 'your-domain.com']);
app.use((req, res, next) => {
  const host = (req.headers.host || '').split(':')[0];
  const conn = (req.headers['connection'] || '').toLowerCase();

  if (!host || !ALLOWED_HOSTS.has(host)) return res.status(400).end();
  if (conn === 'upgrade') return res.status(426).end(); // oppure next() se gestisci ws
  next();
});


//other middleware
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());


//cookie debug middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] Richiesta in arrivo: ${req.method} ${req.originalUrl}`);
  console.log('[DEBUG] Headers della richiesta:', req.headers);
  console.log('[DEBUG] Cookie ricevuti da cookieParser:', req.cookies);
  next();
});

//routes
app.get('/', (req, res) => {
  res.json('Home Test');
});
app.use('/api', router);

// Catch-all for 404 Not Found
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Connection to MongoDB and server start
mongoose.connect(uri)
  .then(() => {
    console.log('Connesso a MongoDB');
    app.listen(port, () => {
      console.log(`Server in ascolto su http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Connection error MongoDB:', err);
    process.exit(1);
  });