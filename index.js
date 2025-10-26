import cors from 'cors';
import { corsOptions } from './src/cors.js';
import express from 'express';
import mongoose from 'mongoose';
import router from './routes/api.route.js';
import cookieParser from 'cookie-parser';
import passport from 'passport';
// Security Middleware
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from 'hpp';
// Performance and Logging Middleware
import compression from 'compression';
import morgan from 'morgan';

const app = express();

// ==================================================
// MONGOOSE SECURITY SETTINGS
// ==================================================
// Prevent NoSQL injection removing ($, .) from query objects.
mongoose.set('sanitizeFilter', true);
// Set Mongoose to not allow fields not defined in the schema in queries.
mongoose.set('strictQuery', true);
// Prevents "populate" of paths not explicitly defined in the schema.
mongoose.set('strictPopulate', true);
mongoose.set('debug', true);


// ==================================================
// SECURITY MIDDLEWARE
// ==================================================
// Enable Cross-Origin Resource Sharing with specific options.
app.use(cors(corsOptions));

// ==================================================
//* BODY AND COOKIE PARSING MIDDLEWARE (ESEGUIRE PRIMA DELLA SICUREZZA)
// ==================================================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Set various HTTP headers to help secure the app.
app.use(helmet());
app.set('trust proxy', 1);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false, // Disable  X-RateLimit-*
});
app.use(limiter);
// Protect against HTTP Parameter Pollution attacks.
app.use(hpp());
// Enable logging in development environment for debugging purposes
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use((req, res, next) => {
    console.log(`[DEBUG] ---- Request Start: ${req.method} ${req.originalUrl} ----`);
    console.log('[DEBUG] req.cookies:', req.cookies);
    console.log('[DEBUG] req.body after parsing:', req.body);
    next();
  });
}
app.use(passport.initialize());

// ==================================================
// ROUTES
// ==================================================
// Compress all responses to improve performance.
app.use(compression());
app.get('/', (req, res) => {
  res.json('Home Test');
});
app.use('/api', router);

// ==================================================
// ERROR HANDLING
// ==================================================
// Catch-all for 404 Not Found
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler for all other errors.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ==================================================
// Connection to MongoDB and server start
// ==================================================

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(process.env.PORT, () => {
      console.log(`Server listening on http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });